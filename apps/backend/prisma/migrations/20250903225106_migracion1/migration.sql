-- CreateTable
CREATE TABLE "public"."StgCita" (
    "id" SERIAL NOT NULL,
    "importBatchId" INTEGER NOT NULL,
    "raw" JSONB NOT NULL,
    "telefono" VARCHAR(32),
    "fecha" TIMESTAMP(3),
    "horaTexto" TEXT,
    "warnings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StgCita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StgCitaError" (
    "id" SERIAL NOT NULL,
    "importBatchId" INTEGER NOT NULL,
    "raw" JSONB NOT NULL,
    "motivo" TEXT NOT NULL,
    "campos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StgCitaError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StgCita_importBatchId_idx" ON "public"."StgCita"("importBatchId");

-- CreateIndex
CREATE INDEX "StgCita_telefono_idx" ON "public"."StgCita"("telefono");

-- CreateIndex
CREATE INDEX "StgCitaError_importBatchId_idx" ON "public"."StgCitaError"("importBatchId");
