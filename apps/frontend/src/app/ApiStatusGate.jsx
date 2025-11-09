// src/app/ApiStatusGate.jsx
import { useEffect, useState } from "react";
import api from "../shared/lib/apiClient.js";

// Puedes sobreescribir con VITE_HEALTH_PATH (opcional)
const ENV_HEALTH = (import.meta.env.VITE_HEALTH_PATH ?? "").trim();

const PROBE_PATHS = ENV_HEALTH
  ? [ENV_HEALTH]
  : [
      "/api/appointments?page=1&pageSize=1", // tus endpoints reales
      "/api/doctors?page=1&pageSize=1",
      "/openapi.json",                        // FastAPI/otros
      "/docs",
      "/"                                     // última chance: root
    ];

// Considera "API arriba" si responde algo diferente a 5xx
const isHealthyStatus = (s) => s >= 200 && s < 500;

export default function ApiStatusGate({ children }) {
  const [state, setState] = useState(api.baseURL ? "checking" : "no-config");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (!api.baseURL) return;

    let cancelled = false;
    (async () => {
      const { ok, error } = await probeApi(api.baseURL, PROBE_PATHS, 3500);
      if (cancelled) return;
      if (ok) setState("ok");
      else { setDetail(error || "No se pudo conectar"); setState("down"); }
    })();

    return () => { cancelled = true; };
  }, []);

  if (state === "no-config") {
    return <NoApi msg="API no configurada. Define VITE_API_BASE_URL y reinicia el front." />;
  }
  if (state === "down") {
    return <NoApi msg={`No se pudo conectar a la API (${api.baseURL}).`} detail={detail} />;
  }
  return children;
}

async function probeApi(base, paths, timeoutMs = 3000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    for (const p of paths) {
      try {
        const url = `${base}${p}`;
        const res = await fetch(url, { signal: controller.signal, method: "GET" });
        if (isHealthyStatus(res.status)) return { ok: true };
        // si 5xx, intenta el siguiente path
      } catch (e) {
        // network/CORS/timeout → intenta siguiente path
      }
    }
    return { ok: false, error: "Timeout, CORS o servidor no disponible." };
  } finally {
    clearTimeout(t);
  }
}

function NoApi({ msg, detail }) {
  return (
    <div className="p-8 max-w-2xl mx-auto text-center">
      <p className="text-lg font-semibold text-red-600">{msg}</p>
      {detail ? <p className="text-sm text-slate-600 mt-2">{detail}</p> : null}
      <p className="text-sm text-slate-600 mt-2">
        Verifica URL, puerto, VPN/CORS y que el backend responda.
      </p>
      <button
        onClick={() => location.reload()}
        className="mt-4 px-4 py-2 rounded-lg border hover:bg-gray-50"
      >
        Reintentar
      </button>
    </div>
  );
}
