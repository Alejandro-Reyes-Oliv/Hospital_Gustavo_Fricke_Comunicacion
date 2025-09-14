import { CitaService } from "../services/cita.service.js";
import { RecordatorioService } from "../services/recordatorio.service.js";

export const CitaController = {
  listar: async (req, res, next) => {
    try {
      const { desde, hasta, doctorId, estado, q, limit, offset, order } = req.query;
      const data = await CitaService.listar({ desde, hasta, doctorId, estado, q, limit, offset, order });
      res.json(data);
    } catch (e) { next(e); }
  },

  obtener: async (req, res, next) => {
    try {
      const cita = await CitaService.obtener(req.params.id);
      if (!cita) return res.status(404).json({ error: "No encontrada" });
      res.json(cita);
    } catch (e) { next(e); }
  },

  crear: async (req, res, next) => {
    try {
      const cita = await CitaService.crear(req.validated);
      res.status(201).json(cita);
    } catch (e) { next(e); }
  },

  actualizar: async (req, res, next) => {
    try {
      const cita = await CitaService.actualizar(req.params.id, req.validated);
      res.json(cita);
    } catch (e) { next(e); }
  },

  listarRecordatorios: async (req, res, next) => {
    try {
      const lista = await RecordatorioService.listarPorCita(req.params.id);
      res.json(lista);
    } catch (e) { next(e); }
  },

  // cambiarEstado: async (req,res,next)=>{ ... }
};
