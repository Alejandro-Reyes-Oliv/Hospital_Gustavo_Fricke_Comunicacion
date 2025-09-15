import { DoctorService } from "../services/doctor.service.js";
import { mapDoctorToDTO } from "../contracts/dto.mappers.js";
import { ok, created, noContent, pageOut } from "../contracts/http.js";

export const DoctorsContractController = {
  list: async (req, res, next) => {
    try {
      const { search, page = 1, pageSize = 20, sort = "nombre:asc" } = req.query;
      const offset = (Number(page) - 1) * Number(pageSize);
      const [campo, dir] = String(sort).split(":");

      const rows = await DoctorService.listar({
        q: search,
        limit: Number(pageSize),
        offset,
        order: `${campo || "nombre"}:${dir === "desc" ? "desc" : "asc"}`,
      });

      return ok(res, pageOut({ data: rows.map(mapDoctorToDTO), page: Number(page), pageSize: Number(pageSize), total: rows.length }));
    } catch (e) {
      next(e);
    }
  },

  create: async (req, res, next) => {
    try {
      const createdRow = await DoctorService.crear(req.validated);
      return created(res, mapDoctorToDTO(createdRow));
    } catch (e) {
      next(e);
    }
  },

  update: async (req, res, next) => {
    try {
      const upd = await DoctorService.actualizar(req.params.id, req.validated);
      return ok(res, mapDoctorToDTO(upd));
    } catch (e) {
      next(e);
    }
  },

  remove: async (req, res, next) => {
    try {
      await DoctorService.eliminar?.(req.params.id);
      return noContent(res);
    } catch (e) {
      next(e);
    }
  },
};
