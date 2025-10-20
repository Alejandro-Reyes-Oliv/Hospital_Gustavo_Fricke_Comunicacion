// apps/backend/src/controllers/bot.controller.js
import * as service from '../services/bot.service.js';

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

export async function ingestEvent(req, res) {
  try {
    await service.processInboundEvent(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error('ingestEvent error:', err);
    res.status(400).json({ ok: false, error: err.message });
  }
}

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

//-----------------------------------------Rellenado de mensajes del bot-------------------------------------------
//Funcion que obtiene el o los id's de las citas y va a buscar los datos a la DB para llenar el mensaje
/*
export async function rellenadoMensajes(req, res) {
  try{

  }catch(e){
    
  }
}
*/