import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDoctors, createDoctor, updateDoctor } from "../services/medicos.js";

const asArray = (raw) =>
  Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.data) ? raw.data : [];
const toUI = (d) => {
  const activo = d?.is_active !== false;
  return { ...d, activo, estado: activo ? "activo" : "inactivo" };
};
const denormalize = (list, prev) => {
  if (!prev) return list;
  if (Array.isArray(prev)) return list;
  if (Array.isArray(prev?.items)) return { ...prev, items: list };
  if (Array.isArray(prev?.data))  return { ...prev, data:  list };
  return list;
};
const updateAllMedicos = (qc, updater) => {
  const snaps = qc.getQueriesData({ queryKey: ["medicos"] });
  for (const [key, old] of snaps) qc.setQueryData(key, updater(old));
};

export function useMedicosList(params = {}, opts = {}) {
  const { includeInactive = true } = opts;
  return useQuery({
    queryKey: ["medicos", params],
    queryFn: () => listDoctors(params),
    select: (data) => {
      let arr = asArray(data).map(toUI);
      if (!includeInactive) arr = arr.filter((m) => m.activo !== false);
      return arr;
    },
    keepPreviousData: true,
    placeholderData: (prev) => prev,
  });
}

export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createDoctor(payload),
    onSuccess: (createdRaw) => {
      const created = toUI(createdRaw);
      updateAllMedicos(qc, (prev) => {
        const list = asArray(prev).map(toUI);
        const next = created.activo === false ? list : [...list, created];
        return denormalize(next, prev);
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["medicos"] }),
  });
}

export function useUpdateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => updateDoctor(id, patch),
    // ⬇️ Optimista: actualiza is_active al instante y hace rollback si falla
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["medicos"] });
      const snapshots = qc.getQueriesData({ queryKey: ["medicos"] });

      const nextActive =
        patch?.is_active ?? (typeof patch?.activo === "boolean" ? patch.activo : undefined);

      if (typeof nextActive === "boolean") {
        updateAllMedicos(qc, (prev) => {
          const list = asArray(prev).map(toUI).map((d) =>
            String(d.id) === String(id) ? { ...d, is_active: nextActive, activo: nextActive, estado: nextActive ? "activo" : "inactivo" } : d
          );
          return denormalize(list, prev);
        });
      }
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, old]) => qc.setQueryData(key, old));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["medicos"] }),
  });
}
