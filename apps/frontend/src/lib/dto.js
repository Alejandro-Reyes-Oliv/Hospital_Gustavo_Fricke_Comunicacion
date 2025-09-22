// "Contrato" de datos visible por el front: define DTOs y mapeadores.
// No acopla al modelo de Prisma. Úsalo entre servicios y UI.

// ---------- Doctor ----------
/**
 * @typedef {Object} DoctorDTO
 * @property {string} id
 * @property {string} nombre
 * @property {string} especialidad
 * @property {string=} telefono
 * @property {boolean} activo
 * @property {string=} createdAt // ISO
 * @property {string=} updatedAt // ISO
 */

/**
 * Map backend → DoctorDTO (tolerante a campos extra/case diferente)
 */
export function mapDoctorApiToDTO(x = {}) {
  return {
    id: String(x.id ?? ''),
    nombre: String(x.nombre ?? x.name ?? ''),
    especialidad: String(x.especialidad ?? x.specialty ?? ''),
    telefono: x.telefono ?? x.phone ?? undefined,
    activo: Boolean(x.activo ?? x.active ?? true),
    createdAt: x.createdAt ?? x.created_at ?? undefined,
    updatedAt: x.updatedAt ?? x.updated_at ?? undefined,
  }
}

// ---------- Cita ----------
/**
 * @typedef {Object} CitaDTO
 * @property {string} id
 * @property {string} nombrePaciente
 * @property {string=} rut
 * @property {string=} telefono
 * @property {string} fechaCita     // ISO 8601 full
 * @property {string} medicoId
 * @property {string} nombreMedico
 * @property {string} especialidadMedico
 * @property {'pendiente'|'confirmada'|'cancelada'} estadoCita
 * @property {string=} createdAt // ISO
 * @property {string=} updatedAt // ISO
 */

import { STATUS } from './constants.js'
import { toISO } from './date.js'

export function mapCitaApiToDTO(x = {}) {
  // Acepta variantes de nombres que podrían venir del backend/mocks/LS
  const estado = String(
    x.estadoCita ?? x.estado ?? x.status ?? STATUS.PENDIENTE
  ).toLowerCase()

  const fechaISO = toISO(
    x.fechaCita ??
      x.fecha ??
      // fallback legacy: fecha + hora separadas
      (x.hora && x.fecha ? `${x.fecha}T${String(x.hora).padStart(5, '0')}` : undefined)
  )

  return {
    id: String(x.id ?? ''),
    nombrePaciente: String(x.nombrePaciente ?? x.paciente ?? ''),
    rut: x.rut ?? undefined,
    telefono: x.telefono ?? x.phone ?? undefined,
    fechaCita: fechaISO || '',
    medicoId: String(x.medicoId ?? x.idMedico ?? ''),
    nombreMedico: String(x.nombreMedico ?? x.medico ?? ''),
    especialidadMedico: String(x.especialidadMedico ?? x.especialidad ?? ''),
    estadoCita:
      estado.includes('confirm') ? STATUS.CONFIRMADA :
      estado.includes('cancel')  ? STATUS.CANCELADA :
                                   STATUS.PENDIENTE,
    createdAt: x.createdAt ?? x.created_at ?? undefined,
    updatedAt: x.updatedAt ?? x.updated_at ?? undefined,
  }
}
