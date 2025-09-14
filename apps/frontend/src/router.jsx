import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import CitasPage from "./pages/CitasPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import MedicosPage from "./pages/MedicosPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

const AUTH_KEY = "auth_session_v1";

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw).user : null;
  } catch { return null; }
}
function isAdmin(user) {
  return !!user && (user.role === "admin" || user.username?.toLowerCase() === "admin");
}

function Layout({ user, onLogout }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <div className="flex gap-2 items-center">
          <button onClick={() => navigate("/")} className="px-3 py-1 border rounded">Citas</button>
          {isAdmin(user) && (
            <>
              <button onClick={() => navigate("/admin/usuarios")} className="px-3 py-1 border rounded">Usuarios</button>
              <button onClick={() => navigate("/admin/medicos")} className="px-3 py-1 border rounded">Médicos</button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Hola, {user?.name || user?.username}</span>
          <button onClick={onLogout} className="px-3 py-1 border rounded">Salir</button>
        </div>
      </div>
      <div className="p-4">
        <Routes>
          <Route path="/" element={<CitasPage />} />
          <Route path="/admin/usuarios" element={<UsersPage />} />
          <Route path="/admin/medicos" element={<MedicosPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function RequireAuth({ children }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
function RequireAdmin({ children }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin(user)) return <Navigate to="/" replace />;
  return children;
}

function LoginWrapper({ onLogged }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubmit({ username, password }) {
    setLoading(true);
    try {
      // DEMO: admin
      if (String(username).toLowerCase() === "admin") {
        const user = { username: "admin", name: "Administrador", role: "admin" };
        onLogged?.(user);                 // <-- AVISA AL ROUTER
        return;
      }
      // Operarios desde localStorage (operators_v1)
      const raw = localStorage.getItem("operators_v1");
      const arr = raw ? JSON.parse(raw) : [];
      const match = arr.find(
        u => (u.username || u.email) === username && (!u.password || u.password === password)
      );
      if (!match) throw new Error("Usuario o contraseña inválidos");
      const user = { username: match.username || match.email, name: match.name || match.username, role: match.role || "operario" };
      onLogged?.(user);                   // <-- AVISA AL ROUTER
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoginPage
      loading={loading}
      onSubmit={handleSubmit}
      onSuccess={() => navigate("/", { replace: true })}
      onError={(m) => console.error(m)}
    />
  );
}


export default function AppRouter() {
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const onAuthChanged = () => setUser(getCurrentUser());
    window.addEventListener("auth:changed", onAuthChanged);
    return () => window.removeEventListener("auth:changed", onAuthChanged);
  }, []);

  function handleLogout() {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  }

  function handleLogged(newUser) {
    // guarda sesión y actualiza estado inmediatamente
    localStorage.setItem(AUTH_KEY, JSON.stringify({ user: newUser }));
    setUser(newUser);
    // por si hay otros listeners
    window.dispatchEvent(new Event("auth:changed"));
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* PASA onLogged AQUÍ */}
        <Route path="/login" element={<LoginWrapper onLogged={handleLogged} />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout user={user} onLogout={handleLogout} />
            </RequireAuth>
          }
        >
          <Route index element={<CitasPage />} />
          <Route path="admin/usuarios" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
          <Route path="admin/medicos" element={<RequireAdmin><MedicosPage /></RequireAdmin>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

