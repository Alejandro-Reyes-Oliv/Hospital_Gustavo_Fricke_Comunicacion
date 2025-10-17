// src/services/citas.p2.js

import api from '../lib/apiClient.js'
api.baseURL ||= 'http://localhost:3000';
import { mapCitaApiToDTO } from '../lib/dto.js'
import { STATUS } from '../lib/constants.js'
import * as local from './citas.js'

/**
 * LIST: backend si hay baseURL; si no, mock JSON → sync a localStorage; si falla, localStorage puro.
 */
export async function listCitas(params = {}) {
  const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080';

  const query = new URLSearchParams();
  if (params.search)   query.set('search', params.search);
  if (params.estado)   query.set('estado', params.estado);
  if (params.medicoId) query.set('medicoId', params.medicoId);
  if (params.sort)     query.set('sort', params.sort);
  if (params.from)     query.set('from', params.from);
  if (params.to)       query.set('to', params.to);

  console.log("Estado de nose que: ", params.estado); //_------------------------------------------------------------------------
  // Asegura page/pageSize numéricos por defecto
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 10));

  const res = await fetch(`${baseURL}/api/appointments?${query.toString()}`);
  if (!res.ok) {
    // intenta leer mensaje útil
    let msg = 'Error al listar citas';
    try { const e = await res.json(); msg = e?.error?.message || msg; } catch {}
    throw new Error(msg);
  }

  const raw = await res.json();

  // Normaliza: acepta {data:[...]} o {items:[...]}
  const items = Array.isArray(raw?.items)
    ? raw.items
    : (Array.isArray(raw?.data) ? raw.data : []);

  const total    = Number(raw?.total ?? 0);
  const page     = Number(raw?.page ?? params.page ?? 1);
  const pageSize = Number(raw?.pageSize ?? params.pageSize ?? 10);

  return { items, total, page, pageSize };
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
//-----------------------------------------------------------------------------------------------------------------
export async function sendBot(ids = []) {
  console.log("ids para enviar: ",ids)
  if (!api.baseURL) return local.sendBot(ids)

  const { ok, data, error } = await api.post('/api/appointments/send-bot', {
    body: { ids },
  })
  console.log("data: ",data)
  if (!ok) {
    console.warn('POST /api/appointments/send-bot falló, usando fuente local:', error)
    return local.sendBot(ids)
  }
  const sent = Array.isArray(data?.sent) ? data.sent : Array.isArray(data?.data) ? data.data : []
  return { ok: true, sent }
}
//------------------------------------------------------------------------------------------------------------------
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
  if (v.includes('confirmada')) return STATUS.CONFIRMADA
  if (v.includes('cancelada')) return STATUS.CANCELADA
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