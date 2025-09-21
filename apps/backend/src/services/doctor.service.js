import { prisma } from "../config/prisma.js";

export const DoctorService = {
  listar: async ({ q, especialidad, activo, limit = 20, offset = 0, order = "nombre:asc" }) => {
    const [campo, dir] = order.split(":");
    return prisma.doctor.findMany({
      where: {
        AND: [
          q ? { nombre: { contains: q, mode: "insensitive" } } : {},
          especialidad ? { especialidad } : {},
          typeof activo === "boolean" ? { activo } : {}
        ]
      },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { [campo || "nombre"]: (dir === "desc" ? "desc" : "asc") }
    });
  },

  obtener: (id) => prisma.doctor.findUnique({ where: { id: Number(id) } }),

  crear: (data) => prisma.doctor.create({ data }),

  actualizar: (id, data) =>
    prisma.doctor.update({ where: { id: Number(id) }, data }),

  // si algún día habilitas borrado duro:
  eliminar: (id) => prisma.doctor.update({ where: { id: Number(id) }, data: { activo: false } }),
};
