import { useEffect, useState } from 'react';

export default function FiltersBar({
  q, onQChange,
  fEstado, onEstadoChange,
  fEsp, onEspChange, especialidades = [],
  selectedCount = 0,
  onNewClick, onSendBot,
  showRut, onToggleRut
}) {
  const [qLocal, setQLocal] = useState(q ?? "");

  // sin perder foco al tipear: disparo cambios hacia el padre con debounce
  useEffect(() => {
    const t = setTimeout(() => onQChange?.(qLocal), 180);
    return () => clearTimeout(t);
  }, [qLocal]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Buscar */}
      <input
        className="h-10 w-full md:w-[420px] rounded-full border border-slate-200 shadow-sm px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4581]/30"
        placeholder="Buscar por paciente, RUT o teléfono…"
        autoFocus
        value={qLocal}
        onChange={(e) => setQLocal(e.target.value)}
      />

      {/* Estado */}
      <select
        className="h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4581]/30"
        value={fEstado ?? "todos"}
        onChange={(e) => onEstadoChange?.(e.target.value)}
      >
        <option value="todos">Todos los estados</option>
        <option value="confirmada">Confirmada</option>
        <option value="pendiente">Pendiente</option>
        <option value="cancelada">Cancelada</option>
      </select>

      {/* Especialidades */}
      <select
        className="h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4581]/30"
        value={fEsp ?? "todas"}
        onChange={(e) => onEspChange?.(e.target.value)}
      >
        <option value="todas">Todas las especialidades</option>
        {Array.isArray(especialidades) && especialidades.map((esp) => (
          <option key={String(esp)} value={String(esp)}>{String(esp)}</option>
        ))}
      </select>


      {/* Acciones (derecha) */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onNewClick}
          className="h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-sm text-white bg-[#0C4581] hover:opacity-90 font-medium"
        >
          + Nuevo
        </button>

        <button
          onClick={onSendBot}
          disabled={!selectedCount}
          className="h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-sm text-white bg-[#25D366] disabled:opacity-50 font-medium"
          title={selectedCount ? "Enviar bot a seleccionados" : "Selecciona al menos 1"}
        >
          Enviar bot ({selectedCount || 0})
        </button>
      </div>
    </div>
  );
}
