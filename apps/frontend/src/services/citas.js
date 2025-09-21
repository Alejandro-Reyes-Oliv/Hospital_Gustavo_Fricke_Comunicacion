const STORAGE_KEY = "appointments_local_v2";

// --- Utilidades ---
const persist = (arr) => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
const getRaw = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

// Detecta si un registro ya está en el nuevo esquema
const isNewRecord = (r) =>
  r && ("nombrePaciente" in r || "estadoCita" in r);

// Convierte un registro viejo -> nuevo
const mapLegacyToNew = (r) => {
  // Ej: { id, paciente, fecha, hora, estado }
  const fechaCita = r.hora
    ? `${r.fecha}T${String(r.hora).padStart(5, "0")}`
    : r.fecha || r.fechaCita || "";

  return {
    id: r.id,
    nombrePaciente: r.paciente ?? r.nombrePaciente ?? "",
    rut: r.rut ?? "",
    fechaCita,
    nombreMedico: r.nombreMedico ?? "",
    especialidadMedico: r.especialidadMedico ?? "",
    telefono: r.telefono ?? "",
    estadoCita: r.estado ?? r.estadoCita ?? "pendiente",
  };
};

// Normaliza cualquier arreglo a nuevo esquema
const normalizeArray = (arr) => (arr || []).map((r) => (isNewRecord(r) ? r : mapLegacyToNew(r)));

export async function listCitas(params = {}) {
  const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000';

  const query = new URLSearchParams();
  if (params.search)   query.set('search', params.search);
  if (params.estado)   query.set('estado', params.estado);
  if (params.medicoId) query.set('medicoId', params.medicoId);
  if (params.sort)     query.set('sort', params.sort);
  if (params.from)     query.set('from', params.from);
  if (params.to)       query.set('to', params.to);

  // Asegura page/pageSize numéricos por defecto
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 10));

  const res = await fetch(`${baseURL}/api/citas?${query.toString()}`);
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


export async function addAppointment({
  // NUEVO esquema
  nombrePaciente,
  rut = "",
  fechaCita,              // string ISO o "YYYY-MM-DDTHH:mm"
  nombreMedico = "",
  especialidadMedico = "",
  telefono = "",
  estadoCita = "pendiente",
  // Compat: si alguien llama con el esquema viejo:
  paciente,
  fecha,
  hora,
  estado,
}) {
  // Si vienen los campos viejos, mapéalos a los nuevos
  if (!nombrePaciente && paciente) nombrePaciente = paciente;
  if (!fechaCita && (fecha || hora)) {
    fechaCita = hora ? `${fecha}T${String(hora).padStart(5, "0")}` : fecha;
  }
  if (!estadoCita && estado) estadoCita = estado;

  const rows = await listCitas();
  const id = rows.length ? Math.max(...rows.map((r) => Number(r.id) || 0)) + 1 : 1;

  const nuevo = {
    id,
    nombrePaciente: nombrePaciente || "",
    rut: rut || "",
    fechaCita: fechaCita || "",
    nombreMedico,
    especialidadMedico,
    telefono,
    estadoCita,
  };

  const updated = [nuevo, ...rows];
  persist(updated);
  return nuevo;
}

export async function updateStatus(ids = [], status = "pendiente") {
  // Acepta tanto "pendiente/confirmada/cancelada" como abreviados
  const normalizeStatus = (s) => {
    const t = String(s || "").toLowerCase();
    if (t.startsWith("confirm")) return "confirmada";
    if (t.startsWith("cancel")) return "cancelada";
    if (t.startsWith("pend"))   return "pendiente";
    return s || "pendiente";
  };

  const rows = await listCitas();
  const set = new Set(ids);
  const nextStatus = normalizeStatus(status);

  const updated = rows.map((r) =>
    set.has(r.id) ? { ...r, estadoCita: nextStatus } : r
  );
  persist(updated);
  return updated.filter((r) => set.has(r.id));
}

// Simulación de envío al bot (con backend real reemplazas esto)
export async function sendBot(ids = []) {
  await new Promise((res) => setTimeout(res, 600));
  return { sent: ids, ok: true };
}

// Helper opcional para limpiar datos (útil en pruebas)
export function resetCitas(seed = []) {
  const normalized = normalizeArray(seed);
  persist(normalized);
  return normalized;
}
