import { prisma } from "../config/prisma.js";
import { RecordatorioService } from "./recordatorio.service.js";

export const CitaService = {
  listar: async ({ desde, hasta, doctorId, estado, q, limit = 20, offset = 0, order = "fecha_hora:asc" }) => {
    const [campo, dir] = order.split(":");
    const where = {
      AND: [
        desde ? { fecha_hora: { gte: new Date(desde) } } : {},
        hasta ? { fecha_hora: { lte: new Date(hasta) } } : {},
        doctorId ? { doctorId: Number(doctorId) } : {},
        estado ? { estado } : {},
        q ? {
          OR: [
            { paciente_nombre: { contains: q, mode: "insensitive" } },
            { paciente_rut: { contains: q, mode: "insensitive" } },
            { paciente_telefono: { contains: q, mode: "insensitive" } }
          ]
        } : {}
      ]
    };
    return prisma.cita.findMany({
      where,
      orderBy: { [campo || "fecha_hora"]: (dir === "desc" ? "desc" : "asc") },
      take: Number(limit),
      skip: Number(offset)
    });
  },

  oftener: (id) =>
    prisma.cita.findUnique({ where: { id: Number(id) } }),

  crear: async (data) => {
    // 1) verificar doctor
    const doctor = await prisma.doctor.findUnique({ where: { id: data.doctorId } });
    if (!doctor) {
      const err = new Error("Doctor no existe");
      err.status = 404;
      throw err;
    }

    // 2) evitar doble-booking exacto
    const choque = await prisma.cita.findFirst({
      where: { doctorId: data.doctorId, fecha_hora: new Date(data.fecha_hora) }
    });
    if (choque) {
      const err = new Error("El doctor ya tiene una cita en ese horario.");
      err.status = 409;
      throw err;
    }

    // 3) crear cita con snapshots
    const estado = (data.estado ?? "pendiente").toLowerCase();
    console.log("datos entrantes a la base de datos con los datos de la cita", data.fecha_hora)
    const fecha_hora_array = data.fecha_hora.split('T');
    const cita = await prisma.cita.create({
    
      data: {
        doctorId: data.doctorId,
        fecha_hora: fecha_hora_array[0] + ' ' + fecha_hora_array[1],
        estado,
        paciente_nombre: data.paciente_nombre,
        paciente_telefono: data.paciente_telefono,
        paciente_rut: data.paciente_rut ?? null,
        doctor_nombre_snap: doctor.nombre,
        especialidad_snap: doctor.especialidad ?? null
      }
    });

    // 4) programar recordatorios automáticos
    await RecordatorioService.planificarAutomaticos(cita);

    return cita;
  },

  actualizar: async (id, data) => {
    const citaId = Number(id);
    const citaActual = await prisma.cita.findUnique({ where: { id: citaId } });
    if (!citaActual) {
      const err = new Error("Cita no encontrada");
      err.status = 404;
      throw err;
    }

    // Si cambian doctor/fecha, validar
    let nuevoDoctorId = data.doctorId ?? citaActual.doctorId;
    let nuevaFecha = data.fecha_hora ? new Date(data.fecha_hora) : citaActual.fecha_hora;

    if (data.doctorId || data.fecha_hora) {
      const choque = await prisma.cita.findFirst({
        where: { doctorId: nuevoDoctorId, fecha_hora: nuevaFecha, NOT: { id: citaId } }
      });
      if (choque) {
        const err = new Error("El doctor ya tiene una cita en ese horario.");
        err.status = 409;
        throw err;
      }
    }

    // Si cambió el doctor, refrescar snapshots (opcional)
    let updateData = { ...data };
    if (data.doctorId) {
      const d = await prisma.doctor.findUnique({ where: { id: data.doctorId } });
      if (!d) {
        const err = new Error("Doctor no existe");
        err.status = 404;
        throw err;
      }
      updateData.doctor_nombre_snap = d.nombre;
      updateData.especialidad_snap = d.especialidad ?? null;
    }

    const cita = await prisma.cita.update({
      where: { id: citaId },
      data: {
        doctorId: nuevoDoctorId,
        fecha_hora: nuevaFecha,
        estado: data.estado ?? citaActual.estado,
        paciente_nombre: data.paciente_nombre ?? citaActual.paciente_nombre,
        paciente_telefono: data.paciente_telefono ?? citaActual.paciente_telefono,
        paciente_rut: data.paciente_rut ?? citaActual.paciente_rut,
        doctor_nombre_snap: updateData.doctor_nombre_snap ?? citaActual.doctor_nombre_snap,
        especialidad_snap: updateData.especialidad_snap ?? citaActual.especialidad_snap
      }
    });

    // Reprogramar recordatorios pendientes si cambió fecha/doctor
    if (data.fecha_hora || data.doctorId) {
      await RecordatorioService.reprogramarPendientesDeCita(cita);
    }

    return cita;
  }
};
