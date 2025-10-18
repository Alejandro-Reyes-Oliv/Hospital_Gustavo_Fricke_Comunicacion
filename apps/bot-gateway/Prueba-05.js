// apps/bot-gateway/Prueba-05.js
// Node 18+: fetch global disponible

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;               // token de app Meta
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;    // id del número de WhatsApp
const GRAPH_BASE = process.env.WHATSAPP_API_BASE || "https://graph.facebook.com/v23.0";

// Helper para llamar a Meta y retornar el JSON (contiene wamid)
async function metaRequest(body) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error("Config WhatsApp incompleta. Revisa .env (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID)");
  }

  const url = `${GRAPH_BASE}/${PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[MetaError]", res.status, JSON.stringify(data));
    throw new Error(`Meta API ${res.status}`);
  }
  return data;
}

/**
 * Enviar recordatorio de cita:
 * 1) Plantilla con parámetros (texto del recordatorio)
 * 2) Botones interactivos con payload dinámico CONFIRMAR/RECHAZAR:{citaId}
 *
 * Retorna: { wamidTemplate, wamidInteractive }
 *
 * @param {Object} args
 * @param {string} args.to              - teléfono E.164 (ej: +56973882698)
 * @param {Object} args.params          - { pacienteNombre, especialidad, fechaStr, horaStr, lugar }
 * @param {number|string} args.citaId   - id de la cita (para el payload del botón)
 * @param {string} [args.templateName]  - nombre de la plantilla en Meta (por defecto "confirmacion_cita_medica")
 * @param {string} [args.languageCode]  - código de idioma (por defecto "es")
 */
export async function enviarRecordatorio({
  to,
  params,
  citaId,
  templateName = "confirmacion_cita_medica",
  languageCode = "es",
}) {
  // 1) PLANTILLA
  const templateBody = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: params.pacienteNombre }, // {{1}}
            { type: "text", text: params.especialidad },   // {{2}}
            { type: "text", text: params.fechaStr },       // {{3}}
            { type: "text", text: params.horaStr },        // {{4}}
            { type: "text", text: params.lugar },          // {{5}}
          ],
        },
      ],
    },
  };

  const respTpl = await metaRequest(templateBody);
  const wamidTemplate = respTpl?.messages?.[0]?.id || null;

  // 2) BOTONES
  const interactiveButtons = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: "¿Confirmas tu asistencia?" },
      action: {
        buttons: [
          { type: "reply", reply: { id: `CONFIRMAR:${citaId}`, title: "Confirmar" } },
          { type: "reply", reply: { id: `RECHAZAR:${citaId}`, title: "Cancelar" } },
        ],
      },
    },
  };

  const respInt = await metaRequest(interactiveButtons);
  const wamidInteractive = respInt?.messages?.[0]?.id || null;

  return { wamidTemplate, wamidInteractive };
}
