export const errorMiddleware = (err, req, res, next) => {
console.error('❌', err)
const status = err.status || 500
const code = err.code || `HTTP_${status}`
const message = err.message || 'Error interno del servidor'
const details = err.details || undefined
res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } })
}