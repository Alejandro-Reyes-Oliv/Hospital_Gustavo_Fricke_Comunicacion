//Aca ira la logica para el envio de mensajes de recordatorio de cita medica
import cron from 'node-cron';
import { DateTime } from 'luxon';
import { prisma } from '../config/prisma.js';
import { enviarMensaje } from './sendMessageService.js';
import { obtenerDatosCita } from './confirmationMessageService.js';
import { rellenadoDatosRecordatorio } from '../../../bot-gateway/templates/recordatorioTemplate.js';
process.loadEnvFile('../../../.env');
const REMINDER_CRON = process.env.REMINDER_CRON
const TZ = 'America/Santiago';
function fmtCL(jsDate) {
  return DateTime.fromJSDate(jsDate).setZone(TZ).toFormat('dd/LL/yyyy HH:mm');
}
// corre todos los días a las 12:00:00 (seg min hora ...)
async function job() {
    try{ 
        const target = DateTime.now().setZone(TZ).plus({ days: 7 }).toISODate(); // YYYY-MM-DD
        const citas = await prisma.$queryRaw`
            SELECT * FROM public."Cita"
            WHERE (fecha_hora AT TIME ZONE 'America/Santiago')::date = ${target}::date
            AND estado = 'confirmada'
        `;
        
        for (const c of citas) {
            const datosCita = await obtenerDatosCita([c.id]);
            if (datosCita.length != 0) {
                await prisma.cita.update({
                            where: {id : datosCita[0].id}, //Buscar la cita por ID y por el wamid del mensaje al que se responde
                            data: { estado: "recordado" }
                        });
                const payload = rellenadoDatosRecordatorio(datosCita[0].paciente_nombre, datosCita[0].fecha_hora[0], datosCita[0].fecha_hora[1], datosCita[0].especialidad_snap, datosCita[0].paciente_telefono); 
                await enviarMensaje(payload);
            };

            
        };
    }catch (error) {
        console.error("Error en job de recordatorio de citas:", error);
    }
}
export function startReminderScheduler() {
  const expr = process.env.REMINDER_CRON;
  return cron.schedule(expr, job, { timezone: TZ });
}

export { job as runReminderOnce };