import { prisma } from '../../prismaClient.js';
import crypto from 'crypto';

const uuid = () => crypto.randomUUID();

/**
 * Construye mensaje normalizado (que luego el gateway puede transformar o,
 * si envías directo desde backend, podrías ya usar el formato del proveedor).
 */
function renderConfirmationMessage({ citaId, correlationId }) {
  return {
    text: 'Por favor confirma tu cita.',
    buttons: [
      // IMPORTANTE: en WhatsApp Cloud, el reply trae button_reply.id y title.
      // Codificamos JSON en "id" para recuperar citaId/correlationId en el webhook.
      { text: 'Confirmar', id: JSON.stringify({ type: 'CONFIRM', citaId, correlationId }) },
      { text: 'Rechazar',  id: JSON.stringify({ type: 'REJECT',  citaId, correlationId }) }
    ]
  };
}

/**
 * ENVÍO REAL a WhatsApp Cloud API (usa tus envs).
 * Si prefieres partir fake, deja el bloque "FAKE" y comenta el REAL.
 */
async function sendViaProvider({ toPhone, normalizedMessage }) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiBase = process.env.WHATSAPP_API_BASE ?? 'https://graph.facebook.com/v19.0';

  if (!token || !phoneNumberId) {
    // === FAKE: sin credenciales, simula envío ===
    return {
      provider: 'whatsapp',
      providerMessageId: 'prov_out_' + uuid(),
      raw: { ok: true, fake: true }
    };
  }

  // === REAL: envía texto + botones interactivos ===
  // En Cloud API, para botones "quick reply", el body es 'interactive' con type 'button'.
  // Cada botón tiene 'id' (usamos JSON stringificado) y 'title'.
  const body = {
    messaging_product: 'whatsapp',
    to: toPhone,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: normalizedMessage.text },
      action: {
        buttons: normalizedMessage.buttons.map(b => ({
          type: 'reply',
          reply: { id: b.id, title: b.text }
        }))
      }
    }
  };

  const url = `${apiBase}/${phoneNumberId}/messages`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`WhatsApp send error: ${resp.status} ${JSON.stringify(data)}`);
  }

  // Cloud API retorna messages[0].id como providerMessageId
  const providerMessageId = data?.messages?.[0]?.id ?? null;
  return {
    provider: 'whatsapp',
    providerMessageId,
    raw: data
  };
}

// Heurística simple para texto libre
function decideStateFromText(text) {
  if (!text) return 'UNKNOWN';
  const t = text.toLowerCase();
  if (/(confirm|sí|si|ok|vale|acepto)/i.test(t)) return 'CONFIRMED';
  if (/(no|rechaz|cancel)/i.test(t)) return 'REJECTED';
  return 'UNKNOWN';
}

export async function sendConfirmation({ citaId, toPhone }) {
  // 1) correlationId
  const correlationId = uuid();

  // 2) construir mensaje normalizado
  const message = renderConfirmationMessage({ citaId, correlationId });

  // 3) enviar
  const providerResp = await sendViaProvider({ toPhone, normalizedMessage: message });
  const providerMessageId = providerResp?.providerMessageId ?? null;

  // 4) persistir OUTBOUND
  const outbound = await prisma.botMessage.create({
    data: {
      citaId,
      direction: 'OUTBOUND',
      provider: providerResp.provider,
      providerMessageId,
      correlationId,
      toPhone,
      payload: message,
      raw: providerResp,
      status: 'PENDING'
    }
  });

  // 5) upsert estado
  await prisma.citaConfirmation.upsert({
    where: { citaId },
    update: { state: 'PENDING', confirmationMsgId: outbound.id },
    create: { citaId, state: 'PENDING', confirmationMsgId: outbound.id }
  });

  return { messageId: outbound.id, providerMessageId, correlationId };
}

export async function processInboundEvent(input) {
  // input normalizado desde el gateway:
  // {
  //   provider: 'whatsapp',
  //   fromPhone: '+569...',
  //   text?: '...'
  //   interactivePayload?: { type, citaId, correlationId, raw }
  //   providerMessageId?: 'wamid...'
  //   replyToMessageId?: 'wamid...'
  //   raw: { ...original... }
  // }

  const { provider, fromPhone, text, interactivePayload, providerMessageId, replyToMessageId } = input;

  // 1) correlación por mensaje de contexto (reply-to)
  let anchor = null;
  if (replyToMessageId) {
    anchor = await prisma.botMessage.findFirst({
      where: { provider, providerMessageId: replyToMessageId, direction: 'OUTBOUND' }
    });
  }

  // 2) correlación por correlationId (de nuestro JSON en el id del botón)
  if (!anchor && interactivePayload?.correlationId) {
    anchor = await prisma.botMessage.findFirst({
      where: { provider, correlationId: interactivePayload.correlationId, direction: 'OUTBOUND' }
    });
  }

  // 3) fallback: último OUTBOUND PENDING al mismo phone
  if (!anchor && fromPhone) {
    anchor = await prisma.botMessage.findFirst({
      where: { provider, direction: 'OUTBOUND', toPhone: fromPhone, status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 4) registrar INBOUND
  const inbound = await prisma.botMessage.create({
    data: {
      direction: 'INBOUND',
      provider,
      providerMessageId: providerMessageId ?? null,
      fromPhone: fromPhone ?? null,
      replyText: text ?? null,
      replyPayload: interactivePayload ?? null,
      raw: input.raw,
      status: 'REPLIED',
      citaId: anchor?.citaId ?? null
    }
  });

  // 5) actualizar estado de confirmación si hay cita anclada
  if (anchor?.citaId != null) {
    let decision = 'UNKNOWN';
    if (interactivePayload?.type === 'CONFIRM') decision = 'CONFIRMED';
    else if (interactivePayload?.type === 'REJECT') decision = 'REJECTED';
    else decision = decideStateFromText(text);

    await prisma.citaConfirmation.update({
      where: { citaId: anchor.citaId },
      data: {
        state: decision,
        lastReplyMsgId: inbound.id,
        lastReplyText: inbound.replyText
      }
    });

    // marca OUTBOUND como respondido
    await prisma.botMessage.update({
      where: { id: anchor.id },
      data: { status: 'REPLIED' }
    });
  }

  return { ok: true, inboundId: inbound.id };
}

export async function listMessages({ citaId }) {
  return prisma.botMessage.findMany({
    where: { citaId },
    orderBy: { createdAt: 'asc' }
  });
}

export async function getConfirmation({ citaId }) {
  const conf = await prisma.citaConfirmation.findUnique({ where: { citaId } });
  return conf ?? { state: 'PENDING' };
}
