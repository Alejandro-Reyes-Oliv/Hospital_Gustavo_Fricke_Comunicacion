// src/shared/lib/apiClient.js
// Cliente HTTP mínimo con baseURL configurable y JSON por defecto.
// Compatible con: api.post(url, payload)  y  api.post(url, { body: payload })

let _baseURL = "";

function setBaseURL(v) {
  _baseURL = String(v ?? "").trim().replace(/\/$/, "");
}

function buildUrl(path = "", query) {
  if (!path.startsWith("/")) path = "/" + path;
  const url = _baseURL ? `${_baseURL}${path}` : path;

  if (!query || typeof query !== "object") return url;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, String(x)));
    else usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `${url}?${qs}` : url;
}

export function assertApi() {
  if (!_baseURL) {
    throw new Error(
      "[apiClient] baseURL vacío. Configura api.baseURL en main.jsx con VITE_API_BASE_URL"
    );
  }
}

async function request(method, path, opts = {}) {
  const { query, body, headers } = opts || {};
  const url = buildUrl(path, query);

  const init = { method, headers: { ...(headers || {}) } };

  if (body !== undefined) {
    // JSON por defecto
    init.headers["Content-Type"] =
      init.headers["Content-Type"] ?? "application/json";
    init.body = init.headers["Content-Type"].includes("application/json")
      ? JSON.stringify(body)
      : body;
  }

  let res;
  try {
    res = await fetch(url, init);
  } catch (networkErr) {
    return { ok: false, status: 0, data: null, error: networkErr };
  }

  const ctype = res.headers.get("content-type") || "";
  let data = null;
  try {
    data = ctype.includes("application/json") ? await res.json() : await res.text();
  } catch {
    data = null;
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
    error: res.ok ? null : { status: res.status, data },
  };
}

// Helpers para admitir firma flexible:
//   api.post(url, payload)
//   api.post(url, { body: payload, headers, query })
function normalizeOpts(arg1, arg2) {
  if (arg1 && (arg1.body !== undefined || arg1.headers || arg1.query)) {
    return { ...(arg1 || {}), ...(arg2 || {}) };
  }
  if (arg1 !== undefined) {
    return { body: arg1, ...(arg2 || {}) };
  }
  return arg2 || {};
}

const api = {
  get baseURL() {
    return _baseURL;
  },
  set baseURL(v) {
    setBaseURL(v);
  },
  buildUrl,

  get: (path, arg1, arg2) => request("GET", path, normalizeOpts(arg1, arg2)),
  post: (path, arg1, arg2) => request("POST", path, normalizeOpts(arg1, arg2)),
  patch: (path, arg1, arg2) => request("PATCH", path, normalizeOpts(arg1, arg2)),
  delete: (path, arg1, arg2) => request("DELETE", path, normalizeOpts(arg1, arg2)),
};

export default api;
export { setBaseURL, buildUrl };
