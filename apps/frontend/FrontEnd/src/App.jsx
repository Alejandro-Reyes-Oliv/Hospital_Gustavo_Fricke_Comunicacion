import { useEffect, useState } from "react";
import "./App.css";
import AppointmentsPage from "./pages/CitasPage";
import UsersPage from "./pages/UsersPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import { getCurrentUser, login, logout, isAdmin } from "./services/auth.js";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState("citas");

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    setLoading(false);
  }, []);

  const handleLogin = async ({ username, password }) => {
    setLoggingIn(true);
    try {
      const u = await login(username, password);
      setUser(u);
      setTab("citas");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  if (loading) {
    return <div className="p-6">Cargando…</div>;
  }

  if (!user) {
    return (
      <LoginPage
        loading={loggingIn}
        onSubmit={handleLogin}
        onError={(m) => console.error(m)}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="font-semibold">Panel del Sistema</div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {user.name} ({user.role || user.username})
          </span>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1 rounded border hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="border-b px-4">
        {isAdmin(user) && (
          <div className="flex gap-2">
            <button
              className={"px-3 py-2 " + (tab === "citas" ? "border-b-2 border-black" : "")}
              onClick={() => setTab("citas")}
            >
              Citas
            </button>
            <button
              className={"px-3 py-2 " + (tab === "usuarios" ? "border-b-2 border-black" : "")}
              onClick={() => setTab("usuarios")}
            >
              Usuarios
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        {tab === "usuarios" && isAdmin(user) ? <UsersPage /> : <AppointmentsPage />}
      </div>
    </div>
  );
}
