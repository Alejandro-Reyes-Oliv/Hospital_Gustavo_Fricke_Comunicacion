// apps/backend/src/services/doctor.service.js
import { prisma } from "../config/prisma.js";

export const DoctorService = {
  listar: async ({
    q,
    especialidad,
    activo,
    limit = 20,
    offset = 0,
    order = "nombre:asc",
  }) => {
    const [campo, dir] = order.split(":");
    return prisma.doctor.findMany({
      where: {
        AND: [
          q
            ? { nombre: { contains: q, mode: "insensitive" } }
            : {},
          especialidad ? { especialidad } : {},
          typeof activo === "boolean" ? { activo } : {},
        ],
      },
      take: Number(limit),
      skip: Number(offset),
      orderBy: {
        [campo || "nombre"]: dir === "desc" ? "desc" : "asc",
      },
    });
  },

  obtener: (id) =>
    prisma.doctor.findUnique({
      where: { id: Number(id) },
    }),

  crear: (data) =>
    prisma.doctor.create({
      data,
    }),

  /**
   * PATCH /api/doctors/:id
   * Si el payload incluye activo=false, reutilizamos el flujo de eliminar:
   *   - desactiva doctor
   *   - cancela citas futuras
   *   - envía mensajes (lo que ya hace eliminar)
   */
  actualizar: async (id, data) => {
    const doctorId = Number(id);

    // Si explícitamente piden dejarlo inactivo, reutilizamos eliminar()
    if (
      Object.prototype.hasOwnProperty.call(data, "activo") &&
      data.activo === false
    ) {
      console.log(
        `[DoctorService.actualizar] detectado activo=false, delegando en eliminar (doctorId=${doctorId})`
      );
      // Opcionalmente podrías hacer un update previo con otros campos:
      // await prisma.doctor.update({ where: { id: doctorId }, data });
      return DoctorService.eliminar(doctorId);
    }

    // Update normal (no cambia activo => no cancelamos citas)
    return prisma.doctor.update({
      where: { id: doctorId },
      data,
    });
  },

  /**
   * Soft-delete de doctor:
   * - pone doctor.activo = false
   * - cancela TODAS las citas FUTURAS no-canceladas de ese doctor
   * - (ya estás viendo que además manda el mensaje 👌)
   */
  eliminar: async (id) => {
    const doctorId = Number(id);
    const ahora = new Date();

    // 1) Desactivar el doctor
    await prisma.doctor.update({
      where: { id: doctorId },
      data: { activo: false },
    });

    // 2) Cancelar citas FUTURAS no canceladas
    const result = await prisma.cita.updateMany({
      where: {
        doctorId: doctorId,
        estado: { not: "cancelada" },
        fecha_hora: { gt: ahora },
      },
      data: {
        estado: "cancelada",
      },
    });

    console.log(
      `[DoctorService.eliminar] doctorId=${doctorId}, citas canceladas=${result.count}`,
    );

    return { ok: true, doctorId, canceladas: result.count };
  },
};

