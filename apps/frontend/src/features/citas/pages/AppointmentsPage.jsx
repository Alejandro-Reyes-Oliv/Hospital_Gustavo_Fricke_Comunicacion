// src/features/citas/pages/AppointmentsPage.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { sendBot } from "../services/citas.p2.js";
import {
  useCitasList,
  useAddCita,
  useBulkStatus,
  useBulkDeleteCitas,
} from "../hooks/useCitasQuery.js";
import { useMedicosList } from "../../medicos/hooks/useMedicosQuery.js";

import FiltersBar from "../../../shared/components/FilterBar.jsx";
import AppointmentsTable from "../components/TablaCita.jsx";
import NewAppointmentModal from "../components/NuevaCitaModal.jsx";

// UX
import Loader from "../../../shared/components/Loader.jsx";
import SkeletonTable from "../../../shared/components/SkeletonTable.jsx";
import ErrorBanner from "../../../shared/components/ErrorBanner.jsx";

import { sanitizePhone, isValidCl9 } from "../../../shared/utils/phone.js";

export default function AppointmentsPage() {
  // Filtros
  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState("todos");
  const [fEsp, setFEsp] = useState("todas");

  // Modal
  const [showNew, setShowNew] = useState(false);

  // Banner / feedback
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
  useEffect(() => {
    setPage(1);
  }, [q, fEstado, fEsp]);

  // ✅ Selección LOCAL controlada (IDs string)
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [selVersion, setSelVersion] = useState(0);
  const isSelected = (id) => selectedIds.has(String(id));
  const toggleRow = (id) => {
    const k = String(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };
  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelVersion((v) => v + 1); // re-mount de la tabla para resetear checkboxes
  };

  const qc = useQueryClient();

  // Data: citas
  const {
    data: citasData,
    isLoading: loadingCitas,
    error: errCitas,
  } = useCitasList({
    search: q || undefined,
    estado: fEstado === "todos" ? undefined : fEstado,
  });
  const rows = useMemo(() => {
    const raw = citasData?.data ?? citasData ?? [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [citasData]);

  // Data: médicos
  const {
    data: medicosData,
    isLoading: loadingMedicos,
    error: errMedicos,
  } = useMedicosList();
  const medicos = useMemo(() => {
    const raw = medicosData?.items ?? medicosData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [medicosData]);

  const especialidades = useMemo(() => {
    const set = new Set(rows.map((r) => r.especialidadMedico).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  // Filtro local
  const filtradas = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return rows.filter((c) => {
      const okTexto =
        texto === "" ||
        (c.nombrePaciente || "").toLowerCase().includes(texto) ||
        String(c.telefono || "").toLowerCase().includes(texto);
      const okEstado =
        fEstado === "todos" ||
        (c.estadoCita || "").toLowerCase().includes(fEstado);
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
  const allSelected =
    pageRows.length > 0 && pageRows.every((r) => isSelected(r.id));
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) pageRows.forEach((r) => next.delete(String(r.id)));
      else pageRows.forEach((r) => next.add(String(r.id)));
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
    clearSelection();

    // Fallback visual
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    flipTimerRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      setMsg("Bot enviado ✓. El estado se actualizará por webhook.");
    }, 1200);

    try {
      await sendBot(ids);
      if (!isMounted.current) return;
      setMsg("Bot enviado ✓. El estado se actualizará por webhook.");
      qc.invalidateQueries({ queryKey: ["citas"], exact: false });
    } catch (e) {
      console.error(e);
      if (!isMounted.current) return;
      setMsg("Error al enviar el bot.");
    } finally {
      if (!isMounted.current) return;
      setSendingBot(false);
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

  /**
   * Crea cita aceptando:
   *  - (e) evento submit de <form>
   *  - (payload, ctx) desde el modal (ctx opcional: { reset, form })
   */
  const onCreate = async (arg1, ctx = {}) => {
    let fd = null;
    let formEl = null;

    // Caso 1: es evento de formulario
    if (arg1?.preventDefault) {
      const e = arg1;
      e.preventDefault();
      formEl = e.currentTarget || null;
      fd = new FormData(formEl || undefined);
    }
    // Caso 2: te pasan un FormData
    else if (typeof FormData !== "undefined" && arg1 instanceof FormData) {
      fd = arg1;
      formEl = ctx?.form || null;
    }
    // Caso 3: te pasan un objeto con campos
    else if (arg1 && typeof arg1 === "object") {
      // Normalizamos a través de getters que miran fd o arg1
      // (abajo usamos get("campo"))
    }

    const get = (name) => {
      if (fd) return (fd.get(name) ?? "").toString();
      return (arg1?.[name] ?? "").toString();
    };

    const nombrePaciente = (get("nombrePaciente") || "").trim();
    const medicoId = (get("medicoId") || "").trim();
    const fechaRaw = get("fechaCita");
    const fechaCita = fechaRaw ? new Date(fechaRaw).toISOString() : "";

    const telRaw = get("telefono");
    const telefonoDigits = sanitizePhone(telRaw);
    if (telefonoDigits && !isValidCl9(telefonoDigits)) {
      alert("El teléfono debe tener exactamente 9 dígitos (sin +56).");
      return;
    }

    if (nombrePaciente.length < 2)
      return alert("El nombre del paciente debe tener al menos 2 caracteres.");
    if (!fechaCita) return alert("Debes seleccionar fecha/hora de la cita.");
    if (!medicoId) return alert("Debes seleccionar un médico.");

    await addCita.mutateAsync({
      nombrePaciente,
      fechaCita,
      telefono: telefonoDigits || undefined,
      estadoCita: (get("estadoCita") || "pendiente").toLowerCase(),
      medicoId,
      nombreMedico: (get("medicoNombre") || "").trim() || undefined,
      especialidadMedico: (get("especialidad") || "").trim() || undefined,
    });

    setShowNew(false);
    setMsg("Nueva cita agregada");

    // ✅ Reset seguro (exista o no)
    try { ctx?.reset?.(); } catch {}
    try { (ctx?.form || formEl)?.reset?.(); } catch {}
  };

  // ---------- Loading ----------
  if (loadingCitas || loadingMedicos) {
    return (
      <div className="space-y-3">
        <Loader label="Cargando datos…" />
        <SkeletonTable rows={6} cols={6} />
      </div>
    );
  }

  // ---------- Errores ----------
  const hasErrors = errCitas || errMedicos;
  if (hasErrors) {
    const retryAll = () => {
      if (errCitas) qc.invalidateQueries({ queryKey: ["citas"], exact: false });
      if (errMedicos) qc.invalidateQueries({ queryKey: ["medicos"], exact: false });
    };
    return (
      <div className="space-y-3">
        {errCitas ? (
          <ErrorBanner
            title="No se pudieron cargar las citas"
            message={errCitas?.message}
            onRetry={retryAll}
          />
        ) : null}
        {errMedicos ? (
          <ErrorBanner
            title="No se pudieron cargar los médicos"
            message={errMedicos?.message}
            onRetry={retryAll}
          />
        ) : null}
      </div>
    );
  }

  // ---------- UI ----------
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

      {msg && (
        <div className="text-sm text-gray-700" role="status" aria-live="polite">
          {msg}
        </div>
      )}

      <AppointmentsTable
        key={`sel-${selVersion}`}
        rows={pageRows}
        allSelected={pageRows.length > 0 && pageRows.every((r) => isSelected(r.id))}
        onToggleAll={toggleSelectAll}
        isSelected={isSelected}
        onToggleRow={toggleRow}
      />

      {/* Paginación */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          {total > 0 ? (
            <>
              Mostrando <strong>{start}</strong>–<strong>{end}</strong> de{" "}
              <strong>{total}</strong>
            </>
          ) : (
            "Sin resultados"
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={safePage === 1}
            className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
            title="Primera"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-2 text-sm">
            Página <strong>{safePage}</strong> de <strong>{pageCount}</strong>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={safePage === pageCount}
            className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
          <button
            onClick={() => setPage(pageCount)}
            disabled={safePage === pageCount}
            className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
            title="Última"
          >
            »
          </button>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="ml-2 h-10 rounded-lg border px-2 text-sm"
            title="Elementos por página"
          >
            <option value={10}>10 / pág</option>
            <option value={25}>25 / pág</option>
            <option value={50}>50 / pág</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          onClick={() => onQuickStatus("confirmada")}
          disabled={!selectedIds.size || sendingBot}
          className="h-10 rounded-full px-4 text-sm text-white bg-[#2DCD39] disabled:opacity-50 font-medium"
        >
          Confirmar
        </button>
        <button
          onClick={() => onQuickStatus("cancelada")}
          disabled={!selectedIds.size || sendingBot}
          className="h-10 rounded-full px-4 text-sm text-white bg-[#FD0327] disabled:opacity-50 font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={onDeleteSelected}
          disabled={!selectedIds.size || sendingBot}
          className="h-10 rounded-full px-4 text-sm border border-[#FD0327] text-[#FD0327] hover:bg-[#FD0327]/10 disabled:opacity-50 font-medium"
        >
          Eliminar seleccionadas
        </button>
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
