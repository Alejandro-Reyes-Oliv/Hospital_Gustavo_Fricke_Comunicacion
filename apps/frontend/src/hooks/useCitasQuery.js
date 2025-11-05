// src/hooks/useCitasQuery.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCitas,
  addAppointment,
  updateStatus,
  deleteAppointments,
} from "../services/citas.p2";

const REFRESH_MS = Number(import.meta.env.VITE_CITAS_REFRESH_MS ?? 15000); // 15s por defecto

export function useCitasList(filtros = {}, opts = {}) {
  return useQuery({
    queryKey: ["citas", filtros],
    queryFn: () => listCitas(filtros),
    // Normaliza para tu AppointmentsPage (usa .data)
    select: (raw) => {
      const items = Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw?.data)
        ? raw.data
        : [];
      return {
        data: items,
        total: Number(raw?.total ?? items.length),
        page: Number(raw?.page ?? filtros?.page ?? 1),
        pageSize: Number(raw?.pageSize ?? filtros?.pageSize ?? items.length),
      };
    },
    staleTime: REFRESH_MS,
    refetchInterval: () =>
      (typeof document !== "undefined" && document.hidden ? false : REFRESH_MS),
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    keepPreviousData: true,
    ...opts,
  });
}

export function useAddCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => addAppointment(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["citas"], exact: false }),
  });
}

export function useBulkStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, estado }) => updateStatus(ids, estado),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["citas"], exact: false }),
  });
}

export function useBulkDeleteCitas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids) => deleteAppointments(ids),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["citas"], exact: false }),
  });
}
