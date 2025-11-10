export default function Loader({ label = "Cargando…" }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 p-4 text-slate-600">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
