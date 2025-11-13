const GRAPH_BASE = process.env.WHATSAPP_API_BASE || "https://graph.facebook.com/v23.0";
const PHONE_ID   = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN      = process.env.WHATSAPP_TOKEN;

function assertEnv() {
  if (!PHONE_ID) throw new Error("[WhatsApp] Falta WHATSAPP_PHONE_NUMBER_ID");
  if (!TOKEN)    throw new Error("[WhatsApp] Falta WHATSAPP_TOKEN");
}

export async function metaRequest(payload) {
  assertEnv();
  const url = `${GRAPH_BASE}/${PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`[WhatsApp] ${res.status} ${res.statusText} :: ${JSON.stringify(data)}`);
  return data;
}

export async function enviarTexto({ to, body }) {
  if (!to || !body) throw new Error("[WhatsApp] 'to' y 'body' son requeridos");
  const payload = { messaging_product: "whatsapp", to, type: "text", text: { body } };
  const data = await metaRequest(payload);
  return { wamid: data?.messages?.[0]?.id || null };
}

export async function enviarAvisoCancelacion({ to, especialidad }) {
  const body = `Se informa que se ha cancelado su cita de especialidad ${especialidad}, por favor reagendar.`;
  return enviarTexto({ to, body });
}

export function normalizaTelefonoCL(raw) {
  const n = String(raw ?? "").replace(/[^\d]/g, "");
  if (!n) throw new Error("Teléfono inválido");
  if (n.startsWith("56")) return `+${n}`;
  if (n.length === 9) return `+56${n}`;
  return `+${n}`;
}
