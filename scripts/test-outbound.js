// node scripts/test-outbound.js
const citaId = Number(process.env.CITA_ID || 1);
const toPhone = process.env.TO_PHONE || "569XXXXXXXX";
const url = "http://localhost:8000/api/bot/outbound";

async function main() {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ citaId, toPhone })
  });
  const txt = await res.text();
  console.log(res.status, txt);
}
main().catch(console.error);
