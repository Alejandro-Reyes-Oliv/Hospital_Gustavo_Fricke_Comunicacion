export async function ping(_req, res) {
  res.json({ ok: true, ts: new Date().toISOString() });
}
