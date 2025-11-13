// src/components/StatusPill.jsx
function canonical(key) {
  const k = String(key || "").toLowerCase();
  if (k === "enviada") return "enviado";
  if (k === "recibida") return "recibido";
  if (k === "leída" || k === "leida") return "leido";
  return k;
}

const COLORS = {
  pendiente:    "bg-slate-100 text-slate-800 border-slate-200",
  confirmada:   "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelada:    "bg-rose-100 text-rose-800 border-rose-200",
  reprogramada: "bg-amber-100 text-amber-800 border-amber-200",
  enviado:      "bg-sky-100 text-sky-800 border-sky-200",
  recibido:     "bg-indigo-100 text-indigo-800 border-indigo-200",
  leido:        "bg-violet-100 text-violet-800 border-violet-200",
  recordado:    "bg-teal-100 text-teal-800 border-teal-200", // <-- NUEVO ESTADO
};

const LABELS = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  reprogramada: "Reprogramada",
  enviado: "Enviado",
  recibido: "Recibido",
  leido: "Leído",
  recordado: "Recordado", // <-- NUEVO ESTADO
};

export default function StatusPill({ estado }) {
  const key = canonical(estado);
  const cls = COLORS[key] ?? COLORS.pendiente;
  const label = LABELS[key] ?? LABELS.pendiente;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
