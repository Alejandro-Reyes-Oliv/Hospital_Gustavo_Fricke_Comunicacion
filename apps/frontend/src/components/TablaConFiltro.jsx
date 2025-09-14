import { useEffect, useMemo, useState } from "react";
import { listCitas, addAppointment, updateStatus, sendBot } from "../services/citas";

const pill = (estado) => {
  const s = String(estado || "").toLowerCase();
  const base = "px-2 py-0.5 rounded-full text-xs font-medium";
  if (s.includes("confirm")) return `${base} bg-green-100 text-green-700`;
  if (s.includes("cancel"))  return `${base} bg-red-100 text-red-700`;
  return `${base} bg-gray-100 text-gray-700`;
};

export default function TablaConFiltro() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(() => new Set()); // ids seleccionados
  const [showNew, setShowNew] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await listCitas();
      setRows(data);
      setLoading(false);
    })();
  }, []);

  const filtradas = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return rows.filter((c) => {
      // filtrar filas , si no contiene texto o en estado muestra todo deja pasar, sino filtra
      const okTexto  = texto === "" ? true : (c.paciente||"").toLowerCase().includes(texto);
      const okEstado = fEstado === "todos" ? true : (c.estado||"").toLowerCase().includes(fEstado);
      return okTexto && okEstado;
    });
  }, [rows, q, fEstado]);

  const allFilteredSelected = filtradas.length > 0 && filtradas.every(r => sel.has(r.id));
  const toggleSelectAll = () => {
    const newSet = new Set(sel);
    if (allFilteredSelected) {
      filtradas.forEach(r => newSet.delete(r.id));
    } else {
      filtradas.forEach(r => newSet.add(r.id));
    }
    setSel(newSet);
  };

  const toggleRow = (id) => {
    const s = new Set(sel);
    s.has(id) ? s.delete(id) : s.add(id);
    setSel(s);
  };

  const onSendBot = async () => {
    const ids = Array.from(sel);
    if (!ids.length) return;
    setMsg("Enviando bot…");
    await sendBot(ids);
    setMsg(`Bot enviado a ${ids.length} paciente(s)`);
  };

  const onQuickStatus = async (status) => {
    const ids = Array.from(sel);
    if (!ids.length) return;
    await updateStatus(ids, status);
    const refreshed = await listCitas();
    setRows(refreshed);
    setMsg(`Estado actualizado a "${status}" para ${ids.length} selección(es)`);
    setSel(new Set());
  };

  const onCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const paciente = fd.get("paciente");
    const fecha    = fd.get("fecha");
    const hora     = fd.get("hora");
    const estado   = fd.get("estado") || "pendiente";
    await addAppointment({ paciente, fecha, hora, estado });
    const refreshed = await listCitas();
    setRows(refreshed);
    setShowNew(false);
    setMsg("Nueva cita agregada");
    e.currentTarget.reset();
  };

  if (loading) return <div className="p-4">Cargando…</div>;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <input
          className="w-full md:w-80 rounded-lg border px-3 py-2"
          placeholder="Buscar paciente…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded-lg border px-3 py-2"
          value={fEstado}
          onChange={(e) => setFEstado(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="pend">Pendientes</option>
          <option value="confirm">Confirmadas</option>
          <option value="cancel">Canceladas</option>
        </select>

        <div className="flex-1" />
        <button
          onClick={() => setShowNew(true)}
          className="rounded bg-blue-600 text-white px-3 py-2 hover:bg-blue-700"
        >
          + Nuevo
        </button>
        <button
          onClick={onSendBot}
          disabled={!sel.size}
          className="rounded bg-indigo-600 text-white px-3 py-2 disabled:opacity-50 hover:bg-indigo-700"
        >
          Enviar bot ({sel.size || 0})
        </button>
        <button
          onClick={() => onQuickStatus("confirmada")}
          disabled={!sel.size}
          className="rounded bg-green-600 text-white px-3 py-2 disabled:opacity-50 hover:bg-green-700"
        >
          Marcar confirmada
        </button>
        <button
          onClick={() => onQuickStatus("cancelada")}
          disabled={!sel.size}
          className="rounded bg-red-600 text-white px-3 py-2 disabled:opacity-50 hover:bg-red-700"
        >
          Marcar cancelada
        </button>
      </div>

      {msg && <div className="text-sm text-gray-600">{msg}</div>}
      <div className="text-sm text-gray-600">{filtradas.length} resultados</div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3">
                <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} />
              </th>
              <th className="p-3">Paciente</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Hora</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={sel.has(c.id)}
                    onChange={() => toggleRow(c.id)}
                  />
                </td>
                <td className="p-3">{c.paciente}</td>
                <td className="p-3">{c.fecha}</td>
                <td className="p-3">{c.hora}</td>
                <td className="p-3">
                  <span className={pill(c.estado)}>{c.estado}</span>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="5">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo */}
      {showNew && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <form
            onSubmit={onCreate}
            className="bg-white rounded-xl shadow p-4 w-full max-w-md space-y-3"
          >
            <div className="text-lg font-semibold">Nueva cita</div>
            <div className="grid grid-cols-1 gap-3">
              <input name="paciente" required className="border rounded px-3 py-2" placeholder="Paciente" />
              <input name="fecha" type="date" required className="border rounded px-3 py-2" />
              <input name="hora"  type="time" required className="border rounded px-3 py-2" />
              <select name="estado" className="border rounded px-3 py-2" defaultValue="pendiente">
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowNew(false)} className="px-3 py-2 rounded border">
                Cancelar
              </button>
              <button className="px-3 py-2 rounded bg-blue-600 text-white">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
