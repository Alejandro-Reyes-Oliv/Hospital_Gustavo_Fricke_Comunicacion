// src/features/medicos/pages/MedicosPage.jsx
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMedicosList, useCreateDoctor, useUpdateDoctor } from "../hooks/useMedicosQuery.js";
import NewDoctorModal from "../components/NewDoctorModal.jsx";
import MedicosTable from "../components/MedicosTable.jsx";
import ErrorBanner from "../../../shared/components/ErrorBanner.jsx";

export default function MedicosPage() {
  const [q, setQ] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const qc = useQueryClient();
  const { data, isLoading, error } = useMedicosList();
  const createMut = useCreateDoctor();
  const updMut = useUpdateDoctor();

  const rows = useMemo(() => {
    const raw = data?.data ?? data ?? [];
    const list = Array.isArray(raw) ? raw : (raw?.items ?? []);

    const base = showInactive ? list : list.filter((r) => (r?.is_active ?? r?.activo) !== false);

    if (!q) return sortByNombre(base);
    const needle = q.toLowerCase();
    const has = (v) => String(v ?? "").toLowerCase().includes(needle);

    return sortByNombre(base.filter((r) => has(r.nombre) || has(r.especialidad) || has(r.email) || has(r.telefono)));
  }, [data, q, showInactive]);

  const onSaveDoctor = (payload) => {
    createMut.mutate(payload, {
      onSuccess: () => {
        setOpenCreate(false);
        qc.invalidateQueries({ queryKey: ["medicos"], exact: false });
      },
    });
  };

  // Recibe el valor explícito true/false
  const onSetActive = (id, value) => {
    // Enviamos varios alias para maximizar compatibilidad con el backend
    const patch = { is_active: !!value, activo: !!value, estado: value ? "activo" : "inactivo" };
    updMut.mutate(
      { id, patch },
      { onSettled: () => qc.invalidateQueries({ queryKey: ["medicos"], exact: false }) }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="text-slate-600">Cargando médicos…</div>
        <div className="animate-pulse rounded-xl border bg-white p-6 shadow">
          <div className="h-4 w-2/3 bg-slate-200 rounded mb-3" />
          <div className="h-4 w-1/2 bg-slate-200 rounded mb-3" />
          <div className="h-4 w-5/6 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    const retry = () => qc.invalidateQueries({ queryKey: ["medicos"], exact: false });
    return <ErrorBanner title="No se pudieron cargar los médicos" message={error?.message} onRetry={retry} />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Médicos</h2>

      {/* Barra superior */}
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <input
          className="h-10 w-full md:w-[520px] rounded-full border border-slate-300 px-4 text-sm bg-white"
          placeholder="Buscar por nombre, especialidad, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar médicos"
        />

        <label className="inline-flex items-center gap-2 text-sm select-none ml-2">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Ver inactivos
        </label>

        <div className="ml-auto">
          <button onClick={() => setOpenCreate(true)} className="h-10 rounded-full bg-[#0C4581] px-5 text-sm font-medium text-white">
            + Agregar
          </button>
        </div>
      </div>

      <MedicosTable rows={rows} onSetActive={onSetActive} />

      <NewDoctorModal open={openCreate} onClose={() => setOpenCreate(false)} onSave={onSaveDoctor} />
    </div>
  );
}

function sortByNombre(list) {
  return [...list].sort((a, b) => (a?.nombre || "").localeCompare(b?.nombre || "", "es"));
}
