/**
 * By GEPETE
 * Hook de integración.
 * Cuando el backend esté listo, reemplace este placeholder por:
 * - INSERT en su DB, o
 * - fetch('https://mi-api/capturar', { method:'POST', body: JSON.stringify(...)}), etc.
 */
export async function forwardInbound({ waFrom, textBody, rawPayload }) {
  // TODO: integrar aquí con BD / API 1 (CRUD) / otra API
  // Ejemplo futuro:
  // await fetch(process.env.BACKEND_URL + '/inbound', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.BACKEND_TOKEN}` },
  //   body: JSON.stringify({ waFrom, textBody, rawPayload }),
  // });
  return { ok: true };
}
