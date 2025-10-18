// node scripts/test-webhook-button.js
const gateway = process.env.GATEWAY_URL || "http://localhost:8082";
const citaId = Number(process.env.CITA_ID || 1);
const body = {
  entry: [{
    changes: [{
      value: {
        messages: [{
          from: "56999999999",
          id: `wamid.test.btn.${Date.now()}`,
          type: "interactive",
          interactive: {
            type: "button_reply",
            button_reply: { id: `CONFIRMAR:${citaId}`, title: "Confirmar" }
          },
          context: { id: "wamid.OUTBOUND.ALGUNO" }
        }]
      }
    }]
  }]
};
async function main() {
  const res = await fetch(`${gateway}/webhooks/whatsapp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const txt = await res.text();
  console.log(res.status, txt);
}
main().catch(console.error);
