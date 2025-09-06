-- CreateEnum
CREATE TYPE "public"."EstadoCita" AS ENUM ('REALIZADO', 'NO_SE_PRESENTO', 'NO_REALIZADO', 'ADMITIDO');

-- CreateEnum
CREATE TYPE "public"."Sexo" AS ENUM ('MUJER', 'HOMBRE');

-- CreateTable
CREATE TABLE "public"."Paciente" (
    "id" TEXT NOT NULL,
    "idPacienteExcel" TEXT NOT NULL,
    "sexo" "public"."Sexo",
    "edadTexto" TEXT,
    "comuna" TEXT,
    "provincia" TEXT,
    "region" TEXT,
    "telefonoFijo" TEXT,
    "telefonoMovil" TEXT,
    "telefonoRecados" TEXT,
    "prevision" TEXT,
    "plan" TEXT,
    "establecimiento" TEXT,
    "policlinico" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cita" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "idLe" TEXT,
    "tipoLe" TEXT,
    "estadoSic" TEXT,
    "folio" TEXT,
    "prestacion" TEXT,
    "especialidadAgenda" TEXT,
    "profesionalAgendaRut" TEXT,
    "profesionalAgenda" TEXT,
    "establecimientoAgenda" TEXT,
    "policlinicoAgenda" TEXT,
    "box" TEXT,
    "origen" TEXT,
    "estadoCita" "public"."EstadoCita",
    "motivoCancelacion" TEXT,
    "sobrecupo" BOOLEAN,
    "fechaHoraCita" TIMESTAMP(3),
    "diagnostico" TEXT,
    "problemaSalud" TEXT,
    "ges" TEXT,
    "etapaGes" TEXT,
    "destinoAlta" TEXT,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ImportLog" (
    "id" TEXT NOT NULL,
    "fuente" TEXT NOT NULL,
    "archivo" TEXT NOT NULL,
    "fila" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorMensaje" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_idPacienteExcel_key" ON "public"."Paciente"("idPacienteExcel");

-- CreateIndex
CREATE INDEX "Cita_pacienteId_idx" ON "public"."Cita"("pacienteId");

-- CreateIndex
CREATE INDEX "Cita_fechaHoraCita_idx" ON "public"."Cita"("fechaHoraCita");

-- CreateIndex
CREATE INDEX "Cita_estadoCita_idx" ON "public"."Cita"("estadoCita");

-- AddForeignKey
ALTER TABLE "public"."Cita" ADD CONSTRAINT "Cita_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "public"."Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
