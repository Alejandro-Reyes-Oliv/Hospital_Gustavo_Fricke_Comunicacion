// src/pages/MedicosPage.jsx
import { useMemo, useState } from "react";
import {
  useMedicosList,
  useCreateDoctor,
  useDeleteDoctor,
} from "../hooks/useMedicosQuery";
import NewDoctorModal from "../components/NewDoctorModal";

export default function MedicosPage() {
  // UI state
  const [q, setQ] = useState("");
  const [openCreate, setOpenCreate] = useState(false);

  // Data hooks (React Query)
  const { data, isLoading, error } = useMedicosList();
  const createMut = useCreateDoctor();
  const delMut = useDeleteDoctor();

  // Normaliza distintas formas de respuesta del backend
  const rows = useMemo(() => {
    const raw = data?.data ?? data ?? [];
    const list = Array.isArray(raw) ? raw : raw.items ?? [];
    if (!q) return list;

    const needle = q.toLowerCase();
    const has = (v) => (v ?? "").toString().toLowerCase().includes(needle);

    return list.filter(
      (r) =>
        has(r.nombre) ||
        has(r.especialidad) ||
        has(r.email) ||
        has(r.telefono)
    );
  }, [data, q]);

  // Crear médico (actualiza cache altiro desde el hook)
  const onSaveDoctor = (payload) => {
    createMut.mutate(payload, {
      onSuccess: () => setOpenCreate(false),
    });
  };

  // Eliminar médico (optimista desde el hook)
  const onDeleteDoctor = (id) => {
    delMut.mutate(id);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Médicos</h2>

      {/* Barra superior: búsqueda + botón Agregar */}
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <input
          className="h-10 w-full md:w-[520px] rounded-full border border-slate-300 px-4 text-sm bg-white"
          placeholder="Buscar por nombre, especialidad, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="ml-auto">
          <button
            onClick={() => setOpenCreate(true)}
            className="h-10 rounded-full bg-[#0C4581] px-5 text-sm font-medium text-white"
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* Tabla */}
      {error ? (
        <div className="text-red-600">Error cargando datos</div>
      ) : isLoading ? (
        <div className="text-slate-600">Cargando…</div>
      ) : (
        <div className="overflow-x-auto border rounded-2xl shadow bg-white p-4">
          <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">Especialidad</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Teléfono</th>
                <th className="p-2 text-left">Estado</th>
                <th className="p-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
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
                      {r.estado ?? "activo"}
                    </span>
                  </td>
                  <td className="p-2">
                  <button
                    onClick={() => delMut.mutate(r)}   // <-- antes: mutate(r.id)
                    disabled={delMut.isPending}
                    className="px-3 py-1 rounded-full text-white bg-[#FD0327] hover:opacity-90 disabled:opacity-50"
                  >
                    Eliminar
                  </button>

                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td className="p-4 text-sm text-slate-500" colSpan={6}>
                    No hay médicos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de creación */}
      <NewDoctorModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSave={onSaveDoctor}
      />
    </div>
  );
}
