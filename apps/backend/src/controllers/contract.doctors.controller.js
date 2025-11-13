import { DoctorService } from "../services/doctor.service.js";

function clog(...a) { console.log("[DoctorsController]", ...a); }

export const DoctorsContractController = {
  list: async (req, res, next) => {
    try {
      const result = await DoctorService.listar(req.query || {});
      res.json(result);
    } catch (e) { next(e); }
  },

  create: async (req, res, next) => {
    try {
      const result = await DoctorService.crear(req.body);
      res.status(201).json(result);
    } catch (e) { next(e); }
  },

   update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const doctor = await DoctorService.actualizar(id, req.body);
      res.json(ok(mapDoctorToDTO(doctor)));
    } catch (e) {
      next(e);
    }
  },

  disable: async (req, res, next) => {
    try {
      clog("PATCH /disable", req.params.id);
      const result = await DoctorService.actualizar(req.params.id, { activo: false });
      res.json({ ok: true, ...result });
    } catch (e) { next(e); }
  },

    remove: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await DoctorService.eliminar(id);
      res.json(result);
    } catch (e) {
      next(e);
    }
  },
};
