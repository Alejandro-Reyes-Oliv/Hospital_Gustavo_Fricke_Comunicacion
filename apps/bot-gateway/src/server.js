// apps/bot-gateway/src/server.js
import express from "express";

process.loadEnvFile('../.env');

//Config
const app = express();
const PORT = process.env.PORT || 8082;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "frikitona";
//console.log("Config: ", process.env.BACKEND_URL);

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
  res.sendStatus(200);
  try {
    /*
    console.log("body completo que llega al gateway: ",req.body)
    console.log("body dentro de changes", req.body.entry[0].changes[0].value)
    console.log("body antes de llevarlo al backend: ",req.body.entry[0].changes[0].value.messages[0].from)
    console.log("respuesta del usuario: ", req.body.entry[0].changes[0].value.messages[0].button.payload)
    const from = req.body.entry[0].changes[0].value.messages[0].from;
    const reply = req.body.entry[0].changes[0].value.messages[0].button.payload;
    const wamid = req.body.entry[0].changes[0].value.messages[0].id;
    const timestamp = req.body.entry[0].changes[0].value.messages[0].timestamp;
    console.log("Json que se va a enviar: ",JSON.stringify(req.body))
    */
   //Hacer un if en el que solo entre si es de respuesta, es decir que contenga messages y no statuses
   
   if (req.body.entry[0].changes[0].value.messages) {
    //console.log("datos del body ", req.body.entry[0].changes[0].value.metadata)
    //console.log("datos del mensaje ", req.body.entry[0].changes[0].value.messages[0])
    //console.log("id del contexto del mensaje anterior ", req.body.entry[0].changes[0].value.messages[0].context.id)
     const backendResp = await fetch(`${BACKEND_URL}/api/bot/events`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(req.body),
     });
     const text = await backendResp.text().catch(() => "");
     console.log("texto de la respuesta del backend: ",text)
   }
    //console.log("Respuesta al backend? ",backendResp)
    
    // log claro en consola
    //console.log("[gateway→backend]", backendResp.status, text);
    //console.log('respuesta del usuario: ', req.body.entry[0].changes[0].value.messages[0].text.body) //Aca entra si es que el usuario manda un mensaje, pero no si es que presiona un boton
    //req.body.entry[0].changes[0].value.messages[0].from  //Aqui se obtiene el numero de telefono del usuario que envia el mensaje al bot

    

    // WhatsApp espera 200 SIEMPRE, pero devolvemos detalles para debug
    /*
    return res.status(200).json({
      ok: backendResp.ok,
      forwarded: backendResp.ok,
      status: backendResp.status,
      backendBody: text,
    });
    */
  } catch (e) {
    console.error("[gateway] POST /webhooks/whatsapp error:", e?.message || e);
    return res.status(200).json({ ok: true, forwarded: false, err: e?.message || "exception" });
  }
});


app.listen(PORT, () => {
  console.log(`bot-gateway listening on http://localhost:${PORT}`);
  console.log(`Forwarding to BACKEND_URL=${BACKEND_URL}`);
});
