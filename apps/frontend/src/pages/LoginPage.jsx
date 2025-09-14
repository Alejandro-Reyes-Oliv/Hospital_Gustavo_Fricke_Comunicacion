import { useState } from "react";

export default function LoginPage({ onSuccess, onError, loading = false, onSubmit }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await onSubmit?.({ username, password });
      onSuccess?.();
    } catch (err) {
      const m = err?.message || "Error de autenticación";
      setMsg(m);
      onError?.(m);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white shadow rounded p-6 space-y-4">
        <h1 className="text-xl font-semibold text-gray-800">Iniciar sesión</h1>

        {msg && <div className="text-sm text-red-600">{msg}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="block text-sm text-gray-700">Usuario</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm text-gray-700">Contraseña</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 text-sm"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

