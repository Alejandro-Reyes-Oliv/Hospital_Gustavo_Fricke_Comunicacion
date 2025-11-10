// src/features/citas/components/FilaCita.jsx
import StatusPill from "../../../shared/components/StatusPill.jsx";
import { formatFechaHora } from "../../../shared/lib/date.js";

export default function AppointmentRow({ c, checked, onToggle, showRut = false }) {
  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="p-3">
        <input type="checkbox" checked={checked} onChange={() => onToggle(c.id)} />
      </td>
      <td className="p-3">{c.nombrePaciente}</td>
      {showRut && <td className="p-3">{c.rut || "—"}</td>}
      {/* Fecha formateada en hora de Chile: dd-MM-yyyy HH:mm */}
      <td className="p-3">{formatFechaHora(c.fechaCita || c.fecha || c.fecha_hora)}</td>
      <td className="p-3">{c.nombreMedico}</td>
      <td className="p-3">{c.especialidadMedico}</td>
      <td className="p-3">{c.telefono ?? "—"}</td>
      <td className="p-3">
        <StatusPill estado={c.estadoCita} />
      </td>
    </tr>
  );
}
