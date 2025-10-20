// apps/backend/src/contracts/schemas.js
import { z } from "zod";

/** ================= Doctores ================= */
export const DoctorDTO = z.object({
  id: z.string(),
  nombre: z.string(),
  especialidad: z.string().optional().default(""),
  telefono: z.string().optional(),
  activo: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const DoctorCreateDTO = z.object({
  nombre: z.string().min(2),
  especialidad: z.string().optional(),
  // telefono: z.string().optional(),  // <- QUITAR POR AHORA
  activo: z.boolean().optional(),
})
export const DoctorUpdateDTO = DoctorCreateDTO.partial()

export const DoctorListQuery = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(10000).optional().default(1000),
  sort: z.string().optional().default("nombre:asc"),
});

/** ================= Citas (Appointments) ================= */
export const CitaDTO = z.object({
  id: z.string(),
  nombrePaciente: z.string(),
  rut: z.string().optional(),
  telefono: z.string().optional(),
  fechaCita: z.string(), // ISO
  medicoId: z.string(),
  nombreMedico: z.string(),
  especialidadMedico: z.string(),
  estadoCita: z.enum(["pendiente", "confirmada", "cancelada"]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CitaCreateDTO = z.object({
  nombrePaciente: z.string().min(2),
  rut: z.string().optional(),
  telefono: z.string().optional(),
  fechaCita: z.string().min(10), // ISO
  medicoId: z.string().min(1),
  estadoCita: z.enum(["pendiente", "confirmada", "cancelada"]).optional(),
});
export const CitaUpdateDTO = CitaCreateDTO.partial();

export const CitaListQuery = z.object({
  search: z.string().optional(),
  estado: z.enum(["pendiente", "confirmada", "cancelada"]).optional(),
  medicoId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(10000).optional().default(1000),
  sort: z.string().optional().default("fechaCita:asc"),
});

export const BulkStatusDTO = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1),
  estadoCita: z.enum(["pendiente", "confirmada", "cancelada"]),
});

/** ================= Pacientes (opcional P1) ================= */
export const PacienteDTO = z.object({
  id: z.string(),
  nombre: z.string(),
  rut: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  activo: z.boolean().optional().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const PacienteCreateDTO = z.object({
  nombre: z.string().min(2),
  rut: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  activo: z.boolean().optional(),
});
export const PacienteUpdateDTO = PacienteCreateDTO.partial();

export const PacienteListQuery = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(200).optional().default(20),
  sort: z.string().optional().default("nombre:asc"),
});
