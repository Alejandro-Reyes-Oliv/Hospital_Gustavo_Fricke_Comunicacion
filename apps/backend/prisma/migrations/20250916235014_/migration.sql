/*
  Warnings:

  - The `estado` column on the `Cita` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."EstadoCita" AS ENUM ('pendiente', 'confirmada', 'cancelada');

-- AlterTable
ALTER TABLE "public"."Cita" DROP COLUMN "estado",
ADD COLUMN     "estado" "public"."EstadoCita" NOT NULL DEFAULT 'pendiente';
