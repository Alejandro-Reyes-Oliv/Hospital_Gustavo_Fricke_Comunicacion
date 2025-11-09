// src/features/citas/hooks/useCitasQuery.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as svc from "../services/citas.p2.js";

const REFRESH_MS = Number(import.meta.env.VITE_CITAS_REFRESH_MS ?? 15000); // 15s por defecto

const listFn   = svc.listCitas ?? svc.getCitas ?? svc.fetchCitas;
const addFn    = svc.addCita ?? svc.addAppointment;
const updateFn = svc.bulkStatus ?? svc.updateStatus;
const delFn    = svc.bulkDelete ?? svc.deleteAppointments;

export function useCitasList(filtros = {}, opts = {}) {
  return useQuery({
    queryKey: ["citas", filtros],
    queryFn: () => listFn(filtros),
    select: (raw) => {
      const items = Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw)
        ? raw
        : [];
      return {
        data: items,
        total: Number(raw?.total ?? items.length),
        page: Number(raw?.page ?? filtros?.page ?? 1),
        pageSize: Number(raw?.pageSize ?? filtros?.pageSize ?? items.length),
      };
    },
    keepPreviousData: true,
    staleTime: REFRESH_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: () =>
      (typeof document !== "undefined" && document.hidden ? false : REFRESH_MS),
    refetchIntervalInBackground: true,
    ...opts,
  });
}

export function useAddCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => addFn(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["citas"], exact: false }),
  });
}

export function useBulkStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, estado }) => updateFn(ids, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["citas"], exact: false }),
  });
}

export function useBulkDeleteCitas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids) => delFn(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["citas"], exact: false }),
  });
}
