// apps/bot-gateway/src/server.js
import express from "express";

//Config
const app = express();
const PORT = process.env.PORT || 8082;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "frikitona";

app.use(express.json({ limit: "1mb" }));

// Health
app.get("/", (_req, res) => res.status(200).send("OK - bot-gateway up"));

//Verificación de Meta (GET)
app.get("/webhooks/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[gateway] webhook verified");
    return res.status(200).send(challenge);
  }
  console.warn("[gateway] verify failed");
  return res.sendStatus(403);
});

// apps/bot-gateway/src/server.js  (solo este handler)
app.post("/webhooks/whatsapp", async (req, res) => {
  try {
    const backendResp = await fetch(`${BACKEND_URL}/api/bot/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const text = await backendResp.text().catch(() => "");
    // log claro en consola
    console.log("[gateway→backend]", backendResp.status, text);

    // WhatsApp espera 200 SIEMPRE, pero devolvemos detalles para debug
    return res.status(200).json({
      ok: backendResp.ok,
      forwarded: backendResp.ok,
      status: backendResp.status,
      backendBody: text,
    });
  } catch (e) {
    console.error("[gateway] POST /webhooks/whatsapp error:", e?.message || e);
    return res.status(200).json({ ok: true, forwarded: false, err: e?.message || "exception" });
  }
});


app.listen(PORT, () => {
  console.log(`bot-gateway listening on http://localhost:${PORT}`);
  console.log(`Forwarding to BACKEND_URL=${BACKEND_URL}`);
});
