// node scripts/test-webhook-text.js
const gateway = process.env.GATEWAY_URL || "http://localhost:8082";
const body = {
  entry: [{
    changes: [{
      value: {
        messages: [{
          from: "56999999999",
          id: `wamid.test.${Date.now()}`,
          type: "text",
          text: { body: "Hola confirme porfa" }
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
