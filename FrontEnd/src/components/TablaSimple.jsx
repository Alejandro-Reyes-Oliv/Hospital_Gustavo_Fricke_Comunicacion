import { useEffect, useMemo, useState } from "react";

const ENDPOINT = "/citas.json"; // archivo en /public

// Estilos para el "pill" de estado
const pill = (estado) => {
  const s = String(estado || "").toLowerCase();
  const base = "px-2 py-0.5 rounded-full text-xs font-medium";
  if (s.includes("confirm")) return `${base} bg-green-100 text-green-700`;
  if (s.includes("cancel")) return `${base} bg-red-100 text-red-700`;
  return `${base} bg-gray-100 text-gray-700`; // pendiente u otros
};

export default function TablaSimple() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cargar datos del JSON
  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const r = await fetch(ENDPOINT);
        const data = await r.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar la lista");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // Filtro por texto y estado
  const filtradas = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return rows.filter((c) => {
      const okTexto =
        texto === "" ? true : c.paciente.toLowerCase().includes(texto);
      const okEstado =
        fEstado === "todos" ? true : c.estado.toLowerCase().includes(fEstado);
      return okTexto && okEstado;
    });
  }, [rows, q, fEstado]);

  if (loading) return <div className="p-4">Cargando…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <input
          className="w-full sm:w-72 rounded-lg border px-3 py-2"
          placeholder="Buscar paciente…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded-lg border px-3 py-2"
          value={fEstado}
          onChange={(e) => setFEstado(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="pend">Pendientes</option>
          <option value="confirm">Confirmadas</option>
          <option value="cancel">Canceladas</option>
        </select>
        <div className="text-sm text-gray-600">{filtradas.length} resultados</div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3">Paciente</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Hora</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{c.paciente}</td>
                <td className="p-3">{c.fecha}</td>
                <td className="p-3">{c.hora}</td>
                <td className="p-3">
                  <span className={pill(c.estado)}>{c.estado}</span>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="4">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
