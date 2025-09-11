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

export async function listCitas() {
  // 1) Intentar leer cache v2
  const cached = getRaw();
  if (cached) return normalizeArray(cached);

  // 2) No hay cache: cargar seed (puede ser el viejo /citas.json)
  const r = await fetch("/citas.json");
  const data = await r.json();

  const normalized = normalizeArray(data);
  persist(normalized);
  return normalized;
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
