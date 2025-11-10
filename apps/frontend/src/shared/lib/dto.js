// src/shared/lib/dto.js
// ⇢ Mini helper local (sin archivos extra)
const pad = (n) => String(n).padStart(2, "0");
const isoToLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);              // Date lo trae a TU zona local
  console.log("Fecha convertida a zona local: ", d);
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`; // formato <input datetime-local>
};

// Normaliza una cita del API a un DTO estable para la UI (sin mover la hora)
export function mapCitaApiToDTO(it = {}) {
  const id =
    it.id ?? it._id ?? it.uuid ?? it.codigo ?? null;

  const nombrePaciente =
    it.nombrePaciente ?? it.paciente_nombre ?? it.paciente ?? "";

  const telefono = String(it.telefono ?? it.paciente_telefono ?? "")
    .replace(/\D/g, "");

  const medicoId =
    it.medicoId ?? it.medico_id ?? it.doctor_id ?? null;

  const especialidad =
    it.especialidad ?? it.especialidad_snap ?? "";

  const estadoRaw =
    String(it.estadoCita ?? it.estado ?? "pendiente").toLowerCase();
  const estadoCita = normalizaEstado(estadoRaw);

  // --- HORA (arreglo simple) ---
  const src = it.fechaCita ?? it.fecha_cita ?? it.fecha ?? null;
  // si viene como ISO con zona (…Z o +HH:MM), conviértelo a formato local para el input
  const isIsoWithTz = typeof src === "string" && /T.+(Z|[+-]\d\d:\d\d)$/.test(src);
  const fechaCita = isIsoWithTz ? isoToLocalInput(src) : src;

  const fecha_hora = Array.isArray(it.fecha_hora) ? it.fecha_hora : undefined;

  return {
    id,
    nombrePaciente,
    telefono,
    medicoId,
    especialidad,
    estadoCita,
    fechaCita,   // <- úsalo directo en <input type="datetime-local">
    fecha_hora,  // <- opcional para mostrar "09 de noviembre …"
    ...it,
  };
}

function normalizaEstado(s) {
  if (s.startsWith("confirm")) return "confirmada";
  if (s.startsWith("cancel"))  return "cancelada";
  if (s.startsWith("reprogr")) return "reprogramada";
  if (s.startsWith("envi"))    return "enviado";
  if (s.startsWith("recib"))   return "recibido";
  if (s.startsWith("leid"))    return "leido";
  if (s === "enviada")         return "enviado";
  if (s === "recibida")        return "recibido";
  if (s === "leida")           return "leido";
  return "pendiente";
}