import { useEffect, useMemo, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { sendBot } from "../services/citas.p2";
import { useCitasList, useAddCita, useBulkStatus, useBulkDeleteCitas } from "../hooks/useCitasQuery";
import { useMedicosList } from "../hooks/useMedicosQuery";

import FiltersBar from "../components/FilterBar";
import AppointmentsTable from "../components/TablaCita";
import NewAppointmentModal from "../components/NuevaCitaModal";

export default function AppointmentsPage() {
  // Filtros
  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState("todos");
  const [fEsp, setFEsp] = useState("todas");

  // Modal
  const [showNew, setShowNew] = useState(false);

  // Banner
  const [msg, setMsg] = useState("");
  const [sendingBot, setSendingBot] = useState(false);
  const flipTimerRef = useRef(null);
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, []);

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => { setPage(1); }, [q, fEstado, fEsp]);

  // ✅ Selección LOCAL controlada (IDs string) + re-mount de tabla tras limpiar
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [selVersion, setSelVersion] = useState(0);
  const isSelected = (id) => selectedIds.has(String(id));
  const toggleRow = (id) => {
    const k = String(id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };
  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelVersion(v => v + 1); // fuerza re-mount para resetear checkboxes
  };

  const qc = useQueryClient();

  // Data
  const { data: citasData, isLoading: loadingCitas, error: errCitas } = useCitasList({
    search: q || undefined,
    estado: fEstado === "todos" ? undefined : fEstado,
  });
  const rows = useMemo(() => {
    const raw = citasData?.data ?? citasData ?? [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [citasData]);

  const { data: medicosData, isLoading: loadingMedicos, error: errMedicos } = useMedicosList();
  const medicos = useMemo(() => {
    const raw = medicosData?.items ?? medicosData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [medicosData]);

  const especialidades = useMemo(() => {
    const set = new Set(rows.map(r => r.especialidadMedico).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  // Filtro local
  const filtradas = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return rows.filter(c => {
      const okTexto =
        texto === "" ||
        (c.nombrePaciente || "").toLowerCase().includes(texto) ||
        String(c.telefono || "").toLowerCase().includes(texto);
      const okEstado = fEstado === "todos" || (c.estadoCita || "").toLowerCase().includes(fEstado);
      const okEsp = fEsp === "todas" || (c.especialidadMedico || "") === fEsp;
      return okTexto && okEstado && okEsp;
    });
  }, [rows, q, fEstado, fEsp]);

  // Slice por página
  const total = filtradas.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageRows = filtradas.slice(startIndex, endIndex);
  const start = total === 0 ? 0 : startIndex + 1;
  const end = Math.min(total, endIndex);

  // Select-all (página)
  const allSelected = pageRows.length > 0 && pageRows.every(r => isSelected(r.id));
  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) pageRows.forEach(r => next.delete(String(r.id)));
      else pageRows.forEach(r => next.add(String(r.id)));
      return next;
    });
  };

  // Mutations
  const addCita = useAddCita();
  const bulk = useBulkStatus();
  const delBulk = useBulkDeleteCitas();

  // ------- Acciones --------
  const onSendBot = async () => {
    const ids = Array.from(selectedIds); // strings
    if (!ids.length) {
      setMsg("Selecciona al menos 1 cita");
      return;
    }

    // UI inmediata
    setSendingBot(true);
    setMsg("Enviando bot…");
    clearSelection(); // ← limpia al tiro

    // Fallback: si la promesa no resuelve, igual flip a “enviado” a los 1.2s
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    flipTimerRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      setMsg("Bot enviado ✓. El estado se actualizará por webhook.");
    }, 1200);

    try {
      await sendBot(ids); // no cambia estado aquí; lo hará el webhook
      if (!isMounted.current) return;
      // si llegó antes del fallback, sobreescribe igual
      setMsg("Bot enviado ✓. El estado se actualizará por webhook.");
      qc.invalidateQueries({ queryKey: ["citas"], exact: false });
    } catch (e) {
      console.error(e);
      if (!isMounted.current) return;
      setMsg("Error al enviar el bot.");
    } finally {
      if (!isMounted.current) return;
      setSendingBot(false);
      // aseguramos limpiar el timer
      if (flipTimerRef.current) {
        clearTimeout(flipTimerRef.current);
        flipTimerRef.current = null;
      }
    }
  };

  const onQuickStatus = async (status) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    await bulk.mutateAsync({ ids, estado: status });
    setMsg(`Estado actualizado a "${status}" para ${ids.length} selección(es)`);
    clearSelection();
  };

  const onDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    await delBulk.mutateAsync(ids);
    setMsg(`Eliminadas ${ids.length} cita(s)`);
    clearSelection();
  };

  const onCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const nombrePaciente = (fd.get("nombrePaciente") || "").trim();
    const medicoId = (fd.get("medicoId") || "").toString().trim();
    const fechaRaw = fd.get("fechaCita");
    const fechaCita = fechaRaw ? new Date(fechaRaw).toISOString() : "";

    const telRaw = (fd.get("telefono") || "").toString();
    const telefonoDigits = telRaw.replace(/\D/g, "");
    if (telefonoDigits && telefonoDigits.length !== 9) {
      alert("El teléfono debe tener exactamente 9 dígitos (sin +56).");
      return;
    }
    if (nombrePaciente.length < 2) return alert("El nombre del paciente debe tener al menos 2 caracteres.");
    if (!fechaCita) return alert("Debes seleccionar fecha/hora de la cita.");
    if (!medicoId) return alert("Debes seleccionar un médico.");

    await addCita.mutateAsync({
      nombrePaciente,
      fechaCita,
      telefono: telefonoDigits || undefined,
      estadoCita: (fd.get("estadoCita") || "pendiente").toLowerCase(),
      medicoId,
      nombreMedico: (fd.get("medicoNombre") || "").trim() || undefined,
      especialidadMedico: (fd.get("especialidad") || "").trim() || undefined,
    });
    setShowNew(false);
    setMsg("Nueva cita agregada");
    e.currentTarget.reset();
  };

  if (loadingCitas || loadingMedicos) return <div className="p-4">Cargando…</div>;
  if (errCitas) return <div className="p-4 text-red-600">Error al cargar citas</div>;
  if (errMedicos) return <div className="p-4 text-red-600">Error al cargar médicos</div>;

  return (
    <div className="space-y-4">
      <FiltersBar
        q={q}
        onQChange={setQ}
        fEstado={fEstado}
        onEstadoChange={setFEstado}
        fEsp={fEsp}
        onEspChange={setFEsp}
        especialidades={especialidades}
        selectedCount={selectedIds.size}
        onNewClick={() => setShowNew(true)}
        onSendBot={onSendBot}
        onQuickStatus={onQuickStatus}
        onDeleteSelected={onDeleteSelected}
      />

      {msg && <div className="text-sm text-gray-700">{msg}</div>}

      <AppointmentsTable
        key={`sel-${selVersion}`}
        rows={pageRows}
        allSelected={pageRows.length > 0 && pageRows.every(r => isSelected(r.id))}
        onToggleAll={toggleSelectAll}
        isSelected={isSelected}
        onToggleRow={toggleRow}
      />

      {/* Paginación */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          {total > 0
            ? <>Mostrando <strong>{start}</strong>–<strong>{end}</strong> de <strong>{total}</strong></>
            : "Sin resultados"}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPage(1)} disabled={safePage === 1} className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50" title="Primera">«</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50">Anterior</button>
          <span className="px-2 text-sm">Página <strong>{safePage}</strong> de <strong>{pageCount}</strong></span>
          <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={safePage === pageCount} className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50">Siguiente</button>
          <button onClick={() => setPage(pageCount)} disabled={safePage === pageCount} className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50" title="Última">»</button>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="ml-2 h-10 rounded-lg border px-2 text-sm" title="Elementos por página">
            <option value={10}>10 / pág</option>
            <option value={25}>25 / pág</option>
            <option value={50}>50 / pág</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button onClick={() => onQuickStatus("confirmada")} disabled={!selectedIds.size || sendingBot} className="h-10 rounded-full px-4 text-sm text-white bg-[#2DCD39] disabled:opacity-50 font-medium">Confirmar</button>
        <button onClick={() => onQuickStatus("cancelada")} disabled={!selectedIds.size || sendingBot} className="h-10 rounded-full px-4 text-sm text-white bg-[#FD0327] disabled:opacity-50 font-medium">Cancelar</button>
        <button onClick={onDeleteSelected} disabled={!selectedIds.size || sendingBot} className="h-10 rounded-full px-4 text-sm border border-[#FD0327] text-[#FD0327] hover:bg-[#FD0327]/10 disabled:opacity-50 font-medium">Eliminar seleccionadas</button>
      </div>

      <NewAppointmentModal
        medicos={medicos}
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreate={onCreate}
      />
    </div>
  );
}
