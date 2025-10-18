import { useEffect, useState } from "react";
import "./App.css";
import AppointmentsPage from "./pages/AppointmentsPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import MedicosPage from "./pages/MedicosPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import { getCurrentUser, login, logout, isAdmin } from "./services/auth.js";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState("citas");
  const admin = isAdmin(user);

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
    <div className={`min-h-screen grid ${admin ? "[grid-template-columns:220px_1fr]" : "[grid-template-columns:1fr]"} [grid-template-rows:64px_1fr] bg-[#F0F1FF]` }>
      <div className="col-span-2 flex items-center justify-between h-16 border-b px-4 bg-white">
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

      <div className="row-start-2 col-start-1 bg-white border-r p-3 hidden md:block">
        {isAdmin(user) && (
          <div className="flex flex-col gap-1">
            <button onClick={() => setTab("citas")}   className={(tab==="citas"   ? "bg-[#0C4581] text-white shadow-sm font-semibold " : " ") + "text-left py-3 px-4 rounded-xl"}>Citas</button>
            <button onClick={() => setTab("usuarios")} className={(tab==="usuarios" ? "bg-[#0C4581] text-white shadow-sm font-semibold " : " ") + "text-left py-3 px-4 rounded-xl"}>Usuarios</button>
            <button onClick={() => setTab("medicos")} className={(tab==="medicos" ? "bg-[#0C4581] text-white shadow-sm font-semibold " : " ") + "text-left py-3 px-4 rounded-xl"}>Médicos</button>
          </div>
        )}
      </div>

      <div className={`p-6 ${admin ? "row-start-2 col-start-2" : "row-start-2 col-start-1"} max-w-[1200px] mx-auto` }>
        {tab === "citas" && <AppointmentsPage />}
        {tab === "usuarios" && (
          isAdmin(user) ? <UsersPage /> : null
        )}
        {tab === "medicos" && <MedicosPage />}
      </div>
    </div>
  );
}
