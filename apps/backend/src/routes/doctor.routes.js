import { Router } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { DoctorController } from "../controllers/doctor.controller.js";

export const router = Router();

const crearDoctorSchema = z.object({
  nombre: z.string().min(2),
  especialidad: z.string().optional(),
  activo: z.boolean().optional()
});

const actualizarDoctorSchema = crearDoctorSchema.partial();

router.get("/", DoctorController.listar);
router.get("/:id", DoctorController.obtener);
router.post("/", validate(crearDoctorSchema), DoctorController.crear);
router.patch("/:id", validate(actualizarDoctorSchema), DoctorController.actualizar);

// Si más adelante habilitas borrado duro:
// router.delete("/:id", DoctorController.eliminar);
