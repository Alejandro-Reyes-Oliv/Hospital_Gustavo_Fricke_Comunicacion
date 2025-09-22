// Constantes compartidas entre UI/servicios/validaciones

export const STATUS = Object.freeze({
  PENDIENTE: 'pendiente',
  CONFIRMADA: 'confirmada',
  CANCELADA: 'cancelada',
})

export const STATUS_LIST = Object.freeze([
  STATUS.PENDIENTE,
  STATUS.CONFIRMADA,
  STATUS.CANCELADA,
])

// Opcional: claves de storage usadas por los mocks/LS actuales (solo referencia)
export const STORAGE_KEYS = Object.freeze({
  APPOINTMENTS: 'appointments_local_v2',
})
