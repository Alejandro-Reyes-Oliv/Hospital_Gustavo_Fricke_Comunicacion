export default function NewAppointmentModal({ open, onClose, onCreate }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <form
        onSubmit={onCreate}
        className="bg-white rounded-xl shadow p-4 w-full max-w-lg space-y-3"
      >
        <div className="text-lg font-semibold">Nueva cita</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input name="nombrePaciente" required className="border rounded px-3 py-2" placeholder="Paciente" />
          <input name="rut" className="border rounded px-3 py-2" placeholder="RUT (opcional)" />
          <input name="fechaCita" type="datetime-local" required className="border rounded px-3 py-2" />
          <input name="telefono" className="border rounded px-3 py-2" placeholder="Teléfono" />
          <input name="nombreMedico" className="border rounded px-3 py-2" placeholder="Médico" />
          <input name="especialidadMedico" className="border rounded px-3 py-2" placeholder="Especialidad" />
          <select name="estadoCita" className="border rounded px-3 py-2 md:col-span-2" defaultValue="pendiente">
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancelar</button>
          <button className="px-3 py-2 rounded bg-blue-600 text-white">Guardar</button>
        </div>
      </form>
    </div>
  );
}
