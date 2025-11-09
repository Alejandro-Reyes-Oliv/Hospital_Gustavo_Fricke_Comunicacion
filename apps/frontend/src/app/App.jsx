// src/app/App.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, logout, isAdmin as _isAdmin } from "../features/auth/services/auth.js";

export default function AppLayout() {
  const qc = useQueryClient();
  const nav = useNavigate();

  const user = getCurrentUser();
  const isAdmin = _isAdmin(user);

  const onLogout = () => {
    try { logout(); } catch {}
    try { qc.clear(); } catch {}
    nav("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-white border-b">
        {/* Contenedor principal */}
        <div className="mx-auto max-w-6xl px-3 sm:px-4 h-16 flex items-center relative">
          {/* Izquierda: logo */}
          <button
            onClick={() => nav("/citas")}
            aria-label="Ir a Citas"
            title="Ir a Citas"
            className="shrink-0"
          >
            <img
              src="/icon2.png"
              alt="App"
              className="h-9 w-9"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/icon2.PNG"; }}
            />
          </button>

          {/* Centro: navegación absoluta y centrada (solo md+) */}
          <nav className="hidden md:flex items-center gap-2 text-sm absolute left-1/2 -translate-x-1/2">
            <NavItem to="/citas">Citas</NavItem>
            {isAdmin && <NavItem to="/medicos">Médicos</NavItem>}
            {isAdmin && <NavItem to="/usuarios">Usuarios</NavItem>}
          </nav>

          {/* Derecha: usuario + salir */}
          <div className="ml-auto flex items-center gap-2 min-w-0">
            {/* Muestra el nombre solo en pantallas grandes para evitar saltos */}
            <span className="hidden lg:block text-slate-600 text-sm truncate max-w-[220px]">
              {user ? (user.name || user.username || "Usuario") : "Invitado"}
              {user?.role ? ` · ${user.role}` : ""}
            </span>

            {user ? (
              <button
                onClick={onLogout}
                className="rounded-full px-3 py-1 bg-slate-900 text-white text-sm shrink-0"
              >
                Salir
              </button>
            ) : (
              <NavLink
                to="/login"
                className="rounded-full px-3 py-1 bg-[#0C4581] text-white text-sm shrink-0"
              >
                Ingresar
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-1.5 rounded-full transition-colors ${
          isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
