export function mapDoctorToDTO(row = {}) {
  return {
    id: String(row.id ?? ""),
    nombre: String(row.nombre ?? ""),
    especialidad: row.especialidad ?? "",
    telefono: row.telefono ?? undefined,
    activo: typeof row.activo === "boolean" ? row.activo : true,
    createdAt: toISO(row.createdAt ?? row.creadoEn),
    updatedAt: toISO(row.updatedAt ?? row.actualizadoEn),
  };
}

export function mapCitaToDTO(row = {}) {

  return {
    id: String(row.id ?? ""),
    nombrePaciente: row.paciente_nombre ?? row.nombrePaciente ?? "",
    rut: row.paciente_rut ?? row.rut ?? undefined,
    telefono: row.paciente_telefono ?? row.telefono ?? undefined,
    fechaCita: row.fecha_hora ?? row.fechaCita ?? "",
    //fechaCita: toISO(row.fecha_hora ?? row.fechaCita, false) ?? "",
    medicoId: String(row.doctorId ?? row.medicoId ?? ""),
    nombreMedico: row.doctor_nombre_snap ?? row.nombreMedico ?? "",
    especialidadMedico: row.especialidad_snap ?? row.especialidadMedico ?? "",
    estadoCita: row.estado ?? row.estadoCita ?? "pendiente",
    createdAt: toISO(row.createdAt ?? row.creadoEn),
    updatedAt: toISO(row.updatedAt ?? row.actualizadoEn),
  };
}

export function mapPacienteToDTO(row = {}) {
  return {
    id: String(row.id ?? ""),
    nombre: row.nombre ?? "",
    rut: row.rut ?? undefined,
    telefono: row.telefono ?? undefined,
    email: row.email ?? undefined,
    activo: typeof row.activo === "boolean" ? row.activo : true,
    createdAt: toISO(row.createdAt ?? row.creadoEn),
    updatedAt: toISO(row.updatedAt ?? row.actualizadoEn),
  };
}

function toISO(v, allowUndefined = true) {
  if (!v) return allowUndefined ? undefined : "";
  try { return typeof v === "string" ? v : v.toISOString?.() ?? String(v); }
  catch { return allowUndefined ? undefined : ""; }
}
