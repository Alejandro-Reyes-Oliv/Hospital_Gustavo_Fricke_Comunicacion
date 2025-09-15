import { useMemo, useState } from "react";
import { useMedicosList } from "../hooks/useMedicosQuery";

export default function MedicosPage() {
  const [q, setQ] = useState("");

  // ↓ Hook que obtiene médicos (mock o backend, según tu service)
  const { data, isLoading: loading, error } = useMedicosList();

  // ↓ Normaliza la respuesta: {data:[]}, [] o {items:[]}
  const rows = useMemo(() => {
    const raw = data?.data ?? data ?? [];
    const arr = Array.isArray(raw) ? raw : Array.isArray(raw.items) ? raw.items : [];

    // Normaliza campos para que tu tabla no cambie:
    // - mock usa: { nombre, especialidad, email, telefono, estado }
    // - backend usa: { nombre, especialidad, telefono, activo:boolean }
    return arr.map((r) => ({
      id: String(r.id ?? r.ID ?? Math.random()),
      nombre: r.nombre ?? r.name ?? "",
      especialidad: r.especialidad ?? r.specialty ?? "",
      email: r.email ?? "", // mock lo trae, backend puede no
      telefono: r.telefono ?? r.phone ?? "",
      estado:
        r.estado ??
        (typeof r.activo === "boolean" ? (r.activo ? "activo" : "inactivo") : "activo"),
    }));
  }, [data]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((m) =>
      [m.nombre, m.especialidad, m.email, m.telefono, m.estado]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t))
    );
  }, [q, rows]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Médicos</h1>

      <div className="flex gap-2 items-center mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, especialidad, email…"
          className="border rounded px-3 py-2 w-full max-w-xl"
        />
        {/* Aquí irían botones Nuevo/Editar/Eliminar cuando conectes el backend */}
      </div>

      {loading && <div>Cargando…</div>}
      {error && <div className="text-red-600">{String(error.message || error)}</div>}
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
              {filtered.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-4">{r.nombre}</td>
                  <td className="py-2 pr-4">{r.especialidad}</td>
                  <td className="py-2 pr-4">{r.email}</td>
                  <td className="py-2 pr-4">{r.telefono}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        r.estado === "activo" ? "bg-green-100" : "bg-gray-200"
                      }`}
                    >
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
