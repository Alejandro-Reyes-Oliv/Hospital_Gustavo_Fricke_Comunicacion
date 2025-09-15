// apps/frontend/src/hooks/useCitasQuery.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCitas, addAppointment, updateStatus } from "../services/citas.p2";

export function useCitasList(filters) {
  return useQuery({
    queryKey: ["citas", filters],
    queryFn: () => listCitas(filters),
    staleTime: 10_000,
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
