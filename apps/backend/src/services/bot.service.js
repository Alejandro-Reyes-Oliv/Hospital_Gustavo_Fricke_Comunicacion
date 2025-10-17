// apps/backend/src/services/bot.service.js
import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import { enviarRecordatorio } from "../../../bot-gateway/Prueba-05.js";

/* ===================== Utils ===================== */
function toE164Cl(raw) {
  const n = String(raw ?? "").replace(/[^\d]/g, "");
  if (!n) throw new Error("Teléfono inválido");
  if (n.startsWith("56")) return `+${n}`;
  if (n.length === 9) return `+56${n}`;
  return `+${n}`;
}

function formatCL(dt) {
  const fechaStr = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  }).format(dt);
  const horaStr  = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(dt);
  return { fechaStr, horaStr };
}

const newId = () => crypto.randomUUID();

/* ===================== OUTBOUND ===================== */
/**
 * Enviar confirmación para una cita concreta y registrar OUTBOUND
 * @param {{citaId: number, toPhone: string}} args
 */
export async function sendConfirmation({ citaId, toPhone }) {
  const to = toE164Cl(toPhone);

  // Enriquecer con datos de la cita
  const c = await prisma.cita.findUnique({
    where: { id: citaId },
    select: {
      id: true,
      fecha_hora: true,
      paciente_nombre: true,
      especialidad_snap: true,
    },
  });
  if (!c) throw new Error("Cita no encontrada");

  const { fechaStr, horaStr } = formatCL(new Date(c.fecha_hora));
  const params = {
    pacienteNombre: c.paciente_nombre || "Paciente",
    especialidad:   c.especialidad_snap || "Consulta",
    fechaStr,
    horaStr,
    lugar: "Hospital Gustavo Fricke – Endoscopía",
  };

  const correlationId = newId();

  // Disparar: plantilla + botones; recuperar wamid del interactivo
  const { wamidTemplate, wamidInteractive } = await enviarRecordatorio({
    to,
    citaId: c.id,
    params,
  });

  // Registrar OUTBOUND
  const out = await prisma.botMessage.create({
    data: {
      citaId: c.id,
      direction: "OUTBOUND",
      provider: "whatsapp",
      providerMessageId: wamidInteractive ?? null, // el que recibe replies (context.id)
      correlationId,
      toPhone: to,
      text: "¿Confirmas tu asistencia?",
      payload: { type: "interactive.confirm", citaId: c.id, wamidTemplate, wamidInteractive },
      status: "PENDING", // por tu enum: aún no hay reply
    },
  });

  // Upsert estado de confirmación
  await prisma.citaConfirmation.upsert({
    where: { citaId: c.id },
    create: { citaId: c.id, state: "PENDING", confirmationMsgId: out.id },
    update: { confirmationMsgId: out.id, state: "PENDING" },
  });

  return { messageId: out.id, providerMessageId: out.providerMessageId };
}

/* ===================== INBOUND (webhook) ===================== */
/**
 * Procesa el cuerpo que llega a /api/bot/events
 * - Si viene NORMALIZADO desde gateway -> usar tal cual
 * - Si viene RAW (body.entry...) -> normalizar aquí (fallback)
 */
export async function processInboundEvent(body) {
  // Caso A: ya normalizado por el gateway
  if (body && body.provider === "whatsapp") {
    return ingestNormalizedEvent(body);
  }

  // Caso B: RAW de Meta (fallback)
  if (body?.entry?.length) {
    for (const entry of body.entry) {
      const changes = entry?.changes || [];
      for (const ch of changes) {
        const value = ch?.value;
        if (!value) continue;

        // mensajes entrantes
        for (const m of value?.messages || []) {
          const fromPhone = m.from;
          const providerMessageId = m.id;
          const replyToMessageId = m?.context?.id ?? null;

          if (m.type === "text") {
            await ingestNormalizedEvent({
              provider: "whatsapp",
              fromPhone,
              providerMessageId,
              replyToMessageId,
              text: m.text?.body || null,
              interactivePayload: null,
              raw: m,
            });
          } else if (m.type === "interactive") {
            await ingestNormalizedEvent({
              provider: "whatsapp",
              fromPhone,
              providerMessageId,
              replyToMessageId,
              text: null,
              interactivePayload: m.interactive, // button_reply / list_reply
              raw: m,
            });
          }
        }

        // statuses (sent/delivered/read/failed) → mapeamos a tu enum
        for (const s of value?.statuses || []) {
          const waId = s.id;
          const status = s.status; // sent | delivered | read | failed

          let newStatus = undefined;
          if (status === "delivered" || status === "read") newStatus = "DELIVERED";
          if (status === "failed") newStatus = "FAILED";

          if (newStatus) {
            await prisma.botMessage.updateMany({
              where: { provider: "whatsapp", providerMessageId: waId },
              data: { status: newStatus },
            });
          }
        }
      }
    }
    return;
  }

  // Si no entra a ningún caso, ignorar
}

/**
 * Ingesta un evento YA normalizado (o normalizado por la rama RAW)
 */
async function ingestNormalizedEvent(evt) {
  const { fromPhone, text, interactivePayload, providerMessageId, replyToMessageId, raw } = evt;

  // Buscar si el reply hace referencia a un OUTBOUND nuestro por context.id
  let replyTo = null;
  if (replyToMessageId) {
    replyTo = await prisma.botMessage.findFirst({
      where: { provider: "whatsapp", providerMessageId: replyToMessageId },
      select: { id: true, citaId: true },
    });
  }

  // Parsear payload de botón "ACCION:citaId"
  let action = null;
  let citaIdFromPayload = null;
  let replyTitle = null;

  if (interactivePayload?.type === "button_reply" && interactivePayload?.button_reply?.id) {
    const id = interactivePayload.button_reply.id; // ej: "CONFIRMAR:1"
    replyTitle = interactivePayload.button_reply.title ?? null;

    const m = /^([A-ZÁÉÍÓÚÑ]+):(\d+)$/.exec(id);
    if (m) {
      action = m[1]; // CONFIRMAR | RECHAZAR
      citaIdFromPayload = Number(m[2]);
    }
  }

  // Crear INBOUND
  const inbound = await prisma.botMessage.create({
    data: {
      citaId: replyTo?.citaId ?? citaIdFromPayload ?? null,
      direction: "INBOUND",
      provider: "whatsapp",
      providerMessageId,
      fromPhone,
      text: text ?? null,
      replyPayload: interactivePayload ?? null,
      replyText: text ?? replyTitle ?? null,
      status: "REPLIED", // por tu enum, ya es respuesta del usuario
      raw: raw ?? null,
    },
  });

  // Actualizar estado de la cita si logramos identificarla
  const targetCitaId = replyTo?.citaId ?? citaIdFromPayload;

  if (targetCitaId) {
    let state = "UNKNOWN";
    if (action === "CONFIRMAR") state = "CONFIRMED";
    if (action === "RECHAZAR") state = "REJECTED";

    await prisma.citaConfirmation.upsert({
      where: { citaId: targetCitaId },
      create: { citaId: targetCitaId, state, lastReplyMsgId: inbound.id, lastReplyText: inbound.replyText },
      update: { state, lastReplyMsgId: inbound.id, lastReplyText: inbound.replyText },
    });
  }
}

/* ===================== Queries ===================== */
export async function listMessages({ citaId }) {
  return prisma.botMessage.findMany({
    where: { citaId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getConfirmation({ citaId }) {
  const c = await prisma.citaConfirmation.findUnique({ where: { citaId } });
  return c ?? { citaId, state: "PENDING" };
}
