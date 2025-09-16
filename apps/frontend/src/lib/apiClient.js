// Cliente HTTP min, con baseURL configurable y manejo de JSON/errores consistente.

// Guarda internamente el baseURL, con setter para normalizar (sin slash final)
let _baseURL = String(import.meta?.env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function setBaseURL(v) {
  _baseURL = String(v ?? '').replace(/\/$/, '');
}

function buildUrl(path = '', query) {
  if (!path.startsWith('/')) path = '/' + path;
  const url = _baseURL ? `${_baseURL}${path}` : path;
  if (!query || typeof query !== 'object') return url;

  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    usp.append(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseJson(resp) {
  const text = await resp.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { error: { code: 'INVALID_JSON', message: text } };
  }
}

async function request(method, path, { query, body, headers } = {}) {
  const url = buildUrl(path, query);
  const opts = { method, headers: { ...(headers || {}) } };

  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const resp = await fetch(url, opts);
  const data = await parseJson(resp);
  const ok = resp.ok;
  return { ok, data, error: ok ? null : data || { error: { code: resp.status, message: resp.statusText } } };
}

// Objeto api con getter/setter para baseURL (permite: api.baseURL = 'http://localhost:8080')
const api = {
  get baseURL() { return _baseURL; },
  set baseURL(v) { setBaseURL(v); },
  buildUrl,
  get: (path, opts) => request('GET', path, opts),
  post: (path, opts) => request('POST', path, opts),
  patch: (path, opts) => request('PATCH', path, opts),
  delete: (path, opts) => request('DELETE', path, opts),
};

export default api;
export { setBaseURL };
