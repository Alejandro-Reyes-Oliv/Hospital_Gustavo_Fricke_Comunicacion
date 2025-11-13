// Normalización y formateo mínimo de fechas

// Asegura ISO completo (incluida zona horaria) cuando venga "fecha + hora" sueltos
export function toISO(dateLike) {
  try {
    // Si ya es ISO razonable, lo devolvemos
    if (typeof dateLike === 'string' && /\d{4}-\d{2}-\d{2}T/.test(dateLike)) {
      return new Date(dateLike).toISOString()
    }
    const d = new Date(dateLike)
    console.log("Fecha ISO generada: ", d.toISOString());
    return d.toISOString()
    
  } catch {
    return null
  }
}

// Muestra amigable: 15/09/2025 14:30
export function formatFechaHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
}
