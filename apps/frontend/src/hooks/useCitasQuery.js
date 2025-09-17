// apps/frontend/src/hooks/useCitasQuery.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCitas, addAppointment, updateStatus, deleteAppointments } from "../services/citas.p2";

export function useCitasList(filtros) {
  return useQuery({
    queryKey: ['citas', filtros],
    queryFn: () => listCitas(filtros),
    // Garantiza forma estable para la UI
    select: (raw) => ({
      items: Array.isArray(raw?.items) ? raw.items : [],
      total: Number(raw?.total ?? 0),
      page: Number(raw?.page ?? filtros?.page ?? 1),
      pageSize: Number(raw?.pageSize ?? filtros?.pageSize ?? 10),
    }),
    staleTime: 5_000,
    keepPreviousData: true,
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