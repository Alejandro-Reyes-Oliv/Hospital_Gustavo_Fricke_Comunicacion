// src/services/medicos.js
import api from '../lib/apiClient.js'
import { mapDoctorApiToDTO } from '../lib/dto.js'

/**
 * Lista de médicos usando backend si está configurado (VITE_API_BASE_URL).
 * Si no hay backend, cae a /mock/medicos.json (desarrollo).
 */
export async function listMedicos({ search, page, pageSize, sort } = {}) {
  // Si tenemos baseURL, intentamos backend real
  if (api.baseURL) {
    const { ok, data, error } = await api.get('/api/doctors', {
      query: {
        search,
        page,
        pageSize,
        sort,
      },
    })
    if (!ok) throw new Error(error?.error?.message || 'Error al obtener médicos')

    // soporta dos formatos comunes: { data: [...] } o directamente [...]
    const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
    return rows.map(mapDoctorApiToDTO)
  }

  // Fallback a mock en dev
  const r = await fetch('/mock/medicos.json')
  const json = await r.json()
  const rows = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
  return rows.map(mapDoctorApiToDTO)
}
