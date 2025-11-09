// src/features/citas/components/NuevaCitaModal.jsx
import { useMemo, useState, useRef, useEffect } from "react";

export default function NewAppointmentModal({ open, onClose, onCreate, medicos = [] }) {
  // ⬇️ Hooks SIEMPRE al tope (nunca antes un return)
  const overlayRef = useRef(null);
  const formRef = useRef(null);

  // Cerrar con ESC solo cuando esté abierto
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Solo activos, normalizando nombre/especialidad y ordenando por nombre
  const medicosActivos = useMemo(() => {
    const list = (medicos || [])
      .filter((m) => m?.is_active !== false)
      .map((m) => ({
        ...m,
        _name: (m.name ?? m.nombre ?? "").trim(),
        _esp: (m.especialidad ?? m.specialty ?? m.especialidadMedico ?? "").trim(),
      }));
    list.sort((a, b) => a._name.localeCompare(b._name, "es"));
    return list;
  }, [medicos]);

  const [medicoId, setMedicoId] = useState("");
  const [medicoNombre, setMedicoNombre] = useState("");
  const [especialidad, setEspecialidad] = useState("");

  const byId = useMemo(() => {
    return Object.fromEntries(medicosActivos.map((m) => [String(m.id ?? ""), m]));
  }, [medicosActivos]);

  function onChangeMedico(e) {
    const id = e.target.value;
    setMedicoId(id);
    const m = byId[id];
    setMedicoNombre(m?._name || "");
    setEspecialidad(m?._esp || "");
  }

  const handleSubmit = (e) => {
    onCreate?.(e, { form: formRef.current });
  };

  // ⬇️ Ahora sí, render condicional
  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/30 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dlg-title"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
    >
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow p-4 w-full max-w-lg space-y-3"
      >
        <div id="dlg-title" className="text-lg font-semibold">Nueva cita</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="paciente" className="text-sm text-slate-600">Paciente</label>
            <input
              id="paciente"
              name="nombrePaciente"
              className="border rounded px-3 py-2"
              placeholder="Nombre del paciente"
              required
              minLength={2}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="fechaCita" className="text-sm text-slate-600">Fecha y hora</label>
            <input
              id="fechaCita"
              name="fechaCita"
              type="datetime-local"
              className="border rounded px-3 py-2"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="medicoId" className="text-sm text-slate-600">Médico</label>
            <select
              id="medicoId"
              name="medicoId"
              className="border rounded px-3 py-2"
              value={medicoId}
              onChange={onChangeMedico}
              required
            >
              <option value="">Seleccione un médico</option>
              {medicosActivos.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m._name}
                </option>
              ))}
            </select>
            <input type="hidden" name="medicoNombre" value={medicoNombre} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="especialidad" className="text-sm text-slate-600">Especialidad</label>
            <input
              id="especialidad"
              name="especialidad"
              readOnly
              value={especialidad}
              className="border rounded px-3 py-2"
              placeholder="Especialidad"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label htmlFor="telefono" className="text-sm text-slate-600">Teléfono (9 dígitos, sin +56)</label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              inputMode="numeric"
              maxLength={9}
              pattern="[0-9]{9}"
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 9);
              }}
              className="border rounded px-3 py-2 w-full"
              placeholder="912345678"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label htmlFor="estadoCita" className="text-sm text-slate-600">Estado</label>
            <select id="estadoCita" name="estadoCita" className="border rounded px-3 py-2" defaultValue="pendiente">
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded border">
            Cancelar
          </button>
          <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white">
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
