import AppointmentRow from "./FilaCita.jsx";

export default function AppointmentsTable({
  rows,
  allSelected,
  onToggleAll,
  isSelected,
  onToggleRow,
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border shadow bg-white">
      <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
        <caption className="sr-only">Listado de citas</caption>
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3" scope="col">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label="Seleccionar todas las filas"
              />
            </th>
            <th className="p-3" scope="col">Paciente</th>
            <th className="p-3" scope="col">Fecha</th>
            <th className="p-3" scope="col">Médico</th>
            <th className="p-3" scope="col">Especialidad</th>
            <th className="p-3" scope="col">Teléfono</th>
            <th className="p-3" scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <AppointmentRow
              key={c.id}
              c={c}
              checked={isSelected(c.id)}
              onToggle={onToggleRow}
              showRut={false}  // asegura que la fila no renderice la celda RUT
            />
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="p-4 text-gray-500" colSpan={7}>
                Sin resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
