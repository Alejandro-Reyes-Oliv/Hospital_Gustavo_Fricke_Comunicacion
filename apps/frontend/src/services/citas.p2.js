// src/services/citas.p2.js

import api from '../lib/apiClient.js'
api.baseURL ||= 'http://localhost:8080';
import { mapCitaApiToDTO } from '../lib/dto.js'
import { STATUS } from '../lib/constants.js'
import * as local from './citas.js'

/**
 * LIST: backend si hay baseURL; si no, mock JSON → sync a localStorage; si falla, localStorage puro.
 */
export async function listCitas(params = {}) {
  if (api.baseURL) {
    const { ok, data, error } = await api.get('/api/appointments', {
      query: normalizeQuery(params),
    })

   if (!ok) {
     console.warn('GET /api/appointments falló, NO uso mock cuando hay backend. Devuelvo []. Error:', error)
     return []
   }

    // ok
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
    return items.map(mapCitaApiToDTO)
  }

  // sin backend → usar local/mock
  try {
    const res = await fetch('/mock/citas.json')
    const raw = await res.json()
    const items = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : []
    return items.map(mapCitaApiToDTO)
  } catch {
    return local.listCitas()
  }
}

/**
 * CREATE: backend si hay baseURL; si no, local.addAppointment()
 */
export async function addAppointment(newItem) {
  if (!api.baseURL) return local.addAppointment(newItem)
  const body = {
    nombrePaciente: newItem.nombrePaciente ?? newItem.paciente,
    rut: newItem.rut || undefined,
    telefono: newItem.telefono || undefined,
    fechaCita: newItem.fechaCita,        // ISO recomendado
    medicoId: newItem.medicoId,
    estadoCita: normalizeStatus(newItem.estadoCita),
    origin: "web",
  }
  const { ok, data } = await api.post('/api/appointments', { body })
  if (!ok) {
    console.warn('POST /api/appointments falló, usando fuente local:')
    return local.addAppointment(newItem)
  }
  return mapCitaApiToDTO(data)
}

/**
 * UPDATE STATUS (bulk o 1): backend preferido; fallback local
 */
export async function updateStatus(ids, nextStatus) {
  const idList = Array.isArray(ids) ? ids : [ids]
  const next = normalizeStatus(nextStatus)
  if (!api.baseURL) return local.updateStatus(idList, next)

  const bulk = await api.patch('/api/appointments', {
    body: { ids: idList, estadoCita: next },
  })

  if (bulk.ok) return true

  try {
    const results = await Promise.all(
      idList.map((id) =>
        api.patch(`/api/appointments/${encodeURIComponent(id)}`, {
          body: { estadoCita: next },
        })
      )
    )
    const allOk = results.every((r) => r.ok)
    if (!allOk) throw new Error('Algunas citas no pudieron actualizarse')
    return true
  } catch (e) {
    console.warn('PATCH /api/appointments/:id falló, usando fuente local:', e)
    return local.updateStatus(idList, next)
  }
}

/**
 * SEND BOT (bulk): backend preferido; fallback local
 */
export async function sendBot(ids = []) {
  if (!api.baseURL) return local.sendBot(ids)

  const { ok, data, error } = await api.post('/api/appointments:send-bot', {
    body: { ids },
  })
  if (!ok) {
    console.warn('POST /api/appointments:send-bot falló, usando fuente local:', error)
    return local.sendBot(ids)
  }
  const sent = Array.isArray(data?.sent) ? data.sent : Array.isArray(data?.data) ? data.data : []
  return { ok: true, sent }
}

// ----------------------

function normalizeQuery(q = {}) {
  const out = {}
  if (q.search) out.search = q.search
  if (q.estado) out.estado = normalizeStatus(q.estado)
  if (q.medicoId) out.medicoId = q.medicoId
  if (q.from) out.from = q.from
  if (q.to) out.to = q.to
  if (q.page != null) out.page = q.page
  if (q.pageSize != null) out.pageSize = q.pageSize
  if (q.sort) out.sort = q.sort
  return out
}

function normalizeStatus(s) {
  const v = String(s || '').toLowerCase()
  if (v.includes('confirm')) return STATUS.CONFIRMADA
  if (v.includes('cancel')) return STATUS.CANCELADA
  return STATUS.PENDIENTE
}

export async function deleteAppointments(ids = []) {
  if (!Array.isArray(ids) || !ids.length) return 0;

  // Si hay backend, eliminar de a uno (o haz un endpoint bulk si quieres optimizar)
  if (api.baseURL) {
    let count = 0;
    for (const id of ids) {
      const { ok } = await api.delete(`/api/appointments/${id}`);
      if (ok) count++;
    }
    return count;
  }

  // Fallback localStorage: lee, filtra y persiste usando resetCitas
  const rows = await local.listCitas();
  const idsSet = new Set(ids.map((x) => String(x)));
  const remaining = rows.filter((r) => !idsSet.has(String(r.id)));
  local.resetCitas(remaining);
  return ids.length - (rows.length - remaining.length);
}