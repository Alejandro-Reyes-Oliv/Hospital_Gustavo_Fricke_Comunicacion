// src/features/medicos/components/MedicosTable.jsx
export default function MedicosTable({ rows = [], onSetActive }) {
  return (
    <div className="overflow-x-auto border rounded-2xl shadow bg-white p-4">
      <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">Especialidad</th>
            <th className="p-2 text-left">Estado</th>
            <th className="p-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isActive = (r?.is_active ?? r?.activo) !== false;
            return (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{r.nombre}</td>
                <td className="py-2 pr-4">{r.especialidad}</td>
                <td className="py-2 pr-4">
                    <span
                        className={`px-2 py-1 rounded-full text-xs border ${
                        isActive
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                    >
                        {isActive ? "activo" : "inactivo"}
                    </span>
                    </td>
                <td className="p-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onSetActive?.(r.id, true)}
                    disabled={isActive}
                    className="px-3 py-1 rounded-full text-white bg-emerald-600 disabled:opacity-40"
                    title="Habilitar"
                  >
                    Habilitar
                  </button>

                  <button
                    type="button"
                    onClick={() => onSetActive?.(r.id, false)}
                    disabled={!isActive}
                    className="px-3 py-1 rounded-full text-white bg-amber-600 disabled:opacity-40"
                    title="Deshabilitar"
                  >
                    Deshabilitar
                  </button>
                </td>
              </tr>
            );
          })}

          {rows.length === 0 && (
            <tr>
              <td className="p-4 text-sm text-slate-500" colSpan={4}>
                No hay médicos que coincidan con la búsqueda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
