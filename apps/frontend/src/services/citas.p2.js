// src/services/citas.p2.js

import api from '../lib/apiClient.js';
console.log('API Base URL en citas.p2.js:', api.baseURL);
api.baseURL ||= 'http://localhost:8080';

import { mapCitaApiToDTO } from '../lib/dto.js';
import { STATUS } from '../lib/constants.js';
import * as local from './citas.js';

/**
 * LIST: backend si hay baseURL; si no, mock JSON → sync a localStorage; si falla, localStorage puro.
 */
export async function listCitas(params = {}) {
  const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080';

  const query = new URLSearchParams();
  console.log("Params en citas.p2.js: ", query);
  const q = normalizeQuery(params);

  if (q.search)   query.set('search', q.search);
  if (q.estado)   query.set('estado', q.estado);
  if (q.medicoId) query.set('medicoId', q.medicoId);
  if (q.sort)     query.set('sort', q.sort);
  if (q.from)     query.set('from', q.from);
  if (q.to)       query.set('to', q.to);

  // Asegura page/pageSize numéricos por defecto
  query.set('page', String(q.page ?? 1));
  query.set('pageSize', String(q.pageSize ?? 1000));

  const res = await fetch(`${baseURL}/api/appointments?${query.toString()}`);
  if (!res.ok) {
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
  const pageSize = Number(raw?.pageSize ?? params.pageSize ?? 1000);

  return { items, total, page, pageSize };
}

/**
 * CREATE: backend si hay baseURL; si no, local.addAppointment()
 */
export async function addAppointment(newItem) {
  if (!api.baseURL) return local.addAppointment(newItem);

  // (opcional) saneo de teléfono
  const telDigits = String(newItem.telefono ?? '').replace(/\D/g, '');
  const telefono = telDigits.length === 9 ? telDigits : undefined;

  const body = {
    nombrePaciente: newItem.nombrePaciente ?? newItem.paciente,
    // ❌ rut eliminado
    telefono,
    fechaCita: newItem.fechaCita,        // ISO recomendado
    medicoId: newItem.medicoId,
    estadoCita: normalizeStatus(newItem.estadoCita),
    origin: "web",
  };

  const { ok, data } = await api.post('/api/appointments', { body });
  if (!ok) {
    console.warn('POST /api/appointments falló, usando fuente local:');
    return local.addAppointment(newItem);
  }
  return mapCitaApiToDTO(data);
}

/**
 * UPDATE STATUS (bulk o 1): backend preferido; fallback local
 * - Envia "enviado" cuando corresponde.
 * - Si el backend rechaza por enum, prueba "enviada" como plan B (solo para persistir).
 */
export async function updateStatus(ids, nextStatus) {
  const idList = Array.isArray(ids) ? ids : [ids];
  const desired = normalizeStatus(nextStatus);           // lo que muestra UI y deseamos enviar
  if (!api.baseURL) return local.updateStatus(idList, desired);

  // 1) Intentos bulk más comunes
  const tries = [
    { m: 'patch', url: '/api/appointments',              body: { ids: idList, estadoCita: desired } },
    { m: 'patch', url: '/api/appointments/bulk/status',  body: { ids: idList, estado: desired } },
    { m: 'post',  url: '/api/appointments/bulk/status',  body: { ids: idList, estado: desired } },
    { m: 'post',  url: '/api/appointments/bulk_status',  body: { ids: idList, estado: desired } },
    { m: 'patch', url: '/api/citas/bulk/status',         body: { ids: idList, estado: desired } },
  ];

  for (const t of tries) {
    const res = await api[t.m](t.url, { body: t.body });
    if (res?.ok) return true;

    // Si rechazó por enum y queríamos "enviado", intenta femenino "enviada" para persistir
    if (desired === 'enviado' && isEnumError(res?.data)) {
      const alt = await api[t.m](t.url, { body: { ...t.body, estado: 'enviada', estadoCita: 'enviada' } });
      if (alt?.ok) return true;
    }
  }

  // 2) Fallback por ID (PATCH a cada cita)
  let okCount = 0;
  const failed = [];

  for (const id of idList) {
    let saved = false;

    // a) campo estadoCita
    let r = await api.patch(`/api/appointments/${encodeURIComponent(id)}`, {
      body: { estadoCita: desired }
    });
    if (r?.ok) { okCount++; saved = true; }

    // b) probar "estado" si lo anterior falla
    if (!saved) {
      r = await api.patch(`/api/appointments/${encodeURIComponent(id)}`, {
        body: { estado: desired }
      });
      if (r?.ok) { okCount++; saved = true; }
    }

    // c) plan B femenino si enum rechaza "enviado"
    if (!saved && desired === 'enviado' && isEnumError(r?.data)) {
      r = await api.patch(`/api/appointments/${encodeURIComponent(id)}`, {
        body: { estadoCita: 'enviada' }
      });
      if (r?.ok) { okCount++; saved = true; }
      else {
        r = await api.patch(`/api/appointments/${encodeURIComponent(id)}`, {
          body: { estado: 'enviada' }
        });
        if (r?.ok) { okCount++; saved = true; }
      }
    }

    if (!saved) failed.push(id);
  }

  if (failed.length) {
    console.warn('Algunas citas no pudieron actualizarse:', failed);
  }
  return failed.length === 0;
}

/**
 * SEND BOT (bulk): backend preferido; fallback local
 * (Deja la respuesta para que el front pueda decidir si marcar “enviado” solo cuando Graph devuelve accepted)
 */
export async function sendBot(ids = []) {
  if (!api.baseURL) return local.sendBot(ids);

  const { ok, data, error } = await api.post('/api/appointments/send-bot', {
    body: { ids },
  });
  if (!ok) {
    console.warn('POST /api/appointments/send-bot falló, usando fuente local:', error);
    return local.sendBot(ids);
  }
  // Devuelve tal cual lo que venga; el front ya normaliza
  return data ?? { ok: true };
}

// ----------------------

function normalizeQuery(q = {}) {
  const out = {};
  if (q.search) out.search = q.search;
  if (q.estado) out.estado = normalizeStatus(q.estado);
  if (q.medicoId) out.medicoId = q.medicoId;
  if (q.from) out.from = q.from;
  if (q.to) out.to = q.to;
  if (q.page != null) out.page = q.page;
  if (q.pageSize != null) out.pageSize = q.pageSize;
  if (q.sort) out.sort = q.sort;
  return out;
}

/** Normaliza estados (acepta femeninos y con tilde). Devuelve strings canónicos. */
function normalizeStatus(s) {
  const raw = String(s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

  // Mapa de retorno (usa constantes si existen; strings para los nuevos)
  const S = {
    pendiente:   STATUS?.PENDIENTE   ?? 'pendiente',
    confirmada:  STATUS?.CONFIRMADA  ?? 'confirmada',
    cancelada:   STATUS?.CANCELADA   ?? 'cancelada',
    reprogramada:STATUS?.REPROGRAMADA?? 'reprogramada',
    enviado:     'enviado',
    recibido:    'recibido',
    leido:       'leido',
  };

  if (raw.startsWith('confirm')) return S.confirmada;
  if (raw.startsWith('cancel'))  return S.cancelada;
  if (raw.startsWith('reprogr')) return S.reprogramada;
  if (raw.startsWith('envi'))    return S.enviado;    // enviado/enviada
  if (raw.startsWith('recib'))   return S.recibido;   // recibido/recibida
  if (raw.startsWith('leid'))    return S.leido;      // leido/leído/leida
  if (raw.startsWith('pend'))    return S.pendiente;

  // fallback por si viene exacto
  if (raw === 'enviado' || raw === 'enviada') return S.enviado;
  if (raw === 'recibido' || raw === 'recibida') return S.recibido;
  if (raw === 'leido' || raw === 'leida') return S.leido;

  return S.pendiente;
}

function isEnumError(errData) {
  const s = (errData && JSON.stringify(errData).toLowerCase()) || '';
  return s.includes('enum') || s.includes('invalid') || s.includes('estado');
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
