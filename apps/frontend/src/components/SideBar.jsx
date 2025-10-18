import { Home, Calendar, Users2, Settings, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to:"/", icon:Home, label:"Inicio" },
  { to:"/citas", icon:Calendar, label:"Citas" },
  { to:"/doctores", icon:Users2, label:"Doctores" },
  { to:"/config", icon:Settings, label:"Configuración" },
];

export default function Sidebar(){
  return (
    <aside className="h-screen w-[220px] bg-white border-r border-slate-200 p-4 sticky top-0">
      <h1 className="text-lg font-semibold mb-6">Confirmación de citas</h1>
      <nav className="space-y-1">
        {items.map(({to,icon:Icon,label})=> (
          <NavLink key={to} to={to}
            className={({isActive})=>`flex items-center gap-3 rounded-xl px-3 py-2 ${isActive? 'bg-[var(--brand)] text-white':'text-slate-700 hover:bg-slate-100'}`}>
            <Icon size={18}/><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <button className="mt-8 flex items-center gap-3 text-slate-600 hover:text-slate-900">
        <LogOut size={18}/> Cerrar sesión
      </button>
    </aside>
  );
}
