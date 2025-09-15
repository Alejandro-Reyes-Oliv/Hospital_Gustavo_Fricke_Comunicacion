// Cliente HTTP min, con manejo de baseURL, JSON y shape de errores consistente.
//
// Uso futuro (ejemplos):
//   import api from '../lib/apiClient'
//   const { data } = await api.get('/api/doctors')
//   const { data } = await api.post('/api/appointments', body)

const baseURL = (import.meta?.env?.VITE_API_BASE_URL || '').replace(/\/$/, '')

function buildUrl(path = '') {
  if (!path.startsWith('/')) path = '/' + path
  return baseURL ? `${baseURL}${path}` : path
}

async function parseJson(resp) {
  const text = await resp.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    // JSON inválido → devolvemos como texto crudo
    return text || null
  }
}

// Error shape consistente: { error: { code, message, details? } }
function toErrorShape(input, fallbackStatus, fallbackMessage = 'Unexpected error') {
  if (input && typeof input === 'object' && input.error) return input
  const message =
    (input && typeof input === 'object' && (input.message || input.msg)) ||
    (typeof input === 'string' ? input : null) ||
    fallbackMessage
  return {
    error: {
      code: `HTTP_${fallbackStatus || 0}`,
      message,
      details: input ?? null,
    },
  }
}

async function request(method, path, { query, body, headers } = {}) {
  // Nota: en P0 no forzamos uso; si no hay baseURL, igual se llamará a rutas relativas (útil para mocks).
  let url = buildUrl(path)

  if (query && typeof query === 'object') {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue
      params.append(k, String(v))
    }
    const qs = params.toString()
    if (qs) url += (url.includes('?') ? '&' : '?') + qs
  }

  const init = {
    method,
    headers: {
      'Accept': 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include', // opcional: cookies/sesión si aplica
  }

  let resp
  try {
    resp = await fetch(url, init)
  } catch (networkErr) {
    const err = toErrorShape(networkErr, 0, 'Network error')
    return { ok: false, status: 0, data: null, ...err }
  }

  const status = resp.status
  const json = await parseJson(resp)

  if (!resp.ok) {
    const err = toErrorShape(json, status, 'Request failed')
    return { ok: false, status, data: null, ...err }
  }

  return { ok: true, status, data: json ?? null }
}

const api = {
  baseURL,
  get: (path, opts) => request('GET', path, opts),
  post: (path, opts) => request('POST', path, opts),
  patch: (path, opts) => request('PATCH', path, opts),
  del: (path, opts) => request('DELETE', path, opts),
}

export default api
