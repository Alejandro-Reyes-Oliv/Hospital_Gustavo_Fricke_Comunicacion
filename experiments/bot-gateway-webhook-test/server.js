// Minimal WhatsApp Webhook Server (no dependencies)
// Node >= 18 required.
// Usage:
//   1) Copy .env.example to .env and edit VERIFY_TOKEN (and PORT if needed).
//   2) node server.js
//   3) Use ngrok (or similar) to expose and configure the webhook in Meta.

const http = require('http');
const fs = require('fs');
const { URL } = require('url');

const ENV_PATH = '.env';
loadEnv(ENV_PATH);

const PORT = process.env.PORT || 8081;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'devtoken';
const LOG_PATH = process.env.LOG_PATH || 'inbound.jsonl';

// Simple .env loader (no dependency)
function loadEnv(path) {
  try {
    const data = fs.readFileSync(path, 'utf8');
    for (const line of data.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue;
      const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
      if (m) {
        const k = m[1]; 
        let v = m[2];
        // Remove optional surrounding quotes
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        process.env[k] = v;
      }
    }
    console.log(`[env] Loaded ${path}`);
  } catch (e) {
    // .env is optional
    console.log(`[env] ${path} not found, using defaults/env vars`);
  }
}

function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}

function notFound(res) {
  json(res, 404, { error: 'not_found' });
}

function appendJSONL(path, obj) {
  const line = JSON.stringify(obj) + '\n';
  fs.appendFile(path, line, 'utf8', (err) => {
    if (err) console.error('[log] append error:', err);
  });
}

function parseBody(req, limitBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > limitBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      const str = raw.toString('utf8') || '{}';
      try {
        const obj = JSON.parse(str);
        resolve({ raw, obj });
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    // Health
    if (req.method === 'GET' && url.pathname === '/health') {
      return json(res, 200, { ok: true, service: 'webhook-min', ts: new Date().toISOString() });
    }

    // Webhook verification (GET)
    if (req.method === 'GET' && url.pathname === '/webhook') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(challenge || '');
        return;
      }
      res.statusCode = 403;
      res.end();
      return;
    }

    // Webhook receive (POST)
    if (req.method === 'POST' && url.pathname === '/webhook') {
      const { obj: payload } = await parseBody(req);

      // Meta typical shape: entry[].changes[].value.messages[] / contacts[]
      const entries = Array.isArray(payload?.entry) ? payload.entry : [];
      for (const entry of entries) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        for (const change of changes) {
          const value = change?.value || {};
          const messages = Array.isArray(value?.messages) ? value.messages : [];
          const contacts = Array.isArray(value?.contacts) ? value.contacts : [];

          const waFrom = messages[0]?.from || contacts[0]?.wa_id || null;
          const textBody = messages[0]?.text?.body || null;

          // Log line (acts as "temp table")
          appendJSONL(LOG_PATH, {
            ts: new Date().toISOString(),
            wa_from: waFrom,
            text_body: textBody,
            raw: value || payload
          });

          // --- PLACEHOLDER: Forward to your API/DB (future) ---
          // Example (uncomment when ready):
          // await fetch('https://mi-api.local/inbound', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.BACKEND_TOKEN || ''}` },
          //   body: JSON.stringify({ wa_from: waFrom, text_body: textBody, raw_payload: value || payload })
          // });
          // ----------------------------------------------------
        }
      }

      // Respond 200 quickly so Meta doesn't retry
      res.writeHead(200);
      res.end();
      return;
    }

    return notFound(res);
  } catch (err) {
    console.error('[server] error:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('internal_error');
  }
});

server.listen(PORT, () => {
  console.log(`Webhook server listening on :${PORT}`);
  console.log(`- GET  /health`);
  console.log(`- GET  /webhook (verification)`);
  console.log(`- POST /webhook (inbound)`);
});
