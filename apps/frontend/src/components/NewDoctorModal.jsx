import { useEffect, useState } from "react";

export default function NewDoctorModal({ open, onClose, onSave, initial = null }) {
  const [form, setForm] = useState({
    nombre: "",
    especialidad: "",
    email: "",
    telefono: "",
  });

  useEffect(() => {
    if (open) {
      setForm(initial ?? { nombre: "", especialidad: "", email: "", telefono: "" });
    }
  }, [open, initial]);

  if (!open) return null;

  const canSave = form.nombre.trim() && form.especialidad.trim();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl border bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-center text-2xl font-bold">Nuevo doctor</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Nombre del doctor</label>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 px-3"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Dr./Dra. ..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">Especialidad</label>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 px-3"
              value={form.especialidad}
              onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
              placeholder="Cardiología, Oftalmología…"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">Email</label>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 px-3"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="doctor@ejemplo.cl"
              type="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">Teléfono</label>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 px-3"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="+569XXXXXXX"
              type="tel"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => canSave && onSave?.(form)}
            disabled={!canSave}
            className="h-10 rounded-full bg-[#0C4581] px-5 text-sm font-medium text-white disabled:opacity-50"
          >
            Guardar
          </button>
          <button
            onClick={onClose}
            className="h-10 rounded-full bg-[#FD0327] px-5 text-sm font-medium text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
