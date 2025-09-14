import StatusPill from "./StatusPill";

export default function AppointmentRow({ c, checked, onToggle, showRut }) {
  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="p-3">
        <input type="checkbox" checked={checked} onChange={() => onToggle(c.id)} />
      </td>
      <td className="p-3">{c.nombrePaciente}</td>
      {showRut && <td className="p-3">{c.rut || "—"}</td>}
      <td className="p-3">{c.fechaCita}</td>
      <td className="p-3">{c.nombreMedico}</td>
      <td className="p-3">{c.especialidadMedico}</td>
      <td className="p-3">{c.telefono}</td>
      <td className="p-3"><StatusPill estado={c.estadoCita} /></td>
    </tr>
  );
}
