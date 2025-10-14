import { PrismaClient } from "@prisma/client";
import { verifyMetaSignature } from "./lib/verifySignature.js";
const prisma = new PrismaClient();

export async function verifyWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

export async function receiveWebhook(req, res) {
  if (process.env.WEBHOOK_ENFORCE_SIGNATURE === "true") {
    const ok = verifyMetaSignature({
      appSecret: process.env.META_APP_SECRET,
      rawBody: req.rawBody,
      signatureHeader: req.get("x-hub-signature-256"),
    });
    if (!ok) return res.status(401).json({ error: "invalid_signature" });
  }

  const body = req.body;
  if (!body?.entry?.length) return res.status(200).json({ ok: true, inserted: 0, updated: 0 });

  const inboundRows = [];
  const statusRows  = [];

  for (const entry of body.entry) {
    for (const change of (entry.changes || [])) {
      const value = change.value || {};
      const meta = {
        field: change.field,
        phone_number_id: value.metadata?.phone_number_id,
        display_phone_number: value.metadata?.display_phone_number,
      };

      // inbound (usuario → tú)
      for (const msg of (value.messages || [])) {
        inboundRows.push({
          direction: "inbound",
          messageId: msg.id || null,
          timestamp: new Date(parseInt(msg.timestamp) * 1000),
          fromWaId: msg.from || null,
          toPhoneNumberId: value.metadata?.phone_number_id || null,
          type: msg.type,
          textBody: msg.text?.body || null,
          raw: msg,
          meta,
        });
      }

      // statuses (de tus envíos)
      for (const st of (value.statuses || [])) {
        statusRows.push({
          direction: "status",
          messageId: st.id || null,
          timestamp: new Date(parseInt(st.timestamp) * 1000),
          fromWaId: st.recipient_id || null,
          toPhoneNumberId: value.metadata?.phone_number_id || null,
          type: st.status, // sent | delivered | read | failed
          textBody: null,
          raw: st,
          meta,
        });
      }
    }
  }

  // 1) Insertar inbound en batch (skip duplicates)
  let inserted = 0, updated = 0;
  if (inboundRows.length) {
    const result = await prisma.whatsAppMessage.createMany({
      data: inboundRows,
      skipDuplicates: true,
    });
    inserted += result.count; // <-- ahora reporta bien
  }

  // 2) Upsert para statuses (si existe -> update; si no -> create)
  if (statusRows.length) {
    for (const row of statusRows) {
      if (!row.messageId) continue;
      const prev = await prisma.whatsAppMessage.upsert({
        where: { messageId: row.messageId },
        create: row,
        update: {
          // último estado y metadata cruda
          type: row.type,
          timestamp: row.timestamp,
          raw: row.raw,
          meta: row.meta,
          // opcional: podrías guardar un 'lastStatus' aparte
        },
      });
      // heurística simple para contar "updated"
      if (prev.direction === "inbound" || prev.direction === "status") {
        updated += 1;
      }
    }
  }

  return res.status(200).json({ ok: true, inserted, updated });
}
