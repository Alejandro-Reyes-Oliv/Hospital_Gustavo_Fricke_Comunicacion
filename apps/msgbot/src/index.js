import "dotenv/config";
import express from "express";
import cors from "cors";
import { webhookMiddleware } from "./app.webhook.middleware.js";
import webhook from "./routes.webhook.js";

const app = express();
app.use(cors());

app.get("/health", (_req, res) => res.json({ ok: true, service: "msgbot" }));

// Webhook WhatsApp
app.use("/webhook/whatsapp", webhookMiddleware(), webhook);

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`msgbot listening on http://localhost:${PORT}`);
  console.log("- GET  /health");
  console.log("- GET  /webhook/whatsapp (verification)");
  console.log("- POST /webhook/whatsapp (events)");
});
