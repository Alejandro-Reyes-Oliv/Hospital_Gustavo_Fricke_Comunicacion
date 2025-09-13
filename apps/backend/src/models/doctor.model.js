import { z } from 'zod';

export const DoctorCreateSchema = z.object({
  nombre: z.string().min(2, 'nombre muy corto'),
  especialidad: z.string().min(2, 'especialidad muy corta'),
  telefono: z.string().optional(),
  email: z.string().email().optional()
});
