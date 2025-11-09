// Estados canónicos usados en todo el front
export const STATUS = Object.freeze({
  PENDIENTE:    'pendiente',
  CONFIRMADA:   'confirmada',
  CANCELADA:    'cancelada',
  REPROGRAMADA: 'reprogramada',
  ENVIADO:      'enviado',
  RECIBIDO:     'recibido',
  LEIDO:        'leido',   // sin tilde para claves y comparaciones
});

// Listas útiles
export const STATUS_LIST = Object.freeze([
  STATUS.PENDIENTE,
  STATUS.CONFIRMADA,
  STATUS.CANCELADA,
  STATUS.REPROGRAMADA,
  STATUS.ENVIADO,
  STATUS.RECIBIDO,
  STATUS.LEIDO,
]);

// Si en filtros tienes “Todos”
export const FILTER_STATUS_LIST = Object.freeze(['todos', ...STATUS_LIST]);

// (Opcional) estados relacionados al bot para usar en UI si quieres
export const BOT_STATUS = Object.freeze({
  ENVIADO:  STATUS.ENVIADO,
  RECIBIDO: STATUS.RECIBIDO,
  LEIDO:    STATUS.LEIDO,
});

// Opcional: claves de storage usadas por los mocks/LS actuales (solo referencia)
export const STORAGE_KEYS = Object.freeze({
  APPOINTMENTS: 'appointments_local_v2',
});
