// src/features/auth/pages/LoginPage.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../services/auth.js";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState("");

  const nav = useNavigate();
  const loc = useLocation();
  const next = loc.state?.from?.pathname || "/citas";

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      // login demo (admin/admin123 o usuarios de users.js)
      login(username, password);
      nav(next, { replace: true });
    } catch (ex) {
      setErr(ex?.message || "No se pudo iniciar sesión");
    }
  }

  function fillAdmin() {
    setU("admin");
    setP("admin123");
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white border rounded-2xl shadow p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold">Ingresar</h1>

        {err && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {err}
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="u" className="text-sm text-slate-600">
            Usuario
          </label>
          <input
            id="u"
            className="w-full h-10 rounded border px-3"
            value={username}
            onChange={(e) => setU(e.target.value)}
            autoFocus
            autoComplete="username"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="p" className="text-sm text-slate-600">
            Contraseña
          </label>
          <input
            id="p"
            type="password"
            className="w-full h-10 rounded border px-3"
            value={password}
            onChange={(e) => setP(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-full px-4 py-2 bg-slate-900 text-white"
          >
            Entrar
          </button>

          {/* Atajo dev (rellena admin/admin123) */}
          <button
            type="button"
            onClick={fillAdmin}
            className="rounded-full px-3 py-2 bg-slate-200 text-slate-800"
            title="Autocompletar admin/admin123 (demo)"
          >
            Admin demo
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Demo: admin / admin123 — o usuarios de prueba definidos en
          <code className="ml-1 px-1 py-0.5 bg-slate-100 rounded">users.js</code>
        </p>
      </form>
    </div>
  );
}
