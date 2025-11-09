// src/app/NotFound.jsx
import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-2">
      <h2 className="text-2xl font-bold">404 · Página no encontrada</h2>
      <p className="text-slate-600">La ruta solicitada no existe.</p>
      <Link className="mt-2 px-3 py-1 rounded-full bg-slate-900 text-white" to="/citas">
        Volver a Citas
      </Link>
    </div>
  );
}
