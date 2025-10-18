import { Outlet, Link, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import "../styles/theme.css";

export default function Layout(){
  const { pathname } = useLocation();
  const title = pathname === "/" ? "Próximas citas" :
                pathname.startsWith("/citas") ? "Panel de citas" :
                pathname.startsWith("/doctores") ? "Doctores" :
                "Configuración";
  return (
    <div className="flex">
      <Sidebar/>
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="flex gap-3">
            <Link to="/citas"><Button>+ Nueva Cita</Button></Link>
          </div>
        </div>
        <Outlet/>
      </main>
    </div>
  );
}
