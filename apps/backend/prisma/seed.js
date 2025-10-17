import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Doctor
  const doc = await prisma.doctor.create({
    data: { nombre: 'Dra. Ortiz', especialidad: 'Cardiología' }
  });

  // Cita a +60 min
  const cita = await prisma.cita.create({
    data: {
      doctorId: doc.id,
      fecha_hora: new Date(Date.now() + 60 * 60 * 1000),
      paciente_nombre: 'Juan Pérez',
      paciente_rut: '12.345.678-9',
      paciente_telefono: '+56912345678',
      doctor_nombre_snap: 'Dra. Ortiz',
      especialidad_snap: 'Cardiología'
    }
  });

  console.log({ doctorId: doc.id, citaId: cita.id });
}

main().finally(async () => {
  await prisma.$disconnect();
});
