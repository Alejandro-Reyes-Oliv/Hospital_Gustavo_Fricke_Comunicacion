import { CitaService } from "../services/cita.service.js";
import { prisma } from "../config/prisma.js";
import { mapCitaToDTO } from "../contracts/dto.mappers.js";
import { ok, created, noContent, pageOut } from "../contracts/http.js";

const normalizeSort = (sort) => {
  const [campo, dir] = String(sort || "fechaCita:asc").split(":");
  const map = { fechaCita: "fecha_hora", nombrePaciente: "paciente_nombre" };
  const col = map[campo] || "fecha_hora";
  return { [col]: dir === "desc" ? "desc" : "asc" };
};

export const AppointmentsContractController = {
  list: async (req, res, next) => {
    try {
      const { search, estado, medicoId, from, to, page = 1, pageSize = 20, sort = "fechaCita:asc" } = req.query;
      const where = {
        AND: [
          from ? { fecha_hora: { gte: new Date(from) } } : {},
          to ? { fecha_hora: { lte: new Date(to) } } : {},
          medicoId ? { doctorId: Number(medicoId) } : {},
          estado ? { estado } : {},
          search
            ? {
                OR: [
                  { paciente_nombre: { contains: search, mode: "insensitive" } },
                  { paciente_rut: { contains: search, mode: "insensitive" } },
                  { paciente_telefono: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      };
      const skip = (Number(page) - 1) * Number(pageSize);
      const [rows, total] = await Promise.all([
        prisma.cita.findMany({ where, take: Number(pageSize), skip, orderBy: normalizeSort(sort) }),
        prisma.cita.count({ where }),
      ]);
      return ok(res, pageOut({ data: rows.map(mapCitaToDTO), page: Number(page), pageSize: Number(pageSize), total }));
    } catch (e) {
      next(e);
    }
  },

  create: async (req, res, next) => {
    try {
      const { nombrePaciente, rut, telefono, fechaCita, medicoId, estadoCita } = req.validated;
      const createdRow = await CitaService.crear({
        doctorId: Number(medicoId),
        fecha_hora: fechaCita,
        paciente_nombre: nombrePaciente,
        paciente_telefono: telefono ?? null,
        paciente_rut: rut ?? null,
        estado: estadoCita ?? "pendiente",
      });
      return created(res, mapCitaToDTO(createdRow));
    } catch (e) {
      next(e);
    }
  },

  update: async (req, res, next) => {
    try {
      const { nombrePaciente, rut, telefono, fechaCita, medicoId, estadoCita } = req.validated;
      const upd = await CitaService.actualizar(req.params.id, {
        doctorId: medicoId != null ? Number(medicoId) : undefined,
        fecha_hora: fechaCita,
        paciente_nombre: nombrePaciente,
        paciente_telefono: telefono,
        paciente_rut: rut,
        estado: estadoCita,
      });
      return ok(res, mapCitaToDTO(upd));
    } catch (e) {
      next(e);
    }
  },

  bulkStatus: async (req, res, next) => {
    try {
      const { ids = [], estadoCita } = req.validated;
      const status = String(estadoCita || "").toLowerCase();
      if (!["pendiente", "confirmada", "cancelada"].includes(status)) {
        const err = new Error("Estado inválido");
        err.status = 400;
        err.code = "BAD_STATUS";
        throw err;
      }
      const idNums = ids.map(Number).filter(Boolean);
      const updated = await prisma.cita.updateMany({ where: { id: { in: idNums } }, data: { estado: status } });
      return ok(res, { data: { updated: updated.count } });
    } catch (e) {
      next(e);
    }
  },

  remove: async (req, res, next) => {
    try {
      await prisma.cita.delete({ where: { id: Number(req.params.id) } });
      return noContent(res);
    } catch (e) {
      next(e);
    }
  },
};
