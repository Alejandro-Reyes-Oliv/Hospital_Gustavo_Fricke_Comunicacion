import { CitaService } from "../services/cita.service.js";
import { prisma } from "../config/prisma.js";
import { mapCitaToDTO } from "../contracts/dto.mappers.js";
import { ok, created, noContent, pageOut } from "../contracts/http.js";
import {sendTemplate} from '../../../bot-gateway/Prueba-04.js'
import { enviarRecordatorio } from "../../../bot-gateway/Prueba-05.js"; 
import { obtenerDatosCita } from "../services/confirmationMessageService.js";
import { sendConfirmation } from "../../../bot-gateway/templates/confirmTemplate.js";

const normalizeSort = (sort) => {
  const [campo, dir] = String(sort || "fechaCita:asc").split(":");
  const map = { fechaCita: "fecha_hora", nombrePaciente: "paciente_nombre" };
  const col = map[campo] || "fecha_hora";
  return { [col]: dir === "desc" ? "desc" : "asc" };
};

export const AppointmentsContractController = {
  list: async (req, res, next) => {
    try {
      const { search, estado, medicoId, from, to, page = 1, pageSize = 1000, sort = "fechaCita:asc" } = req.query;
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
  
  //-----------------------------------------Envio de Mensaje a traves del boton-------------------------------------------
  //Funcion que se ejecuta al presionar el boton de enviar bot
  //Entradas: req.body.ids = [id1, id2, id3...]  (Array de id's de las citas)

  sendBot: async (req, res, next) => {
    //console.warn('Entro en el controlador de citas')
    //console.log('req.body:', req.body)
    const { ids = []} = req.body; // Aca se guardan el o los id's de las citas que entran a la funcion (Ya que el front solo manda las id's)
    //console.log('ids:', ids)
    
    //El req.body trae el/los ID's de las citas, por lo que tocara ir a obtener los datos de las citas a la DB
    //llamar a funcion de confirmationMessageController para obtener los datos y enviar el mensaje
    
    try{
      const datosCitas = await obtenerDatosCita(ids)
      //console.log('datos del obetenDatosCita:', datosCitas)
      //console.log('nombre paciente: ', datosCitas[0].paciente_nombre)
      //Llamar a controlador, el cual va a buscar los datos a la DB y luego enviar el mensaje
      //await enviarRecordatorio(ids);
      
      await sendConfirmation(datosCitas);
      
      
      //console.log('id de mensaje enviado y id de cita:', wamid_envio, idCita)
      //console.log('Entro en el controlador---------------------------------')
    }catch(e){
      res.status(400).json({ ok: false, error: e.message });
      //console.log('No entro en el controlador')
    }
  }
}
