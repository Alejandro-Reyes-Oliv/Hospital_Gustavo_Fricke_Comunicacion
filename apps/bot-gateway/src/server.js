import express from 'express';

const app = express();
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

// Verificación GET del webhook (Meta)
app.get('/webhooks/whatsapp', (req, res) => {
  const token = process.env.VERIFY_TOKEN ?? 'dev-verify-token';
  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const verify_token = req.query['hub.verify_token'];

  if (mode === 'subscribe' && verify_token === token) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Recepción de mensajes
app.post('/webhooks/whatsapp', async (req, res) => {
  try {
    const normalized = normalizeWhatsApp(req.body);

    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000';
    await fetch(`${backendUrl}/api/bot/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(normalized)
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('gateway error:', err);
    res.status(500).json({ ok: false });
  }
});

// Normalizador para Cloud API (button/text)
function normalizeWhatsApp(payload) {
  let fromPhone = null;
  let text = null;
  let interactivePayload = null;
  let providerMessageId = null;
  let replyToMessageId = null;

  try {
    const entry = payload?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const msg = value?.messages?.[0];

    fromPhone = msg?.from ?? null;
    providerMessageId = msg?.id ?? null;

    if (msg?.type === 'text') {
      text = msg?.text?.body ?? null;
      replyToMessageId = msg?.context?.id ?? null;
    }

    if (msg?.type === 'interactive') {
      const btn = msg?.interactive?.button_reply;
      const list = msg?.interactive?.list_reply;

      // En Cloud API el botón entrega { id, title } (no payload).
      const rawId = btn?.id || list?.id || null;

      if (rawId) {
        try {
          const parsed = JSON.parse(rawId); // nosotros guardamos JSON en id
          interactivePayload = {
            type: parsed.type ?? 'OTHER',
            citaId: parsed.citaId,
            correlationId: parsed.correlationId,
            raw: parsed
          };
        } catch {
          // Si no era JSON, guardamos igualmente algo
          interactivePayload = { type: 'OTHER', raw: rawId };
        }
      }

      replyToMessageId = msg?.context?.id ?? null;
    }
  } catch {
    // deja campos en null
  }

  return {
    provider: 'whatsapp',
    fromPhone,
    text,
    interactivePayload,
    providerMessageId,
    replyToMessageId,
    raw: payload
  };
}

const port = process.env.PORT ?? 8082;
app.listen(port, () => {
  console.log(`gateway on http://localhost:${port}`);
});
