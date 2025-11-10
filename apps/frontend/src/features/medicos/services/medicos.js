// src/features/medicos/services/medicos.js
import api, { assertApi } from "../../../shared/lib/apiClient.js";

// Ruta fija según tu back:
const BASE = "/api/doctors";

// util: convertir 1/"1"/"true" → true, 0/"0"/"false" → false
function toBool(v, def = true) {
  if (typeof v === "boolean") return v;
  if (v == null) return def;
  const s = String(v).trim().toLowerCase();
  if (["1","true","t","yes","y"].includes(s)) return true;
  if (["0","false","f","no","n"].includes(s)) return false;
  if (!Number.isNaN(Number(v))) return Number(v) !== 0;
  return def;
}

function normalize(d) {
  return {
    id: d?.id ?? d?.doctor_id ?? d?.uuid ?? d?.codigo ?? null,
    nombre: d?.nombre ?? d?.name ?? d?.full_name ?? "",
    especialidad: d?.especialidad ?? d?.specialty ?? d?.especialidadMedico ?? "",
    is_active: toBool(d?.is_active ?? d?.estado ?? d?.activo ?? true, true),
    email: d?.email ?? "",
    telefono: d?.telefono ?? d?.phone ?? "",
    ...d,
  };
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function listDoctors(params = {}) {
  assertApi();
  const { q, is_active, limit, offset, page, pageSize, sort } = params ?? {};
  const query = {};
  if (q) query.q = q;
  if (typeof is_active === "boolean") query.is_active = is_active;
  if (Number.isInteger(limit)) query.limit = limit;
  if (Number.isInteger(offset)) query.offset = offset;
  if (Number.isInteger(page)) query.page = page;
  if (Number.isInteger(pageSize)) query.pageSize = pageSize;
  if (sort) query.sort = sort;

  const { ok, data, error } = await api.get(BASE, { query });
  if (!ok) throw error || new Error("No se pudieron obtener los médicos");
  return asArray(data).map(normalize);
}

export async function createDoctor(payload) {
  assertApi();
  const { ok, data, error } = await api.post(BASE, payload);
  if (!ok) throw error || new Error("No se pudo crear el médico");
  return normalize(data);
}

export async function updateDoctor(id, payload) {
  assertApi();
  const { ok, data, error } = await api.patch(`${BASE}/${encodeURIComponent(id)}`, payload);
  if (!ok) throw error || new Error("No se pudo actualizar el médico");
  return normalize(data);
}

export async function deleteDoctor(id) {
  assertApi();
  const { ok, data, error } = await api.delete(`${BASE}/${encodeURIComponent(id)}`);
  if (!ok) throw error || new Error("No se pudo eliminar el médico");
  return data ?? true;
}
