import { prisma } from "../config/prisma.js";
import { enviarTexto } from "../../../bot-gateway/Prueba-05.js";

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

  // Soft delete + cancelar citas + avisar por WhatsApp
  eliminar: async (id) => {
    //Al presionar el boton de eliminar doctor
    //Se buscaran las citas asociadas a ese doctor
    //Se cambiara el estado de las citas a cancelada (en este paso es complicado diferenciar si se cancelo por parte del operador o del paciente, a menos que el envio de mensaje este descentralizado)
    //Se enviara un mensaje a los pacientes informandoles de la cancelacion de la cita
  }  
    
}  
  /*
    const doctorId = Number(id);

    // 1) Traer snapshot del doctor (para fallback de especialidad)
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new Error("Doctor no encontrado");

    const ahora = new Date();

    // 2) Traer citas objetivo (futuras o no-canceladas)
    const citas = await prisma.cita.findMany({
      where: {
        doctorId,
        OR: [
          { fecha_hora: { gt: ahora } },              // futuras
          { estado: { not: "cancelada" } }            // o simplemente no-canceladas
        ]
      },
      select: {
        id: true,
        paciente_telefono: true,
        especialidad_snap: true,
        fecha_hora: true
      }
    });

    // 3) Transacción: desactivar doctor + marcar citas canceladas
    await prisma.$transaction(async (tx) => {
      await tx.doctor.update({
        where: { id: doctorId },
        data: { activo: false }
      });

      if (citas.length > 0) {
        await tx.cita.updateMany({
          where: { id: { in: citas.map(c => c.id) } },
          data: { estado: "cancelada" }
        });
      }
    });

    // 4) Enviar mensajes y registrar BotMessage (fuera de la transacción)
    //    (si falla algún envío, no revertimos el soft delete)
    for (const c of citas) {
      const to = normalizaTelefonoCL(c.paciente_telefono);
      const especialidad = c.especialidad_snap || doctor.especialidad || "su especialidad";

      const texto = `Su cita en especialidad ${especialidad} ha sido cancelada, por favor contactar hospital.`;

      try {
        const { wamid } = await enviarTexto({ to, body: texto });

        // Registrar OUTBOUND en BotMessage
        await prisma.botMessage.create({
          data: {
            citaId: c.id,
            direction: "OUTBOUND",
            provider: "whatsapp",
            providerMessageId: wamid,
            toPhone: to,
            text: texto,
            payload: { type: "text.cancel_doctor" }, // etiqueta mínima para trazabilidad
            status: "PENDING" // (con tu enum: PENDING/DELIVERED/REPLIED/FAILED)
          }
        });
      } catch (err) {
        // Si falla el envío, dejamos evidencia
        await prisma.botMessage.create({
          data: {
            citaId: c.id,
            direction: "OUTBOUND",
            provider: "whatsapp",
            providerMessageId: null,
            toPhone: to,
            text: texto,
            payload: { type: "text.cancel_doctor", error: String(err?.message || err) },
            status: "FAILED"
          }
        });
      }
    }

    // devuelve algo simple
    return { ok: true, canceladas: citas.length };
  }
};

// util local mínima (mismo criterio que tu servicio de bot)
function normalizaTelefonoCL(raw) {
  const n = String(raw ?? "").replace(/[^\d]/g, "");
  if (!n) throw new Error("Teléfono inválido");
  if (n.startsWith("56")) return `+${n}`;
  if (n.length === 9) return `+56${n}`;
  return `+${n}`;
}
*/



/* Version antigua, sin la cadena de envio de mensaje si se eliminan las citas
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
*/