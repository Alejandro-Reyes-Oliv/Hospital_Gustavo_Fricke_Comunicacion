import { useEffect, useMemo, useState } from "react";

export default function MedicosPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        // Back real: fetch desde /api/doctors
        // const r = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/doctors`);
        // const data = await r.json();
        // setRows(data.items ?? data);
        // Mock:
        const r = await fetch("/mock/medicos.json");
        const data = await r.json();
        setRows(data);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(m =>
      [m.nombre, m.especialidad, m.email, m.telefono, m.estado]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(t))
    );
  }, [q, rows]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Médicos</h1>

      <div className="flex gap-2 items-center mb-3">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nombre, especialidad, email…"
          className="border rounded px-3 py-2 w-full max-w-xl"
        />
        {/* Aquí irían botones Nuevo/Editar/Eliminar cuando conectes el backend */}
      </div>

      {loading && <div>Cargando…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && filtered.length === 0 && <div>No hay resultados</div>}

      {!loading && filtered.length > 0 && (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Especialidad</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Teléfono</th>
                <th className="py-2 pr-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-4">{r.nombre}</td>
                  <td className="py-2 pr-4">{r.especialidad}</td>
                  <td className="py-2 pr-4">{r.email}</td>
                  <td className="py-2 pr-4">{r.telefono}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-1 rounded text-xs ${r.estado === "activo" ? "bg-green-100" : "bg-gray-200"}`}>
                      {r.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
