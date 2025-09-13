-- CreateTable
CREATE TABLE "public"."Cita" (
    "id" SERIAL NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "paciente_nombre" TEXT NOT NULL,
    "paciente_rut" TEXT,
    "paciente_telefono" TEXT NOT NULL,
    "doctor_nombre_snap" TEXT,
    "especialidad_snap" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CitaRecordatorio" (
    "id" SERIAL NOT NULL,
    "citaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "programado_para" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "enviado_en" TIMESTAMP(3),
    "canal" TEXT,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "error_ultimo" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CitaRecordatorio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cita_fecha_hora_idx" ON "public"."Cita"("fecha_hora");

-- CreateIndex
CREATE UNIQUE INDEX "Cita_doctorId_fecha_hora_key" ON "public"."Cita"("doctorId", "fecha_hora");

-- CreateIndex
CREATE INDEX "CitaRecordatorio_estado_programado_para_idx" ON "public"."CitaRecordatorio"("estado", "programado_para");

-- CreateIndex
CREATE INDEX "CitaRecordatorio_citaId_idx" ON "public"."CitaRecordatorio"("citaId");

-- AddForeignKey
ALTER TABLE "public"."Cita" ADD CONSTRAINT "Cita_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CitaRecordatorio" ADD CONSTRAINT "CitaRecordatorio_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "public"."Cita"("id") ON DELETE CASCADE ON UPDATE CASCADE;
