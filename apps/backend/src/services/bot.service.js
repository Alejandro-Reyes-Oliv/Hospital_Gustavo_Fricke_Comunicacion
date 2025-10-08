import { prisma } from "../config/prisma.js";
import { enviarRecordatorio } from "../../../bot-gateway/Prueba-05.js";

function toE164Cl(raw) {
  const n = String(raw).replace(/[^\d]/g, "");
  if (n.startsWith("56")) return `+${n}`;
  if (n.length === 9) return `+56${n}`;
  return `+${n}`;
}
function formatCL(dt) {
  const fechaStr = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  }).format(dt);
  const horaStr  = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(dt);
  return { fechaStr, horaStr };
}

/**
 * Enviar recordatorio para UNA cita (por id)
 */
export async function sendReminderForCita(id) {
  const c = await prisma.cita.findUnique({
    where: { id },
    select: {
      id: true,
      fecha_hora: true,
      paciente_nombre: true,
      paciente_telefono: true,
      especialidad_snap: true,
      // si se agrega algún campo de lugar/box, agregar aquí y usarlo abajo
      // lugar_snap: true,
    },
  });
  if (!c) throw new Error("Cita no encontrada");

  const to = toE164Cl(c.paciente_telefono);
  const { fechaStr, horaStr } = formatCL(new Date(c.fecha_hora));

  await enviarRecordatorio({
    to,
    citaId: c.id,
    params: {
      pacienteNombre: c.paciente_nombre || "Paciente",
      especialidad:   c.especialidad_snap || "Colonoscopía",
      fechaStr,
      horaStr,
      lugar:          "Hospital Gustavo Fricke – Endoscopía", // o c.lugar_snap si existe
    },
  });
}

/**
 * Enviar recordatorios para VARIAS citas (ids[])
 * (Esta es la que normalmente usará el endpoint /api/bot/send)
 */
export async function sendRemindersForCitas(ids = []) {
  const report = [];
  for (const id of ids) {
    try {
      await sendReminderForCita(id);
      report.push({ id, ok: true });
      await new Promise(r => setTimeout(r, 250)); // evita ráfagas
    } catch (err) {
      console.error("[sendRemindersForCitas]", id, err.message);
      report.push({ id, ok: false, error: err.message });
    }
  }
  return report;
}

