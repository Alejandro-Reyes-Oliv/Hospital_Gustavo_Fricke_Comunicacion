// src/shared/components/ErrorBanner.jsx
export default function ErrorBanner({ title = "Ocurrió un error", message, onRetry }) {
  const msg = normalizeMessage(message);
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
      <div className="font-semibold">{title}</div>
      {msg ? <div className="text-sm mt-1">{msg}</div> : null}
      {onRetry ? (
        <button onClick={onRetry} className="mt-3 rounded-lg border px-3 py-1 text-sm hover:bg-white">
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

function normalizeMessage(m) {
  if (!m) return null;
  if (typeof m === "string") return m;
  const code = m?.error?.code || m?.status || m?.code;
  const text = m?.error?.message || m?.message || "Fallo de red o servidor";
  return code ? `${text} (código ${code})` : text;
}
