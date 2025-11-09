// src/lib/dto.js
// "Contrato" de datos visible por el front: define DTOs y mapeadores.
// No acopla al modelo de Prisma. Úsalo entre servicios y UI.
import { STATUS } from './constants.js';
import { toISO } from './date.js';
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
  };
}

// ---------- Cita ----------
/**
 * @typedef {Object} CitaDTO
 * @property {string} id
 * @property {string} nombrePaciente
 * @property {string=} rut            // ➜ no usamos en UI; lo dejamos undefined
 * @property {string=} telefono
 * @property {string} fechaCita       // ISO 8601 full
 * @property {string} medicoId
 * @property {string} nombreMedico
 * @property {string} especialidadMedico
 * @property {'pendiente'|'confirmada'|'cancelada'|'reprogramada'|'enviado'|'recibido'|'leido'} estadoCita
 * @property {string=} createdAt // ISO
 * @property {string=} updatedAt // ISO
 */



// Normaliza estados (acepta femenino y acentos) → canónicos del front
function canonicalStatus(s) {
  const raw = String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  if (raw.startsWith('confirm')) return STATUS.CONFIRMADA;
  if (raw.startsWith('cancel'))  return STATUS.CANCELADA;
  if (raw.startsWith('reprogr')) return STATUS.REPROGRAMADA;
  if (raw.startsWith('envi'))    return STATUS.ENVIADO;   // enviado/enviada
  if (raw.startsWith('recib'))   return STATUS.RECIBIDO;  // recibido/recibida
  if (raw.startsWith('leid'))    return STATUS.LEIDO;     // leido/leída/leida
  if (raw.startsWith('pend'))    return STATUS.PENDIENTE;

  if (['enviado','enviada'].includes(raw))   return STATUS.ENVIADO;
  if (['recibido','recibida'].includes(raw)) return STATUS.RECIBIDO;
  if (['leido','leida'].includes(raw))       return STATUS.LEIDO;

  return STATUS.PENDIENTE;
}

export function mapCitaApiToDTO(x = {}) {
  // Acepta variantes de nombres que podrían venir del backend/mocks/LS
  const estadoSrc = x.estadoCita ?? x.estado ?? x.status ?? STATUS.PENDIENTE;
  const estado = canonicalStatus(estadoSrc);

  const fechaISO = toISO(
    x.fechaCita ??
      x.fecha ??
      // fallback legacy: fecha + hora separadas
      (x.hora && x.fecha ? `${x.fecha}T${String(x.hora).padStart(5, '0')}` : undefined)
  );

  return {
    id: String(x.id ?? ''),
    nombrePaciente: String(x.nombrePaciente ?? x.paciente ?? ''),
    rut: undefined, // 👈 no usamos RUT en el front ni lo pedimos al backend
    telefono: x.telefono ?? x.phone ?? undefined,
    fechaCita: fechaISO || '',
    medicoId: String(x.medicoId ?? x.idMedico ?? ''),
    nombreMedico: String(x.nombreMedico ?? x.medico ?? ''),
    especialidadMedico: String(x.especialidadMedico ?? x.especialidad ?? ''),
    estadoCita: estado, // 👈 preserva enviado/recibido/leido/reprogramada/...
    createdAt: x.createdAt ?? x.created_at ?? undefined,
    updatedAt: x.updatedAt ?? x.updated_at ?? undefined,
  };
}
