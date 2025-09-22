import { useMemo, useState } from "react";
import { useMedicosList, useCreateDoctor, useDeleteDoctor } from "../hooks/useMedicosQuery";

export default function MedicosPage() {
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ nombre: "", especialidad: "", email: "", telefono: "" });

  // Hooks de datos
  const { data, isLoading: loading, error } = useMedicosList();
  const createMut = useCreateDoctor();
  const delMut = useDeleteDoctor();

  // Normaliza la respuesta: {data:[]}, [] o {items:[]}
  const rows = useMemo(() => {
    const raw = data?.data ?? data ?? [];
    //const arr = Array.isArray(raw) ? raw : Array.isArray(raw.items) ? raw.items : [];
    const arr = Array.isArray(raw)
      ? raw
      : Array.isArray(raw.items) ? raw.items
      : Array.isArray(raw.data)  ? raw.data
      : Array.isArray(raw.rows)  ? raw.rows
      : [];

    // Normaliza campos para que tu tabla no cambie:
    // - mock usa: { nombre, especialidad, email, telefono, estado }
    // - backend usa: { nombre, especialidad, telefono, activo:boolean }
    return arr.map((r) => ({
      id: String(r.id ?? r.ID ?? Math.random()),
      nombre: r.nombre ?? r.name ?? "",
      especialidad: r.especialidad ?? r.specialty ?? "",
      email: r.email ?? "",
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

  const onSubmitAdd = async (e) => {
    e.preventDefault();
    await createMut.mutateAsync(form);
    setForm({ nombre: "", especialidad: "", email: "", telefono: "" });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Médicos</h1>

      <div className="flex flex-col gap-2 mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, especialidad, email…"
          className="border rounded px-3 py-2 w-full max-w-xl"
        />

        <form onSubmit={onSubmitAdd} className="flex gap-2">
          <input
            className="border p-2 rounded"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            required
          />
          <input
            className="border p-2 rounded"
            placeholder="Especialidad"
            value={form.especialidad}
            onChange={(e) => setForm((f) => ({ ...f, especialidad: e.target.value }))}
          />
          <input
            className="border p-2 rounded"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <input
            className="border p-2 rounded"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
          />
          <button className="px-3 py-2 bg-blue-600 text-white rounded">Añadir</button>
        </form>
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
                <th className="py-2 pr-4">Acciones</th>
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
                  <td className="p-2">
                    <button
                      onClick={() => delMut.mutate(r.id)}
                      className="px-2 py-1 border rounded hover:bg-red-50"
                    >
                      Eliminar
                    </button>
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
