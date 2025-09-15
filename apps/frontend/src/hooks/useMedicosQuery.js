// apps/frontend/src/hooks/useMedicosQuery.js
import { useQuery } from "@tanstack/react-query";
import { listMedicos } from "../services/medicos";

export function useMedicosList(params) {
  return useQuery({
    queryKey: ["medicos", params],
    queryFn: () => listMedicos(params),
    staleTime: 60_000,
  });
}
