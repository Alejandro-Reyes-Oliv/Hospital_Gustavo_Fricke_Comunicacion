export default function FiltersBar({
  q, onQChange,
  fEstado, onEstadoChange,
  fEsp, onEspChange, especialidades,
  selectedCount,
  onNewClick, onSendBot, onQuickStatus,
  showRut, onToggleRut
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <input
        className="w-full md:w-80 rounded-lg border px-3 py-2"
        placeholder="Buscar por paciente, RUT o teléfono…"
        value={q}
        onChange={(e) => onQChange(e.target.value)}
      />

      <select
        className="rounded-lg border px-3 py-2"
        value={fEstado}
        onChange={(e) => onEstadoChange(e.target.value)}
      >
        <option value="todos">Todos los estados</option>
        <option value="pend">Pendientes</option>
        <option value="confirm">Confirmadas</option>
        <option value="cancel">Canceladas</option>
      </select>

      <select
        className="rounded-lg border px-3 py-2"
        value={fEsp}
        onChange={(e) => onEspChange(e.target.value)}
      >
        <option value="todas">Todas las especialidades</option>
        {especialidades.map((e) => (
          <option key={e} value={e}>{e}</option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm ml-0 md:ml-2">
        <input type="checkbox" checked={showRut} onChange={onToggleRut} />
        Mostrar RUT
      </label>

      <div className="flex-1" />
      <button onClick={onNewClick} className="rounded bg-blue-600 text-white px-3 py-2 hover:bg-blue-700">
        + Nuevo
      </button>
      <button
        onClick={onSendBot}
        disabled={!selectedCount}
        className="rounded bg-indigo-600 text-white px-3 py-2 disabled:opacity-50 hover:bg-indigo-700"
      >
        Enviar bot ({selectedCount || 0})
      </button>
      <button
        onClick={() => onQuickStatus("confirmada")}
        disabled={!selectedCount}
        className="rounded bg-green-600 text-white px-3 py-2 disabled:opacity-50 hover:bg-green-700"
      >
        Marcar confirmada
      </button>
      <button
        onClick={() => onQuickStatus("cancelada")}
        disabled={!selectedCount}
        className="rounded bg-red-600 text-white px-3 py-2 disabled:opacity-50 hover:bg-red-700"
      >
        Marcar cancelada
      </button>
    </div>
  );
}
