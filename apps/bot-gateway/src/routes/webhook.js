import { Router } from 'express';
import crypto from 'crypto';
import { logInbound } from '../lib/logger.js';
import { forwardInbound } from '../lib/forward.js';
process.loadEnvFile('../.env');
const router = Router();

/**
 * GET /webhook — Verificación inicial de Meta
 * Meta envía: hub.mode, hub.verify_token, hub.challenge
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/**
 * (Opcional) Verificar firma X-Hub-Signature-256
 * Requiere tener guardado META_APP_SECRET en .env y rawBody en req.rawBody
 */
function verifyMetaSignature(req) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return true; // si no está configurado, omitir
  const signature = req.get('x-hub-signature-256'); // formato: sha256=...
  if (!signature?.startsWith('sha256=')) return false;
  const expected = signature.split('=')[1];
  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(req.rawBody || '');
  const digest = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(expected));
}

/**
 * POST /webhook — Recepción de mensajes/eventos
 * Guardamos todo y extraemos mensaje de texto si existe.
 */
router.post('/webhook', async (req, res) => {
  res.sendStatus(200); // responder rápido para que Meta no reintente
  try {
    if (!verifyMetaSignature(req)) {
      return res.sendStatus(401);
    }

    const payload = req.body;
    //console.log("Payload del webhook: ",payload)
    // Estructura típica: entry[].changes[].value.messages[] / contacts[]
    const entries = payload?.entry ?? [];
    for (const entry of entries) {
      const changes = entry?.changes ?? [];
      for (const change of changes) {
        const value = change?.value;
        const messages = value?.messages ?? [];
        //console.log('Received messages: ', messages);
        const contacts = value?.contacts ?? [];

        // Puede venir en messages[0].from o contacts[0].wa_id
        const waFrom = messages[0]?.from || contacts[0]?.wa_id || null;
        const textBody = messages[0]?.text?.body || null;

        // Log local (placeholder de DB)
        logInbound({ waFrom, textBody, rawPayload: value || payload });

        // Hook de integración futura
        await forwardInbound({ waFrom, textBody, rawPayload: value || payload });
      }
    }

  } catch (err) {
    console.error('webhook error:', err);
    return res.sendStatus(500);
  }
});

export default router;
