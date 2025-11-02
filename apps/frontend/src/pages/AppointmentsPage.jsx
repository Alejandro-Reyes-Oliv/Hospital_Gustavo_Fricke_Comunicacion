import { useEffect, useMemo, useState } from "react";
// servicios: solo dejamos sendBot directo; las demás operaciones van por hooks
import { sendBot } from "../services/citas.p2";

import FiltersBar from "../components/FilterBar";
import AppointmentsTable from "../components/TablaCita";
import NewAppointmentModal from "../components/NuevaCitaModal";
import useSelection from "../hooks/useSelection";

// 🔽 hooks TanStack encima de los services
import { useCitasList, useAddCita, useBulkStatus, useBulkDeleteCitas } from "../hooks/useCitasQuery";
import { useMedicosList } from "../hooks/useMedicosQuery";
import { useQueryClient } from "@tanstack/react-query";

export default function AppointmentsPage() {
  // filtros/estado UI
  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState("todos");
  const [fEsp, setFEsp] = useState("todas");
  const [showNew, setShowNew] = useState(false);
  const [msg, setMsg] = useState("");
  const [sendingBot, setSendingBot] = useState(false);

  // Paginación (client-side)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => {
    setPage(1);
  }, [q, fEstado, fEsp]);

  const selApi = useSelection();
  const qc = useQueryClient();

  // Citas desde backend (o mocks según tu service)
  const {
    data: citasData,
    isLoading: loadingCitas,
    error: errCitas,
  } = useCitasList({
    search: q || undefined,
    estado: fEstado === "todos" ? undefined : fEstado,
    // si agregas filtro por médico en la UI: medicoId
  });

  // Normaliza la forma (puede venir {items:[]} o [] o {data:[]})
  const rows = useMemo(() => {
    const raw = citasData?.data ?? citasData ?? [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [citasData]);

  // 🔽 Médicos (para el modal)
  const {
    data: medicosData,
    isLoading: loadingMedicos,
    error: errMedicos,
  } = useMedicosList();

  const medicos = useMemo(() => {
    const raw = medicosData?.items ?? medicosData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [medicosData]);

  // opciones únicas de especialidad (solo para filtro local)
  const especialidades = useMemo(() => {
    const set = new Set(rows.map((r) => r.especialidadMedico).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  // filtro local (texto/estado/esp) sobre lo que ya vino del backend
  const filtradas = useMemo(() => {
    const texto = q.trim().toLowerCase();

    return rows.filter((c) => {
      const okTexto =
        texto === ""
          ? true
          : (c.nombrePaciente || "").toLowerCase().includes(texto) ||
            String(c.telefono || "").toLowerCase().includes(texto);

      const okEstado =
        fEstado === "todos" ? true : (c.estadoCita || "").toLowerCase().includes(fEstado);

      const okEsp = fEsp === "todas" ? true : (c.especialidadMedico || "") === fEsp;

      return okTexto && okEstado && okEsp;
    });
  }, [rows, q, fEstado, fEsp]);

  // Slice por página (client-side)
  const total = filtradas.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount); // por si cambian filtros y baja el total
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageRows = filtradas.slice(startIndex, endIndex);
  const start = total === 0 ? 0 : startIndex + 1;
  const end = Math.min(total, endIndex);

  // Select-all SOLO de la página visible
  const allSelected = pageRows.length > 0 && pageRows.every((r) => selApi.isSelected(r.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      pageRows.forEach((r) => {
        if (selApi.isSelected(r.id)) selApi.toggle(r.id);
      });
    } else {
      pageRows.forEach((r) => {
        if (!selApi.isSelected(r.id)) selApi.toggle(r.id);
      });
    }
  };

  // 🔽 Mutations
  const addCita = useAddCita();
  const bulk = useBulkStatus();
  const delBulk = useBulkDeleteCitas();

  // ✅ Marca "enviado" en TODAS las queries ['citas', *] de forma optimista
  const setEnviadoLocal = (ids) => {
    // actualiza cualquier variante: array plano, {items:[]}, {data:[]}
    // y lo hace para todas las claves que empiecen con ['citas']
    qc.setQueriesData({ queryKey: ["citas"], exact: false }, (old) => {
      if (!old) return old;
      const patchItem = (r) => (ids.includes(r.id) ? { ...r, estadoCita: "enviado" } : r);

      if (Array.isArray(old)) return old.map(patchItem);
      if (Array.isArray(old.items)) return { ...old, items: old.items.map(patchItem) };
      if (Array.isArray(old.data)) return { ...old, data: old.data.map(patchItem) };
      return old;
    });
  };

  const onSendBot = async () => {
    const ids = selApi.values;
    if (!ids.length) return;

    // 1) Optimista inmediato en UI
    setEnviadoLocal(ids);
    setMsg(`Marcando como "enviado"…`);

    try {
      setSendingBot(true);

      // 2) Dispara el envío real
      await sendBot(ids);

      // 3) (opcional) intenta persistir estado en backend si existe endpoint
      try {
        await bulk.mutateAsync({ ids, estado: "enviado" });
      } catch {
        // si el backend aún no soporta "enviado", lo dejamos solo en UI;
        // el polling luego traerá "recibido"/"leido" cuando llegue el webhook
      }

      setMsg(`Bot enviado y estado "enviado" aplicado a ${ids.length} cita(s)`);
      selApi.clear();
    } catch (e) {
      console.error(e);
      setMsg("Error al enviar el bot. Se restaurará la lista.");
      // 🔁 revalida para deshacer el optimismo si falló
      qc.invalidateQueries({ queryKey: ["citas"], exact: false });
    } finally {
      setSendingBot(false);
    }
  };


  const onQuickStatus = async (status) => {
    const ids = selApi.values;
    if (!ids.length) return;
    await bulk.mutateAsync({ ids, estado: status });
    setMsg(`Estado actualizado a "${status}" para ${ids.length} selección(es)`);
    selApi.clear();
  };

  const onDeleteSelected = async () => {
    const ids = selApi.values;
    if (!ids.length) return;
    await delBulk.mutateAsync(ids);
    setMsg(`Eliminadas ${ids.length} cita(s)`);
    selApi.clear();
  };

  const onCreate = async (e) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);

    const nombrePaciente = (fd.get("nombrePaciente") || "").trim();
    const medicoId = (fd.get("medicoId") || "").toString().trim();
    const fechaRaw = fd.get("fechaCita");
    // Si usas <input type="datetime-local">, viene como "YYYY-MM-DDTHH:mm"
    // Convierte a ISO si es necesario:
    const fechaCita = fechaRaw ? new Date(fechaRaw).toISOString() : "";

    // 🔒 Teléfono: solo dígitos y exactamente 9
    const telRaw = (fd.get("telefono") || "").toString();
    const telefonoDigits = telRaw.replace(/\D/g, "");
    if (telefonoDigits && telefonoDigits.length !== 9) {
      alert("El teléfono debe tener exactamente 9 dígitos (sin +56).");
      return;
    }

    if (nombrePaciente.length < 2) {
      alert("El nombre del paciente debe tener al menos 2 caracteres.");
      return;
    }
    if (!fechaCita) {
      alert("Debes seleccionar fecha/hora de la cita.");
      return;
    }
    if (!medicoId) {
      alert("Debes seleccionar un médico.");
      return;
    }

    const payload = {
      nombrePaciente,
      // rut eliminado
      fechaCita,
      telefono: telefonoDigits || undefined,
      estadoCita: (fd.get("estadoCita") || "pendiente").toLowerCase(),
      medicoId,
      nombreMedico: (fd.get("medicoNombre") || "").trim() || undefined,
      especialidadMedico: (fd.get("especialidad") || "").trim() || undefined,
    };

    await addCita.mutateAsync(payload);
    setShowNew(false);
    setMsg("Nueva cita agregada");
    formEl?.reset();
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
        selectedCount={selApi.size}
        onNewClick={() => setShowNew(true)}
        onSendBot={onSendBot}
        onQuickStatus={onQuickStatus}
        onDeleteSelected={onDeleteSelected}
      />

      {msg && <div className="text-sm text-gray-600">{msg}</div>}

      {/* Tabla paginada */}
      <AppointmentsTable
        rows={pageRows}
        allSelected={allSelected}
        onToggleAll={toggleSelectAll}
        isSelected={selApi.isSelected}
        onToggleRow={selApi.toggle}
      />

      {/* Paginación */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          {total > 0 ? (
            <>Mostrando <strong>{start}</strong>–<strong>{end}</strong> de <strong>{total}</strong></>
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

      {/* Barra de acciones inferior */}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          onClick={() => onQuickStatus("confirmada")}
          disabled={!selApi.values.length}
          className="h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-sm text-white bg-[#2DCD39] disabled:opacity-50 font-medium"
        >
          Confirmar
        </button>
        <button
          onClick={() => onQuickStatus("cancelada")}
          disabled={!selApi.values.length}
          className="h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-sm text-white bg-[#FD0327] disabled:opacity-50 font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={onDeleteSelected}
          disabled={!selApi.values.length}
          className="h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-sm border border-[#FD0327] text-[#FD0327] hover:bg-[#FD0327]/10 disabled:opacity-50 font-medium"
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
