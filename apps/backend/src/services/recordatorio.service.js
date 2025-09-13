import { prisma } from "../config/prisma.js";

// util para restar tiempo
function restar(fecha, { meses = 0, semanas = 0, dias = 0 }) {
  const d = new Date(fecha);
  if (meses) d.setMonth(d.getMonth() - meses);
  if (semanas) d.setDate(d.getDate() - (semanas * 7));
  if (dias) d.setDate(d.getDate() - dias);
  return d;
}

export const RecordatorioService = {
  planificarAutomaticos: async (cita) => {
    const fh = new Date(cita.fecha_hora);
    const items = [
      { tipo: "6m", programado_para: restar(fh, { meses: 6 }) },
      { tipo: "1m", programado_para: restar(fh, { meses: 1 }) },
      { tipo: "1w", programado_para: restar(fh, { semanas: 1 }) },
      { tipo: "1d", programado_para: restar(fh, { dias: 1 }) }
    ];
    await prisma.citaRecordatorio.createMany({
      data: items.map(i => ({
        citaId: cita.id,
        tipo: i.tipo,
        programado_para: i.programado_para,
        estado: "pendiente"
      }))
    });
  },

  listarPorCita: (citaId) =>
    prisma.citaRecordatorio.findMany({
      where: { citaId: Number(citaId) },
      orderBy: { programado_para: "asc" }
    }),

  reprogramarPendientesDeCita: async (cita) => {
    // recalcular fechas y actualizar SOLO los pendientes
    const fh = new Date(cita.fecha_hora);
    const nuevos = {
      "6m": restar(fh, { meses: 6 }),
      "1m": restar(fh, { meses: 1 }),
      "1w": restar(fh, { semanas: 1 }),
      "1d": restar(fh, { dias: 1 })
    };

    const pendientes = await prisma.citaRecordatorio.findMany({
      where: { citaId: cita.id, estado: "pendiente" }
    });

    await Promise.all(pendientes.map(rec =>
      prisma.citaRecordatorio.update({
        where: { id: rec.id },
        data: { programado_para: nuevos[rec.tipo] ?? rec.programado_para }
      })
    ));
  }
};
