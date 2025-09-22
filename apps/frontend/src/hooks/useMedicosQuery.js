// apps/frontend/src/hooks/useMedicosQuery.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMedicos, createDoctor, deleteDoctor } from "../services/medicos";

export function useMedicosList(params) {
  return useQuery({
    queryKey: ["medicos", params],
    queryFn: () => listMedicos(params),
    staleTime: 60_000,
  });
}
export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createDoctor(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicos"] }),
  });
}

export function useDeleteDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteDoctor(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicos"] }),
  });
}