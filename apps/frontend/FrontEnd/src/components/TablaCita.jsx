import AppointmentRow from "./FilaCita";



export default function AppointmentsTable({
  rows,
  allSelected,
  onToggleAll,
  isSelected,
  onToggleRow,
  showRut
}) {
  return (
    <div className="overflow-x-auto rounded-lg shadow bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3">
              <input type="checkbox" checked={allSelected} onChange={onToggleAll} />
            </th>
            <th className="p-3">Paciente</th>
            {showRut && <th className="p-3">RUT</th>}
            <th className="p-3">Fecha</th>
            <th className="p-3">Médico</th>
            <th className="p-3">Especialidad</th>
            <th className="p-3">Teléfono</th>
            <th className="p-3">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <AppointmentRow
              key={c.id}
              c={c}
              checked={isSelected(c.id)}
              onToggle={onToggleRow}
              showRut={showRut}
            />
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="p-4 text-gray-500" colSpan={showRut ? 8 : 7}>Sin resultados</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
