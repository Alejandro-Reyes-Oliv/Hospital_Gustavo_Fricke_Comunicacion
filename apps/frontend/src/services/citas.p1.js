// src/services/citas.p1.js
import api from '../lib/apiClient.js'
import { mapCitaApiToDTO } from '../lib/dto.js'
import * as local from './citas.js'

/**
 * listCitas con backend si existe baseURL; si no, intenta mock JSON y, si no puede, delega al servicio local (localStorage).
 * Mantiene el shape que consume la UI (array de CitaDTO).
 */
export async function listCitas(params = {}) {
  if (api.baseURL) {
    const { ok, data, error } = await api.get('/api/appointments', {
      query: normalizeQuery(params),
    })
    if (!ok) {
      console.warn('GET /api/appointments falló, usando fuente local:', error)
      return local.listCitas(params)
    }
    const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
    return rows.map(mapCitaApiToDTO)
  }

  // Preferimos mock JSON en dev y sincronizamos a localStorage para persistencia
  try {
    const r = await fetch('/mock/citas.json', { cache: 'no-store' })
    if (r.ok) {
      const json = await r.json()
      const rows = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
      const mapped = rows.map(mapCitaApiToDTO)
      try {
        // Persistimos para que la UI sea consistente entre recargas
        local.resetCitas(mapped)
      } catch (e) {
        console.warn('No se pudo sincronizar mock → localStorage:', e)
      }
      return mapped
    }
  } catch (e) {
    console.warn('Mock /mock/citas.json no disponible, cayendo a localStorage', e)
  }

  // Fallback: comportamiento actual
  return local.listCitas(params)
}

/** Mantén las mutaciones tal cual están en el servicio local (P1 no las toca) */
export const addAppointment = local.addAppointment
export const updateStatus   = local.updateStatus
export const sendBot        = local.sendBot
export const resetCitas     = local.resetCitas

function normalizeQuery(q = {}) {
  const out = {}
  if (q.search)  out.search  = q.search
  if (q.estado)  out.estado  = q.estado
  if (q.medicoId) out.medicoId = q.medicoId
  if (q.from)    out.from    = q.from
  if (q.to)      out.to      = q.to
  if (q.page != null)     out.page     = q.page
  if (q.pageSize != null) out.pageSize = q.pageSize
  if (q.sort)    out.sort    = q.sort
  return out
}
