// src/utils/dates.js
export function formatFechaHora(value) {
  if (!value) return "—";
  const d = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (isNaN(d?.getTime?.())) return String(value ?? "—");

  // Chile
  const opts = {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  // Armamos dd-MM-yyyy HH:mm con formatToParts (estable, sin comas)
  const parts = new Intl.DateTimeFormat("es-CL", opts).formatToParts(d)
    .reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  return `${parts.day}-${parts.month}-${parts.year} ${parts.hour}:${parts.minute}`;
}
