// apps/backend/src/controllers/bot.controller.js
import { rellenadoDatosInformacion } from '../../../bot-gateway/templates/informationTemplate.js';
import { rellenadoDatosPacienteCancela } from '../../../bot-gateway/templates/pacienteCancelaTemplate.js';
import * as service from '../services/bot.service.js';
import { cambiarEstadoCita, cambiarEstadoMensaje, obtenerDatosCita, buscarCitaPorWamid } from '../services/confirmationMessageService.js';
import { styleText } from 'node:util';
import { enviarMensaje } from '../services/sendMessageService.js';
/*
export async function sendConfirmation(req, res) {
  try {
    const { citaId, toPhone } = req.body;
    if (typeof citaId !== 'number' || !toPhone) {
      return res.status(400).json({ ok: false, error: 'citaId (number) y toPhone son requeridos' });
    }
    const result = await service.sendConfirmation({ citaId, toPhone });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('sendConfirmation error:', err);
    res.status(400).json({ ok: false, error: err.message });
  }
}
*/

//----------------------------------------Ingreso de eventos desde el webhook-------------------------------------------
//Funcion que ingresa los eventos enviados por el webhook de Meta y realiza los cambios necesarios en la base de datos segun la respuesta //Nose que hacia antes esta funcion, pero la cambie
//Entradas: req.body = { objeto con la informacion enviada por el webhook }
//Salida: Respuesta JSON con ok: true o false y error en caso de fallo
export async function ingestEvent(req, res) {
  
  try {
    console.log("body que entra en el controller", req.body.entry[0], " -------------------------------------")
    

    //Aca debo colocar la logica en caso de que lo que envie el webhook sea un status
    if (req.body.entry[0].changes[0].value.statuses) {
      const wamid_enviado = req.body.entry[0].changes[0].value.statuses[0].id;
      const estado = req.body.entry[0].changes[0].value.statuses[0].status;
      //console.log("Datos para cambiar estado del mensaje en la DB: ", { wamid_enviado, estado });
      await cambiarEstadoMensaje(wamid_enviado, estado)
    }
    
    
    //Esta parte es de si hay contexto, es decir, si el usuario esta respondiendo a un mensaje enviado por el bot
    if(req.body.entry[0].changes[0].value.messages){
      
      const wamid_contexto = req.body.entry[0].changes[0].value.messages[0].context.id
      const reply = req.body.entry[0].changes[0].value.messages[0].button.payload.toLowerCase();
      console.log(styleText("bgGreen",`Es una respuesta lo que llega al backend ${reply}`));
      await cambiarEstadoCita(wamid_contexto, reply)
  
      //Para no complicar tanto el envio de otras plantillas, aca tomare la respuesta del paciente y segun cual sea se envia una u otra plantilla
      
      if (reply === 'asistiré'){
        //console.log(styleText("bgGreen", "El paciente ha confirmado la cita, se debe enviar plantilla de informacion"));
        let idCita = []
        idCita.push(Object.values(await buscarCitaPorWamid(wamid_contexto)));
        //console.log(styleText("bgRed", `ID de la cita obtenida para enviar plantilla de informacion: ${idCita}`));
        const datosCita = await obtenerDatosCita(idCita[0]);
        //console.log(styleText("bgBlue", `Datos de la cita obtenidos para enviar plantilla de informacion: ${datosCita[0].paciente_telefono}`));
        const payload = rellenadoDatosInformacion(datosCita[0].fecha_hora[0], datosCita[0].fecha_hora[1], datosCita[0].paciente_telefono);
        enviarMensaje(payload);
      }else if (reply === 'no asistiré'){
        //console.log(styleText("bgRed", "El paciente ha cancelado la cita, se debe enviar plantilla de cancelacion"));
        let idCita = []
        idCita.push(Object.values(await buscarCitaPorWamid(wamid_contexto)));
        //console.log(styleText("bgRed", `ID de la cita obtenida para enviar plantilla de cancelacion: ${idCita}`));
        const datosCita = await obtenerDatosCita(idCita[0]);
        //console.log(styleText("bgBlue", `Datos de la cita obtenidos para enviar plantilla de cancelacion: ${datosCita[0].paciente_telefono}`));
        const payload = rellenadoDatosPacienteCancela(datosCita[0].paciente_telefono);
        enviarMensaje(payload);
        //const payload = rellenadoDatosPacienteCancela(datosCita[0].paciente_telefono);
        //enviarMensaje(payload);
      }
      
    }

    

    res.json({ ok: true });
  } catch (err) {
    console.error('ingestEvent error:', err);
    res.status(400).json({ ok: false, error: err.message });
  }
  
}


/*
export async function listMessagesByCita(req, res) {
  try {
    const { citaId } = req.query;
    if (!citaId) return res.status(400).json({ ok: false, error: 'citaId requerido' });
    const items = await service.listMessages({ citaId: Number(citaId) });
    res.json({ ok: true, items });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
}

export async function getConfirmationState(req, res) {
  try {
    const citaId = Number(req.params.id);
    const data = await service.getConfirmation({ citaId });
    res.json({ ok: true, ...data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
}
*/

