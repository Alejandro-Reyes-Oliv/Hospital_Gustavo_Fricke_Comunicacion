import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Doctores base
  const doctores = await prisma.doctor.createMany({
    data: [
      { nombre: 'Dr. Berto Dago', especialidad: 'Traumatología' },
      { nombre: 'Dr. Antonio Páez', especialidad: 'General' }
    ],
    skipDuplicates: true
  });

  // Una cita de ejemplo: ajusta los nombres de campos a tu modelo real
  const [andrea] = await prisma.doctor.findMany({ take: 1, where: { nombre: 'Dr. Berto Dago' } });
  if (andrea) {
    await prisma.cita.upsert({
      where: { id: 1 },        // si tu modelo usa id autoincrement, puedes usar create directamente
      update: {},
      create: {
        doctorId: andrea.id,
        paciente_nombre: 'Luffy D. Monkey',
        paciente_telefono: '+56912345678',
        fecha_hora: new Date(Date.now() + 1000 * 60 * 60 * 24), // mañana
        estado: 'PROGRAMADA' // si tu modelo tiene enum/estado
      }
    });
  }

  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
