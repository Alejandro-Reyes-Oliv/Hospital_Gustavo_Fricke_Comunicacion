import { useMemo, useState } from "react";
// servicios: solo dejamos sendBot directo; las demás operaciones van por hooks
import { sendBot } from "../services/citas.p2";

import FiltersBar from "../components/FilterBar";
import AppointmentsTable from "../components/TablaCita";
import NewAppointmentModal from "../components/NuevaCitaModal";
import useSelection from "../hooks/useSelection";

// 🔽 hooks TanStack encima de los services
import { useCitasList, useAddCita, useBulkStatus, useBulkDeleteCitas } from "../hooks/useCitasQuery";
import { useMedicosList } from "../hooks/useMedicosQuery";

export default function AppointmentsPage() {
  // filtros/estado UI
  const [q, setQ] = useState("");
  const [fEstado, setFEstado] = useState("todos");
  const [fEsp, setFEsp] = useState("todas");
  const [showNew, setShowNew] = useState(false);
  const [msg, setMsg] = useState("");
  const [showRut, setShowRut] = useState(false);
  const [sendingBot, setSendingBot] = useState(false);

  const selApi = useSelection();

  // 🔽 Citas desde backend (o mocks según tu service)
  const {
    data: citasData,
    isLoading: loadingCitas,
    error: errCitas,
  } = useCitasList({
    search: q || undefined,
    estado: fEstado === "todos" ? undefined : fEstado,
    // si agregas filtro por médico en la UI: medicoId
  });

  // Normaliza la forma (puede venir {data:[]} o [])
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
            (c.rut || "").toLowerCase().includes(texto) ||
            String(c.telefono || "").toLowerCase().includes(texto);

      const okEstado =
        fEstado === "todos" ? true : (c.estadoCita || "").toLowerCase().includes(fEstado);

      const okEsp = fEsp === "todas" ? true : (c.especialidadMedico || "") === fEsp;

      return okTexto && okEstado && okEsp;
    });
  }, [rows, q, fEstado, fEsp]);

  const allFilteredSelected =
    filtradas.length > 0 && filtradas.every((r) => selApi.isSelected(r.id));
  const toggleSelectAll = () => {
    if (allFilteredSelected) selApi.removeMany(filtradas.map((r) => r.id));
    else selApi.setMany(filtradas.map((r) => r.id));
  };

  // 🔽 Mutations
  const addCita = useAddCita();
  const bulk = useBulkStatus();
  const delBulk = useBulkDeleteCitas();

  const onSendBot = async () => {
    const ids = selApi.values;
    if (!ids.length) return;
    try {
      setSendingBot(true);
      setMsg("Enviando bot…");
      await sendBot(ids);
      setMsg(`Bot enviado a ${ids.length} paciente(s)`);
      selApi.clear();
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
    

    const payload = {
      nombrePaciente: fd.get("nombrePaciente"),
      rut: fd.get("rut"),
      fechaCita: fd.get("fechaCita"),
      telefono: fd.get("telefono"),
      estadoCita: fd.get("estadoCita") || "pendiente",
      // Preferimos enviar medicoId; mantenemos campos UI opcionales
      medicoId: fd.get("medicoId") || fd.get("doctorId") || "",
      nombreMedico: fd.get("nombreMedico"),
      especialidadMedico: fd.get("especialidadMedico"),
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
        showRut={showRut}
        onToggleRut={() => setShowRut((v) => !v)}
        onDeleteSelected={onDeleteSelected}
      />

      {msg && <div className="text-sm text-gray-600">{msg}</div>}
      <div className="text-sm text-gray-600">{filtradas.length} resultados</div>

      <AppointmentsTable
        rows={filtradas}
        allSelected={allFilteredSelected}
        onToggleAll={toggleSelectAll}
        isSelected={selApi.isSelected}
        onToggleRow={selApi.toggle}
        showRut={showRut}
      />

      <NewAppointmentModal
        medicos={medicos}
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreate={onCreate}
      />
    </div>
  );
}
