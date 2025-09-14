import { DoctorService } from "../services/doctor.service.js";

export const DoctorController = {
  listar: async (req, res, next) => {
    try {
      const { q, especialidad, activo, limit, offset, order } = req.query;
      const parsedActivo = typeof activo === "string" ? activo === "true" : undefined;
      const data = await DoctorService.listar({
        q, especialidad, activo: parsedActivo, limit, offset, order
      });
      res.json(data);
    } catch (e) { next(e); }
  },

  obtener: async (req, res, next) => {
    try {
      const doctor = await DoctorService.obtener(req.params.id);
      if (!doctor) return res.status(404).json({ error: "No encontrado" });
      res.json(doctor);
    } catch (e) { next(e); }
  },

  crear: async (req, res, next) => {
    try {
      const doctor = await DoctorService.crear(req.validated);
      res.status(201).json(doctor);
    } catch (e) { next(e); }
  },

  actualizar: async (req, res, next) => {
    try {
      const doctor = await DoctorService.actualizar(req.params.id, req.validated);
      res.json(doctor);
    } catch (e) { next(e); }
  }
};
