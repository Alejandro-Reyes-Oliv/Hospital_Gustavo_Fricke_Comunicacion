// src/features/citas/services/citas.p2.js
import api from "../../../shared/lib/apiClient.js";
import { mapCitaApiToDTO } from "../../../shared/lib/dto.js";
import { STATUS } from "../../../shared/lib/constants.js";

// Solo API: usa .env; si no está, se muestra error desde el gate


function assertApi() {
  if (!api.baseURL) {
    throw new Error("API no configurada. Define VITE_API_BASE_URL en el frontend.");
  }
}

// ---------- LIST ----------
export async function listCitas(params = {}) {
  assertApi();
  const q = normalizeQuery(params);

  const { ok, data, error } = await api.get("/api/appointments", { query: q });
  if (!ok) throw new Error(error?.error?.message || "Error al listar citas");

  const items = Array.isArray(data?.items)
    ? data.items
    : (Array.isArray(data?.data) ? data.data : []);

  return {
    items,
    total: Number(data?.total ?? items.length),
    page: Number(data?.page ?? q.page ?? 1),
    pageSize: Number(data?.pageSize ?? q.pageSize ?? (items.length || 1000)),
  };
}

// ---------- CREATE ----------
export async function addAppointment(newItem) {
  assertApi();

  const telDigits = String(newItem.telefono ?? "").replace(/\D/g, "");
  const telefono = telDigits.length === 9 ? telDigits : undefined;

  const body = {
    nombrePaciente: newItem.nombrePaciente ?? newItem.paciente,
    telefono,
    fechaCita: newItem.fechaCita,
    medicoId: newItem.medicoId,
    estadoCita: normalizeStatus(newItem.estadoCita),
    origin: "web",
  };

  const { ok, data, error } = await api.post("/api/appointments", { body });
  if (!ok) throw new Error(error?.error?.message || "Error al crear cita");
  return mapCitaApiToDTO(data);
}

// ---------- UPDATE STATUS (bulk o 1) ----------
export async function updateStatus(ids, nextStatus) {
  assertApi();

  const idList = Array.isArray(ids) ? ids : [ids];
  const desired = normalizeStatus(nextStatus);

  const tries = [
    { m: "patch", url: "/api/appointments",             body: { ids: idList, estadoCita: desired } },
    { m: "patch", url: "/api/appointments/bulk/status", body: { ids: idList, estado: desired } },
    { m: "post",  url: "/api/appointments/bulk/status", body: { ids: idList, estado: desired } },
    { m: "post",  url: "/api/appointments/bulk_status", body: { ids: idList, estado: desired } },
    { m: "patch", url: "/api/citas/bulk/status",        body: { ids: idList, estado: desired } },
  ];

  for (const t of tries) {
    const res = await api[t.m](t.url, { body: t.body });
    if (res?.ok) return true;

    if (desired === "enviado" && isEnumError(res?.data)) {
      const alt = await api[t.m](t.url, { body: { ...t.body, estado: "enviada", estadoCita: "enviada" } });
      if (alt?.ok) return true;
    }
  }

  // Fallback por ID si no hay endpoint bulk
  let okCount = 0;
  for (const id of idList) {
    let r = await api.patch(`/api/appointments/${encodeURIComponent(id)}`, { body: { estadoCita: desired } });
    if (r?.ok) { okCount++; continue; }

    r = await api.patch(`/api/appointments/${encodeURIComponent(id)}`, { body: { estado: desired } });
    if (r?.ok) { okCount++; continue; }

    if (desired === "enviado" && isEnumError(r?.data)) {
      r = await api.patch(`/api/appointments/${encodeURIComponent(id)}`, { body: { estadoCita: "enviada" } });
      if (r?.ok) { okCount++; continue; }
      r = await api.patch(`/api/appointments/${encodeURIComponent(id)}`, { body: { estado: "enviada" } });
      if (r?.ok) { okCount++; continue; }
    }
  }
  return okCount === idList.length;
}

// ---------- SEND BOT ----------
export async function sendBot(ids = []) {
  assertApi();
  const { ok, data, error } = await api.post("/api/appointments/send-bot", { body: { ids } });
  if (!ok) throw new Error(error?.error?.message || "Error al enviar bot");
  return data ?? { ok: true };
}

// ---------- DELETE (de a uno) ----------
export async function deleteAppointments(ids = []) {
  assertApi();
  if (!Array.isArray(ids) || !ids.length) return 0;
  let count = 0;
  for (const id of ids) {
    const { ok } = await api.delete(`/api/appointments/${encodeURIComponent(id)}`);
    if (ok) count++;
  }
  return count;
}

// ---------- Helpers ----------
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
  if (raw.startsWith("pend"))    return S.pendiente;
  if (raw === "enviado" || raw === "enviada") return S.enviado;
  if (raw === "recibido" || raw === "recibida") return S.recibido;
  if (raw === "leido" || raw === "leida") return S.leido;
  return S.pendiente;
}

function isEnumError(errData) {
  const s = (errData && JSON.stringify(errData).toLowerCase()) || "";
  return s.includes("enum") || s.includes("invalid") || s.includes("estado");
}
