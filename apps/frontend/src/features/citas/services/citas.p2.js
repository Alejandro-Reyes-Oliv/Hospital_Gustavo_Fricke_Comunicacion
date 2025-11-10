// src/features/citas/services/citas.p2.js
import api from "../../../shared/lib/apiClient.js";
import { mapCitaApiToDTO } from "../../../shared/lib/dto.js";
import { STATUS } from "../../../shared/lib/constants.js";

/* ===========================
   Helpers base
=========================== */
function assertApi() {
  if (!api?.baseURL) {
    throw new Error("API no configurada. Define VITE_API_BASE_URL en el frontend.");
  }
}

function asArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

/* ===========================
   LIST
=========================== */
// GET /api/appointments
export async function listCitas(params = {}) {
  assertApi();
  const q = normalizeQuery(params);

  const res = await api.get("/api/appointments", { query: q });
  if (!res?.ok) {
    // distintos backends suelen devolver {error:{message}} o texto
    const msg =
      res?.error?.data?.error?.message ||
      res?.error?.data?.message ||
      res?.error?.data ||
      "Error al listar citas";
    throw new Error(typeof msg === "string" ? msg : "Error al listar citas");
  }

  const items = asArray(res.data);
  return {
    items,
    total: Number(res.data?.total ?? items.length),
    page: Number(res.data?.page ?? q.page ?? 1),
    pageSize: Number(res.data?.pageSize ?? q.pageSize ?? (items.length || 1000)),
  };
}

/* ===========================
   CREATE
=========================== */
// POST /api/appointments
export async function addAppointment(newItem) {
  assertApi();

  const telDigits = String(newItem.telefono ?? "").replace(/\D/g, "");
  const telefono = telDigits.length === 9 ? telDigits : undefined;

  const payload = {
    nombrePaciente: newItem.nombrePaciente ?? newItem.paciente,
    telefono,
    fechaCita: new Date(newItem.fechaCita),
    medicoId: newItem.medicoId,
    estadoCita: normalizeStatus(newItem.estadoCita),
    origin: "web",
  };

  // OJO: pasamos el payload directo (no { body })
  const res = await api.post("/api/appointments", payload);
  if (!res?.ok) {
    const msg =
      res?.error?.data?.error?.message ||
      res?.error?.data?.message ||
      res?.error?.data ||
      "Error al crear cita";
    throw new Error(typeof msg === "string" ? msg : "Error al crear cita");
  }
  return mapCitaApiToDTO(res.data);
}

/* ===========================
   UPDATE STATUS (bulk o 1)
=========================== */
export async function updateStatus(ids, nextStatus) {
  assertApi();

  // acepta Set/Array/uno suelto
  const idList = Array.isArray(ids) ? ids : Array.from(new Set([ids])).filter(Boolean);
  const desired = normalizeStatus(nextStatus);

  const tries = [
    { m: "patch", url: "/api/appointments",             body: { ids: idList, estadoCita: desired } },
    { m: "patch", url: "/api/appointments/bulk/status", body: { ids: idList, estado: desired } },
    { m: "post",  url: "/api/appointments/bulk/status", body: { ids: idList, estado: desired } },
    { m: "post",  url: "/api/appointments/bulk_status", body: { ids: idList, estado: desired } },
    { m: "patch", url: "/api/citas/bulk/status",        body: { ids: idList, estado: desired } },
  ];

  // intenta endpoints bulk conocidos
  for (const t of tries) {
    const res = await api[t.m](t.url, t.body);
    if (res?.ok) return true;

    // a veces el enum del back solo acepta "enviada" (fem)
    if (desired === "enviado" && isEnumError(res?.data)) {
      const alt = await api[t.m](t.url, { ...t.body, estado: "enviada", estadoCita: "enviada" });
      if (alt?.ok) return true;
    }
  }

  // Fallback por ID si no hay endpoint bulk
  let okCount = 0;
  for (const id of idList) {
    let r = await api.patch(`/api/appointments/${encodeURIComponent(id)}`, { estadoCita: desired });
    if (r?.ok) { okCount++; continue; }

    r = await api.patch(`/api/appointments/${encodeURIComponent(id)}`, { estado: desired });
    if (r?.ok) { okCount++; continue; }

    if (desired === "enviado" && isEnumError(r?.data)) {
      r = await api.patch(`/api/appointments/${encodeURIComponent(id)}`, { estadoCita: "enviada" });
      if (r?.ok) { okCount++; continue; }
      r = await api.patch(`/api/appointments/${encodeURIComponent(id)}`, { estado: "enviada" });
      if (r?.ok) { okCount++; continue; }
    }
  }
  return okCount === idList.length;
}

/* ===========================
   SEND BOT
=========================== */
// POST /api/appointments/send-bot  body: { ids: string[] }
export async function sendBot(ids = []) {
  assertApi();

  // normaliza ids a strings limpias
  const arr = Array.from(ids).map((x) => String(x)).filter(Boolean);
  if (!arr.length) throw new Error("No hay IDs seleccionados");

  // payload directo
  const res = await api.post("/api/appointments/send-bot", { ids: arr });
  if (!res?.ok) {
    const msg =
      res?.error?.data?.error ||
      res?.error?.data?.message ||
      res?.error?.data ||
      "Error al enviar bot";
    throw new Error(typeof msg === "string" ? msg : "Error al enviar bot");
  }
  return res.data ?? { ok: true };
}

/* ===========================
   DELETE (uno por uno)
=========================== */
export async function deleteAppointments(ids = []) {
  assertApi();
  const idList = Array.isArray(ids) ? ids : [ids];
  let count = 0;
  for (const id of idList) {
    const res = await api.delete(`/api/appointments/${encodeURIComponent(id)}`);
    if (res?.ok) count++;
  }
  return count;
}

/* ===========================
   Helpers de query / estado
=========================== */
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

function normalizeStatus(s) {
  const raw = String(s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const S = {
    pendiente:    STATUS?.PENDIENTE    ?? "pendiente",
    confirmada:   STATUS?.CONFIRMADA   ?? "confirmada",
    cancelada:    STATUS?.CANCELADA    ?? "cancelada",
    reprogramada: STATUS?.REPROGRAMADA ?? "reprogramada",
    enviado:      "enviado",
    recibido:     "recibido",
    leido:        "leido",
  };
  if (raw.startsWith("confirm")) return S.confirmada;
  if (raw.startsWith("cancel"))  return S.cancelada;
  if (raw.startsWith("reprogr")) return S.reprogramada;
  if (raw.startsWith("envi"))    return S.enviado;
  if (raw.startsWith("recib"))   return S.recibido;
  if (raw.startsWith("leid"))    return S.leido;
  if (raw === "enviado" || raw === "enviada") return S.enviado;
  if (raw === "recibido" || raw === "recibida") return S.recibido;
  if (raw === "leido" || raw === "leida") return S.leido;
  return S.pendiente;
}

function isEnumError(errData) {
  const s = (errData && JSON.stringify(errData).toLowerCase()) || "";
  return s.includes("enum") || s.includes("invalid") || s.includes("estado");
}
