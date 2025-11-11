process.loadEnvFile('../.env');

import { CitaService } from "../services/cita.service.js";
import { prisma } from "../config/prisma.js";
import { mapCitaToDTO } from "../contracts/dto.mappers.js";
import { ok, created, noContent, pageOut } from "../contracts/http.js";
//import {sendTemplate} from '../../../bot-gateway/Prueba-04.js'
//import { enviarRecordatorio } from "../../../bot-gateway/Prueba-05.js"; 
import { obtenerDatosCita } from "../services/confirmationMessageService.js";
//import { sendConfirmation } from "../../../bot-gateway/templates/confirmTemplate.js";
import { rellenadoDatos } from "../../../bot-gateway/templates/confirmTemplate.js";
import { asociarMensajeCita } from "../services/confirmationMessageService.js";
import { Prisma } from "@prisma/client";



const normalizeSort = (sort) => {
  const [campo, dir] = String(sort || "fechaCita:asc").split(":");
  const map = { fechaCita: "fecha_hora", nombrePaciente: "paciente_nombre" };
  const col = map[campo] || "fecha_hora";
  return { [col]: dir === "desc" ? "desc" : "asc" };
};

//Listar citas con filtros avanzados (las pasadas al final)
export const AppointmentsContractController = {
  list: async (req, res, next) => {
    try {
<<<<<<< Updated upstream
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
=======
      // params actuales que ya recibes
      const {
        search, estado, medicoId, from, to,
        page = 1, pageSize = 1000,
      } = req.query;

      const take = Number(pageSize);
      const skip = (Number(page) - 1) * take;

      // WHERE dinámico
      const conds = [Prisma.sql`1=1`];

      if (from) {
        conds.push(Prisma.sql`"fecha_hora" >= ${new Date(from)}`);
      }
      if (to) {
        conds.push(Prisma.sql`"fecha_hora" <= ${new Date(to)}`);
      }
      if (medicoId) {
        conds.push(Prisma.sql`"doctorId" = ${Number(medicoId)}`);
      }
      if (estado) {
        conds.push(Prisma.sql`"estado" = ${estado}`);
      }
      if (search) {
        const like = `%${search}%`;
        conds.push(
          Prisma.sql`(
            "paciente_nombre" ILIKE ${like} OR
            "paciente_rut" ILIKE ${like} OR
            "paciente_telefono" ILIKE ${like}
          )`
        );
      }

      const whereSql = Prisma.sql`WHERE ${Prisma.join(conds, ' AND ')}`;

      // 1) filas ordenadas: futuras primero, pasadas al final; luego por fecha asc
      const rows = await prisma.$queryRaw(Prisma.sql`
        SELECT
          "id", "doctorId", "fecha_hora", "estado",
          "paciente_nombre", "paciente_rut", "paciente_telefono",
          "doctor_nombre_snap", "especialidad_snap",
          "creadoEn", "actualizadoEn"
        FROM "Cita"
        ${whereSql}
        ORDER BY ("fecha_hora" < NOW()) ASC, "fecha_hora" ASC
        LIMIT ${take} OFFSET ${skip};
      `);

      // 2) total para paginación
      const countRes = await prisma.$queryRaw(Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM "Cita"
        ${whereSql};
      `);
      const total = Array.isArray(countRes) ? countRes[0]?.count ?? 0 : 0;

      // Usa tu mapper/HTTP helper actual
      return ok(
        res,
        pageOut({
          data: rows.map(mapCitaToDTO),
          page: Number(page),
          pageSize: take,
          total,
        })
      );
>>>>>>> Stashed changes
    } catch (e) {
      next(e);
    }
  },

  create: async (req, res, next) => {
    //console.log("Hora antes de enviarlo a la base de datos: ", req.body.fechaCita);
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
    const { WSP_TOKEN, GRAPH_BASE } = process.env;

    try{
      const { ids = []} = req.body; // Aca se guardan el o los id's de las citas que entran a la funcion (Ya que el front solo manda las id's)
      const datosCitas = await obtenerDatosCita(ids) //Llamar a la funcion que obtiene los datos de la cita a traves de las ids entrantes
      
      //await sendConfirmation(datosCitas);

      //Separacion de responsabilidades: El controller llama al service para obtener los datos y luego llama a la template para enviar el mensaje
      //console.log('Datos para enviar confirmacion:', datosCitas)
      //To Do: Hacer el arbol de decisiones para enviar diferentes tipos de plantillas segun el estado de la cita (Confirmada, Cancelada, Recordatorio, etc)
      
      //- - - - - - - - - - - - - - - - - - - - - - - Envio de mensaje de confirmacion de cita - - - - - - - - - - - - - - - - - - - 
      datosCitas.forEach(async cita => {  //Aca se itera por cada cita en el array de citas para enviar el mensaje individualmente
            const response = await fetch(`${GRAPH_BASE}/messages`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${WSP_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: rellenadoDatos(cita.paciente_nombre, cita.fecha_hora[0], cita.fecha_hora[1], cita.paciente_telefono)
            
        
            });
          
            const data = await response.json();
            console.log("Respuesta de Meta: al enviar plantilla", data);
            //Con la data se puede guardar el ID del mensaje enviado en la base de datos de las citas para asociar el id y el mensaje
            const wamid_envio = data.messages[0].id;
            const idCita = cita.id; //Aca se obtiene la id de la cita actual en la iteracion
            //Llamar a la funcion para guardar el ID del mensaje enviado en la DB
            await asociarMensajeCita(wamid_envio, idCita);
          });
      
      
    }catch(e){
      res.status(400).json({ ok: false, error: e.message });
    }
  }
}
