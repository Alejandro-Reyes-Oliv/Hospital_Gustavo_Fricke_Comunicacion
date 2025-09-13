import { Router } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { CitaController } from "../controllers/cita.controller.js";

export const router = Router();

// Esquemas Zod (validación del body)
const crearCitaSchema = z.object({
  doctorId: z.number().int().positive(),
  fecha_hora: z.string().min(10), // ISO local "2025-10-05T10:30:00"
  paciente_nombre: z.string().min(2),
  paciente_telefono: z.string().min(6),
  paciente_rut: z.string().optional().nullable()
});

const actualizarCitaSchema = z.object({
  doctorId: z.number().int().positive().optional(),
  fecha_hora: z.string().min(10).optional(),
  estado: z.enum(["pendiente","confirmada","cancelada"]).optional(),
  paciente_nombre: z.string().min(2).optional(),
  paciente_telefono: z.string().min(6).optional(),
  paciente_rut: z.string().optional().nullable()
});

router.get("/", CitaController.listar);
router.get("/:id", CitaController.obtener);
router.get("/:id/recordatorios", CitaController.listarRecordatorios); // para ver lo programado

router.post("/", validate(crearCitaSchema), CitaController.crear);
router.patch("/:id", validate(actualizarCitaSchema), CitaController.actualizar);

// Atajo solo estado (opcional)
// router.patch("/:id/estado", validate(z.object({estado: z.enum(["pendiente","confirmada","cancelada"])})), CitaController.cambiarEstado);
