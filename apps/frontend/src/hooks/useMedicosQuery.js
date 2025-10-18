// src/hooks/useMedicosQuery.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/** .env (frontend/.env)
VITE_API_URL=http://localhost:8080
VITE_DOCTORS_ROUTE=/api/doctors
*/
const API  = import.meta.env.VITE_API_URL       ?? "http://localhost:8080";
const BASE = import.meta.env.VITE_DOCTORS_ROUTE ?? "/api/doctors";
const ABS  = (p = "") => `${API}${BASE}${p}`;

/* ---------- helpers ---------- */
const normalize = (data) => {
  const raw = data?.data ?? data ?? [];
  return Array.isArray(raw) ? raw : (raw.items ?? []);
};
const denormalize = (list, prev) => {
  if (Array.isArray(prev)) return list;
  if (prev?.data)  return { ...prev, data: list };
  if (prev?.items) return { ...prev, items: list };
  return list;
};

const getId = (x) =>
  typeof x === "string" || typeof x === "number" ? x : x?.id ?? x?._id;

const toUI = (d) => {
  const activo = d?.activo ?? (d?.estado ? d.estado === "activo" : true);
  return {
    id: getId(d),
    nombre: d?.nombre ?? d?.name ?? "",
    especialidad: d?.especialidad ?? d?.specialty ?? "",
    email: d?.email ?? "",
    telefono: d?.telefono ?? d?.phone ?? "",
    activo,
    estado: activo ? "activo" : "inactivo",
  };
};

const toDTO = (p) => ({
  nombre: p?.nombre ?? p?.name ?? "",
  especialidad: p?.especialidad ?? p?.specialty ?? "",
  email: p?.email ?? "",
  telefono: p?.telefono ?? p?.phone ?? "",
  activo: p?.activo ?? true, // <- por defecto activo
});

const throwHttp = async (res, url) => {
  const body = await res.text().catch(() => "");
  const msg = `HTTP ${res.status} ${url}${body ? ` — ${body}` : ""}`;
  console.error(msg);
  throw new Error(msg);
};

// Actualiza TODAS las queries ['medicos', *]
const updateAllMedicos = (qc, updater) => {
  const matches = qc.getQueriesData({ queryKey: ["medicos"] });
  for (const [key, old] of matches) {
    qc.setQueryData(key, updater(old));
  }
};

/* ---------- queries ---------- */
// GET /api/doctors?search=&page=&pageSize=&sort=nombre:asc
async function fetchDoctors({ search, page = 1, pageSize = 20, sort = "nombre:asc" } = {}) {
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (page) qs.set("page", String(page));
  if (pageSize) qs.set("pageSize", String(pageSize));
  if (sort) qs.set("sort", String(sort));
  const url = ABS("/" + (qs.toString() ? `?${qs}` : ""));
  const res = await fetch(url);
  if (!res.ok) await throwHttp(res, url);
  return res.json();
}

/**
 * Lista de médicos, por defecto OCULTA los inactivos (activo === false).
 * Si quieres alguna vista que los muestre, pasa opts.includeInactive = true.
 */
export function useMedicosList(params = {}, opts = { includeInactive: false }) {
  return useQuery({
    queryKey: ["medicos", params],
    queryFn: () => fetchDoctors(params),
    select: (data) => {
      let arr = normalize(data).map(toUI);
      if (!opts?.includeInactive) arr = arr.filter((d) => d.activo !== false);
      return arr;
    },
    placeholderData: (prev) => prev,
  });
}

/* ---------- create ---------- */
// POST /api/doctors
async function postDoctor(payload) {
  const url = ABS("/");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toDTO(payload)),
  });
  if (!res.ok) await throwHttp(res, url);
  return res.json();
}
export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postDoctor,
    onSuccess: (createdRaw) => {
      const created = toUI(createdRaw);
      updateAllMedicos(qc, (prev) => {
        const list = normalize(prev).map(toUI);
        // la lista visible oculta inactivos; created suele venir activo:true
        const next = created.activo === false ? list : [...list, created];
        return denormalize(next, prev);
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["medicos"] }),
  });
}

/* ---------- update ---------- */
// PATCH /api/doctors/:id
async function patchDoctor({ id, data }) {
  const _id = getId(id);
  const url = ABS(`/${encodeURIComponent(_id)}`);
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toDTO(data)),
  });
  if (!res.ok) await throwHttp(res, url);
  return res.json();
}
export function useUpdateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchDoctor,
    onSuccess: (updatedRaw) => {
      const updated = toUI(updatedRaw);
      updateAllMedicos(qc, (prev) => {
        const list = normalize(prev).map(toUI);
        // si quedó inactivo, sácalo de la lista visible
        const next = updated.activo === false
          ? list.filter((d) => d.id !== updated.id)
          : list.map((d) => (d.id === updated.id ? updated : d));
        return denormalize(next, prev);
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["medicos"] }),
  });
}

/* ---------- delete (soft) ---------- */
// DELETE /api/doctors/:id  -> tu back pone activo=false (204)
async function deleteDoctor(target) {
  const _id = getId(target);
  const url = ABS(`/${encodeURIComponent(_id)}`);
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) await throwHttp(res, url);
  return { id: _id };
}
export function useDeleteDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDoctor,
    onMutate: async (target) => {
      const id = getId(target);
      await qc.cancelQueries({ queryKey: ["medicos"] });
      const snapshots = qc.getQueriesData({ queryKey: ["medicos"] });

      // Optimista: como la UI no muestra inactivos, simplemente lo removemos
      updateAllMedicos(qc, (prev) => {
        const list = normalize(prev).map(toUI).filter((d) => d.id !== id);
        return denormalize(list, prev);
      });

      return { snapshots };
    },
    onError: (_err, _target, ctx) => {
      // rollback si falló
      ctx?.snapshots?.forEach(([key, old]) => qc.setQueryData(key, old));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["medicos"] }),
  });
}
