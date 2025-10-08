Backend — Citas Médicas (Node.js + Express + Prisma + PostgreSQL)

API para gestionar Doctores, Citas y Recordatorios de citas.

Stack: Node.js, Express, Prisma ORM, PostgreSQL.

# 1) Instalar dependencias
npm install

# 2) Configurar variables de entorno
cp .env.example .env   # edita DATABASE_URL y PORT si hace falta

# 3) Crear/actualizar la base (migraciones)
npm run prisma:migrate

# 4) (Opcional) Abrir Prisma Studio (UI de la DB)
npm run prisma:studio

# 5) Arrancar el servidor de desarrollo
npm run dev

# 6) Prueba salud del servicio
# GET http://localhost:3000/api/health  -> { "ok": true }


# Requisitos

Node.js 18+
PostgreSQL 13+ (corriendo local o remoto)
npm (viene con Node)

# Ejemplo de .env
# .env
PORT=3000

# Cambia usuario, password, host, puerto y base según tu entorno

DATABASE_URL="postgresql://

Cambiar usuario, password, host, puerto y base segun el entorno:

postgres:postgres@localhost:5432/citas_db?schema=public"


# Estructura del proyecto

/backend
├─ .env                      # (no versionar)
├─ .env.example
├─ package.json
├─ prisma/
│  └─ schema.prisma          # modelos (Doctor, Cita, CitaRecordatorio)
└─ src/
   ├─ server.js              # arranca el server
   ├─ app.js                 # express, middlewares, rutas
   ├─ config/
   │  └─ prisma.js           # PrismaClient singleton
   ├─ middlewares/
   │  ├─ error.middleware.js
   │  └─ validate.middleware.js
   ├─ routes/
   │  ├─ doctor.routes.js
   │  └─ cita.routes.js
   ├─ controllers/
   │  ├─ doctor.controller.js
   │  └─ cita.controller.js
   └─ services/
      ├─ doctor.service.js
      ├─ cita.service.js
      └─ recordatorio.service.js



# Scripts útiles (ya implementados se supone)

{
  "scripts": {
    "dev": "nodemon src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}

npm run dev → corre el servidor con nodemon (recarga en caliente).

npm run prisma:migrate → crea/aplica migraciones a la base.

npm run prisma:generate → regenera el cliente de Prisma (si cambias el schema).

npm run prisma:studio → abre UI de Prisma para ver/editar tablas.




# Probar sin front (Thunder Client en VSCode o curl)

Thunder Client (extensión VS Code): fácil y liviano.

Se pueden hacer requests sueltas sin guardar colecciones (la versión free limita colecciones).

Postman: app completa para colecciones/compartir.

curl: desde terminal (nada que instalar).

# Endpoints principales
# Doctores

GET /api/doctores
Query: q (nombre), especialidad, activo, limit, offset, order

Ejemplo con curl:
curl "http://localhost:3000/api/doctores?activo=true&limit=20"


GET /api/doctores/:id
curl http://localhost:3000/api/doctores/1


POST /api/doctores
Body del json:
{ "nombre": "Toñito", "especialidad": "Scrum Master" }

# Nota: borrado duro (DELETE) no está expuesto por defecto. Por lo que usar Thunder Client para borrar es viable ó borrar directamente desde la BD (en mi caso uso pgAdmin 4 para ver tablas).


# Citas
POST /api/citas — crea cita + snapshots + programa 4 recordatorios (6m, 1m, 1w, 1d)

Body json:
{
  "doctorId": 1,
  "fecha_hora": "2025-10-05T10:30:00",
  "paciente_nombre": "Vixo Paez",
  "paciente_telefono": "+56912345678",
  "paciente_rut": null
}

- Fecha y hora en ese estandar por favor
- Nombre y telefono NOTNULL
- Rut es NULLABLE

etc etc para el CRUD y las api request




# Recordatorios (para el bot/job)

- La creación de recordatorios automáticos ocurre al crear la cita.
El envío real lo hará un bot/job usando endpoints de lectura/actualización (se pueden agregar endpoints específicos si hace falta).

- Pendientes hasta ahora (sugerido para el job; agregar cuando se implemente el bot):
GET /api/recordatorios?estado=pendiente&hasta=NOW

- Marcar enviado/error (sugerido para el job; agregar cuando se implemente el bot):
PATCH /api/recordatorios/:id → estado=enviado|error, enviado_en, intentos, error_ultimo




# Notas de diseño
- Fechas: fecha_hora se guarda como timestamp (sin zona) y se asume hora local de Chile.

- Doble booking: índice UNIQUE (doctorId, fecha_hora) evita citas duplicadas para un mismo doctor y hora exacta.

- Snapshots: doctor_nombre_snap y especialidad_snap se copian al crear la cita para que el mensaje al paciente refleje lo confirmado.

- Validaciones: Zod en endpoints (nombre, doctorId, paciente_telefono, etc.).



# Enviar curl

curl -X POST http://localhost:3000/api/bot/send \
  -H "Content-Type: application/json" \
  -d '{"citaIds":[7,8,9,10]}'    <---- las que sean necesarias


