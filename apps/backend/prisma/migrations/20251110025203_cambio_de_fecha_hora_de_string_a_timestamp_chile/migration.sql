/*
  Warnings:

  - Changed the type of `fecha_hora` on the `Cita` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."Cita" DROP COLUMN "fecha_hora",
ADD COLUMN     "fecha_hora" TIMESTAMPTZ(6) NOT NULL;

-- CreateIndex
CREATE INDEX "Cita_fecha_hora_idx" ON "public"."Cita"("fecha_hora");

-- CreateIndex
CREATE UNIQUE INDEX "Cita_doctorId_fecha_hora_key" ON "public"."Cita"("doctorId", "fecha_hora");
