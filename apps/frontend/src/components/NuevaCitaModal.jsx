import { useMemo, useState } from "react";

export default function NewAppointmentModal({ open, onClose, onCreate, medicos = [] }) {
  if (!open) return null;

  const [medicoId, setMedicoId] = useState("");
  const [medicoNombre, setMedicoNombre] = useState("");
  const [especialidad, setEspecialidad] = useState("");

  // índice por id -> médico
  const byId = useMemo(() => {
    const entries = (medicos || []).map((m) => [String(m.id ?? ""), m]);
    return Object.fromEntries(entries);
  }, [medicos]);

  function onChangeMedico(e) {
    const id = e.target.value;
    setMedicoId(id);
    const m = byId[id];
    if (m) {
      setMedicoNombre(m.nombre || "");
      setEspecialidad(m.especialidad || "");
    } else {
      setMedicoNombre("");
      setEspecialidad("");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <form onSubmit={onCreate} className="bg-white rounded-xl shadow p-4 w-full max-w-lg space-y-3">
        <div className="text-lg font-semibold">Nueva cita</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input name="nombrePaciente" className="border rounded px-3 py-2"
            placeholder="Nombre del paciente" required minLength={2} />
          <input name="rut" className="border rounded px-3 py-2" placeholder="RUT (opcional)" />
          <input name="fechaCita" type="datetime-local" className="border rounded px-3 py-2" placeholder="Fecha" required />

          {/* Médico (envía el id). Además mandamos nombre oculto para compatibilidad. */}
          <select
            name="medicoId"
            className="border rounded px-3 py-2"
            value={medicoId}
            onChange={onChangeMedico}
            required
          >
            <option value="">Seleccione un médico</option>
            {(medicos || []).map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.nombre}
              </option>
            ))}
          </select>
          <input type="hidden" name="nombreMedico" value={medicoNombre} />

          {/* Especialidad autocompletada (solo lectura) */}
          <input
            name="especialidadMedico"
            readOnly
            value={especialidad}
            className="border rounded px-3 py-2"
            placeholder="Especialidad"
          />

          <input name="telefono" className="border rounded px-3 py-2" placeholder="Teléfono" />

          <select name="estadoCita" className="border rounded px-3 py-2 md:col-span-2" defaultValue="pendiente">
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded border">
            Cancelar
          </button>
          <button className="px-3 py-2 rounded bg-blue-600 text-white">Guardar</button>
        </div>
      </form>
    </div>
  );
}
