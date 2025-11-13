import { prisma } from "../config/prisma.js";
import { ok, created, noContent, pageOut } from "../contracts/http.js";
import { mapPacienteToDTO } from "../contracts/dto.mappers.js";

export const PatientsContractController = {
  list: async (req, res, next) => {
    try {
      const { search, page = 1, pageSize = 20, sort = "nombre:asc" } = req.query;
      const [campo, dir] = String(sort).split(":");
      const skip = (Number(page) - 1) * Number(pageSize);
      const where = search
        ? {
            OR: [
              { nombre: { contains: search, mode: "insensitive" } },
              { rut: { contains: search, mode: "insensitive" } },
              { telefono: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};
      const [rows, total] = await Promise.all([
        prisma.paciente.findMany({
          where,
          take: Number(pageSize),
          skip,
          orderBy: { [campo || "nombre"]: dir === "desc" ? "desc" : "asc" },
        }),
        prisma.paciente.count({ where }),
      ]);
      return ok(res, pageOut({ data: rows.map(mapPacienteToDTO), page: Number(page), pageSize: Number(pageSize), total }));
    } catch (e) {
      next(e);
    }
  },

  create: async (req, res, next) => {
    try {
      const createdRow = await prisma.paciente.create({ data: req.validated });
      return created(res, mapPacienteToDTO(createdRow));
    } catch (e) {
      next(e);
    }
  },

  update: async (req, res, next) => {
    try {
      const upd = await prisma.paciente.update({ where: { id: Number(req.params.id) }, data: req.validated });
      return ok(res, mapPacienteToDTO(upd));
    } catch (e) {
      next(e);
    }
  },

  remove: async (req, res, next) => {
    try {
      await prisma.paciente.delete({ where: { id: Number(req.params.id) } });
      return noContent(res);
    } catch (e) {
      next(e);
    }
  },
};