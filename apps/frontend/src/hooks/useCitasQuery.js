// apps/frontend/src/hooks/useCitasQuery.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCitas, addAppointment, updateStatus, deleteAppointments } from "../services/citas.p2";

/**
 * Hook de lista de Citas con auto-refresh (polling).
 * - Solo refresca esta query: ['citas', filtros]
 * - Pausa el polling cuando la pestaña está oculta
 * - Intervalo configurable por env: VITE_CITAS_REFRESH_MS (default 15000 ms)
 * - Igualamos staleTime al intervalo para evitar doble fetch (foco + intervalo)
 */
export function useCitasList(filtros = {}, opts = {}) {
  const REFRESH_MS = Number(import.meta.env.VITE_CITAS_REFRESH_MS ?? 15000);

  return useQuery({
    queryKey: ['citas', filtros],
    queryFn: () => listCitas(filtros),

    // Normaliza forma esperada por la tabla
    select: (raw) => ({
      items: Array.isArray(raw?.items) ? raw.items : [],
      total: Number(raw?.total ?? 0),
      page: Number(raw?.page ?? filtros?.page ?? 1),
      pageSize: Number(raw?.pageSize ?? filtros?.pageSize ?? 10),
    }),

    // Evita doble fetch (foco + intervalo)
    staleTime: REFRESH_MS,

    // 🔁 Auto-refresh, pausado si la pestaña está oculta
    refetchInterval: () =>
      (typeof document !== 'undefined' && document.hidden ? false : REFRESH_MS),

    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    keepPreviousData: true,

    // Permite controlar desde el contenedor: { enabled: true/false }
    ...opts,
  });
}

export function useAddCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => addAppointment(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["citas"] }),
  });
}

export function useBulkStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, estado }) => updateStatus(ids, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["citas"] }),
  });
}

export function useBulkDeleteCitas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids) => deleteAppointments(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["citas"] }),
  });
}
