// apps/backend/src/controllers/bot.controller.js
import * as service from '../services/bot.service.js';
import { cambiarEstadoCita, cambiarEstadoMensaje } from '../services/confirmationMessageService.js';
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
export async function ingestEvent(req, res) {
  
  try {
    console.log("body que entra en el controller", req.body, " -------------------------------------")
    
    //const from = req.body.entry[0].changes[0].value.messages[0].from;
    //const reply = req.body.entry[0].changes[0].value.messages[0].button.payload.toLowerCase();
    //const wamid = req.body.entry[0].changes[0].value.messages[0].id;
    //const wamid_contexto = req.body.entry[0].changes[0].value.messages[0].context.id
    //const timestamp = req.body.entry[0].changes[0].value.messages[0].timestamp;
    //console.log("Datos que llegan al backend desde el gateway: ", { from, reply, wamid, timestamp })
    //await cambiarEstadoCita(wamid_contexto, reply)

    //Aca debo colocar la logica en caso de que lo que envie el webhook sea un status
    if (req.body.entry[0].changes[0].value.statuses) {
      console.log("Es un status lo que llega al backend");
      console.log("Status recibido en el controller: ", req.body.entry[0].changes[0].value.statuses[0].status);
      console.log("Wamid del mensaje cuyo status se esta recibiendo: ", req.body.entry[0].changes[0].value.statuses[0].id);
      console.log("Datos completos del status recibido: ", req.body.entry[0].changes[0].value);
      const wamid_enviado = req.body.entry[0].changes[0].value.statuses[0].id;
      const estado = req.body.entry[0].changes[0].value.statuses[0].status;
      console.log("Datos para cambiar estado del mensaje en la DB: ", { wamid_enviado, estado });
      await cambiarEstadoMensaje(wamid_enviado, estado)
    }
    
    
    //Esta parte es de si hay contexto, es decir, si el usuario esta respondiendo a un mensaje enviado por el bot
    //await service.processInboundEvent(req.body);
    if(req.body.entry[0].changes[0].value.messages){
      console.log("Es una respuesta lo que llega al backend");
      const wamid_contexto = req.body.entry[0].changes[0].value.messages[0].context.id
      const reply = req.body.entry[0].changes[0].value.messages[0].button.payload.toLowerCase();
      await cambiarEstadoCita(wamid_contexto, reply)
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
