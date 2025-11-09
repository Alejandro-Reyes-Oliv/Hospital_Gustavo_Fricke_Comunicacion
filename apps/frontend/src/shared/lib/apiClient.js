// src/shared/lib/apiClient.js
// Cliente HTTP mínimo con baseURL configurable, timeout y JSON consistente.

let _baseURL = String(import.meta?.env?.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export function setBaseURL(v) { _baseURL = String(v ?? "").replace(/\/$/, ""); }
export function assertApi() {
  if (!_baseURL) throw new Error("API no configurada. Define VITE_API_BASE_URL.");
}

export function buildUrl(path = "", query) {
  if (!path.startsWith("/")) path = "/" + path;
  const url = _baseURL ? `${_baseURL}${path}` : path;
  if (!query || typeof query !== "object") return url;

  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v == null || v === "") continue;
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, String(x)));
    else usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseJson(resp) {
  const text = await resp.text();
  try { return text ? JSON.parse(text) : null; }
  catch { return { error: { code: "INVALID_JSON", message: text } }; }
}

async function request(method, path, { query, body, headers, timeoutMs = 6000 } = {}) {
  assertApi();
  const url = buildUrl(path, query);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(new Error("timeout")), timeoutMs);

  try {
    const init = { method, headers: { ...(headers || {}) }, signal: ctrl.signal };
    if (body !== undefined) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(body); }
    const resp = await fetch(url, init);
    const data = await parseJson(resp);
    const ok = resp.ok;
    return { ok, data, error: ok ? null : (data || { error: { code: resp.status, message: resp.statusText } }) };
  } finally {
    clearTimeout(t);
  }
}

const api = {
  get baseURL() { return _baseURL; },
  set baseURL(v) { setBaseURL(v); },
  buildUrl,
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts) => request("POST", path, { ...(opts || {}), body }),
  patch: (path, body, opts) => request("PATCH", path, { ...(opts || {}), body }),
  delete: (path, opts) => request("DELETE", path, opts),
};

export default api;
