import { prisma } from "../config/prisma.js";
import {
  enviarAvisoCancelacion,
  normalizaTelefonoCL,
} from "../../../bot-gateway/templates/reagendar.js";

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

  // PATCH normal: no toca citas ni envíos (el flujo fuerte es DELETE)
  actualizar: async (id, data) => {
    const doctorId = Number(id);
    return prisma.doctor.update({
      where: { id: doctorId },
      data,
    });
  },

  /**
   * DELETE /api/doctors/:id
   *
   * - pone doctor.activo = false
   * - cancela TODAS las citas FUTURAS no-canceladas de ese doctor
   * - envía WhatsApp de cancelación por cada cita
   */
  eliminar: async (id) => {
    const doctorId = Number(id);
    const ahora = new Date();

    // 1) Snapshot del doctor (para especialidad si la cita no tiene snapshot)
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new Error(`Doctor no encontrado (id=${doctorId})`);
    }

    // 2) Citas futuras no canceladas
    const citas = await prisma.cita.findMany({
      where: {
        doctorId: doctorId,
        estado: { not: "cancelada" },
        fecha_hora: { gt: ahora },
      },
      select: {
        id: true,
        paciente_telefono: true,
        especialidad_snap: true,
      },
    });

    // 3) Desactivar doctor + marcar citas canceladas (transacción)
    await prisma.$transaction(async (tx) => {
      await tx.doctor.update({
        where: { id: doctorId },
        data: { activo: false },
      });

      if (citas.length > 0) {
        await tx.cita.updateMany({
          where: { id: { in: citas.map((c) => c.id) } },
          data: { estado: "cancelada" },
        });
      }
    });

    console.log(
      `[DoctorService.eliminar] doctorId=${doctorId}, citas marcadas canceladas=${citas.length}`,
    );

    // 4) Enviar WhatsApp + registrar botMessage (fuera de la TX)
    let enviados = 0;
    let fallidos = 0;

    for (const c of citas) {
      const especialidad =
        c.especialidad_snap || doctor.especialidad || "su especialidad";
      const text = `Se informa que se ha cancelado su cita de especialidad ${especialidad}, por favor reagendar.`;

      let to = String(c.paciente_telefono || "");
      try {
        to = normalizaTelefonoCL(c.paciente_telefono);
        const { wamid } = await enviarAvisoCancelacion({
          to,
          especialidad,
        });

        // Registrar mensaje saliente
        await prisma.botMessage.create({
          data: {
            citaId: c.id,
            direction: "OUTBOUND",
            provider: "whatsapp",
            providerMessageId: wamid,
            toPhone: to,
            text,
            payload: { type: "text.cancel_doctor" },
            status: "PENDING",
          },
        });

        enviados++;
        console.log(
          `[DoctorService.eliminar] WhatsApp OK citaId=${c.id}, to=${to}, wamid=${wamid}`,
        );
      } catch (err) {
        fallidos++;
        console.error(
          `[DoctorService.eliminar] WhatsApp FAIL citaId=${c.id}, to=${to}, error=${String(
            err?.message || err,
          )}`,
        );

        await prisma.botMessage.create({
          data: {
            citaId: c.id,
            direction: "OUTBOUND",
            provider: "whatsapp",
            providerMessageId: null,
            toPhone: to,
            text,
            payload: {
              type: "text.cancel_doctor",
              error: String(err?.message || err),
            },
            status: "FAILED",
          },
        });
      }
    }

    console.log(
      `[DoctorService.eliminar] doctorId=${doctorId}, enviados=${enviados}, fallidos=${fallidos}`,
    );

    return {
      ok: true,
      doctorId,
      canceladas: citas.length,
      enviados,
      fallidos,
    };
  },
};
