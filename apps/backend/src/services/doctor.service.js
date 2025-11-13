// apps/backend/src/services/doctor.service.js
import { prisma } from "../config/prisma.js";
import {
  enviarAvisoCancelacion,
  normalizaTelefonoCL,
} from "../../../bot-gateway/templates/reagendar.js";

// helper: distintas formas de "false"
function isFalseyFlag(value) {
  if (value === false) return true;
  if (value === 0) return true;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["false", "0", "no", "off"].includes(v)) return true;
    if (["inactivo", "inactive", "disabled"].includes(v)) return true;
  }
  return false;
}

// decide si este PATCH quiere deshabilitar al doctor
function wantsDeactivate(data) {
  if (!data || typeof data !== "object") return false;

  if ("activo" in data && isFalseyFlag(data.activo)) return true;
  if ("is_active" in data && isFalseyFlag(data.is_active)) return true;
  if ("enabled" in data && isFalseyFlag(data.enabled)) return true;
  if ("disabled" in data && isFalseyFlag(data.disabled)) return true;

  if (typeof data.estado === "string" && isFalseyFlag(data.estado)) return true;
  if (typeof data.status === "string" && isFalseyFlag(data.status)) return true;

  return false;
}

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
   *
   * - Si el payload representa "deshabilitar" (activo=false, is_active=false, estado='inactivo', etc),
   *   delega en eliminar():
   *      • desactiva doctor
   *      • cancela citas futuras
   *      • envía WhatsApp
   * - Si no, hace un update normal.
   */
  actualizar: async (id, data) => {
    const doctorId = Number(id);

    if (wantsDeactivate(data)) {
      console.log(
        `[DoctorService.actualizar] detectado deshabilitar via PATCH, delegando en eliminar (doctorId=${doctorId}, body=${JSON.stringify(
          data
        )})`
      );

      // si vienen otros campos aparte de "activo"/"estado"/etc., los persistimos antes
      const {
        activo,
        is_active,
        enabled,
        disabled,
        estado,
        status,
        ...rest
      } = data;
      if (Object.keys(rest).length > 0) {
        await prisma.doctor.update({
          where: { id: doctorId },
          data: rest,
        });
      }

      return DoctorService.eliminar(doctorId);
    }

    // PATCH normal (sin deshabilitar)
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

    // 1) Snapshot del doctor
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
      `[DoctorService.eliminar] doctorId=${doctorId}, citas marcadas canceladas=${citas.length}`
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
          `[DoctorService.eliminar] WhatsApp OK citaId=${c.id}, to=${to}, wamid=${wamid}`
        );
      } catch (err) {
        fallidos++;
        console.error(
          `[DoctorService.eliminar] WhatsApp FAIL citaId=${c.id}, to=${to}, error=${String(
            err?.message || err
          )}`
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
      `[DoctorService.eliminar] doctorId=${doctorId}, enviados=${enviados}, fallidos=${fallidos}`
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
*/