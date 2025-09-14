/*
  Warnings:

  - You are about to drop the `Cita` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ImportLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Paciente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StgCita` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StgCitaError` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Cita" DROP CONSTRAINT "Cita_pacienteId_fkey";

-- DropTable
DROP TABLE "public"."Cita";

-- DropTable
DROP TABLE "public"."ImportLog";

-- DropTable
DROP TABLE "public"."Paciente";

-- DropTable
DROP TABLE "public"."StgCita";

-- DropTable
DROP TABLE "public"."StgCitaError";

-- DropEnum
DROP TYPE "public"."EstadoCita";

-- DropEnum
DROP TYPE "public"."Sexo";

-- CreateTable
CREATE TABLE "public"."Doctor" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "especialidad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);
