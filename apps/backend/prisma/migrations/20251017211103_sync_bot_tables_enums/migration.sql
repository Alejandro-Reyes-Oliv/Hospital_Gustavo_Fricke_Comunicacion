-- CreateEnum
CREATE TYPE "public"."BotDirection" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateEnum
CREATE TYPE "public"."BotMessageStatus" AS ENUM ('PENDING', 'DELIVERED', 'REPLIED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."CitaConfirmState" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "public"."BotMessage" (
    "id" TEXT NOT NULL,
    "citaId" INTEGER,
    "direction" "public"."BotDirection" NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "correlationId" TEXT,
    "toPhone" TEXT,
    "fromPhone" TEXT,
    "text" TEXT,
    "payload" JSONB,
    "raw" JSONB,
    "status" "public"."BotMessageStatus" NOT NULL DEFAULT 'PENDING',
    "replyText" TEXT,
    "replyPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CitaConfirmation" (
    "id" TEXT NOT NULL,
    "citaId" INTEGER NOT NULL,
    "state" "public"."CitaConfirmState" NOT NULL DEFAULT 'PENDING',
    "confirmationMsgId" TEXT,
    "lastReplyMsgId" TEXT,
    "lastReplyText" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CitaConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotMessage_providerMessageId_key" ON "public"."BotMessage"("providerMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "BotMessage_correlationId_key" ON "public"."BotMessage"("correlationId");

-- CreateIndex
CREATE INDEX "BotMessage_citaId_idx" ON "public"."BotMessage"("citaId");

-- CreateIndex
CREATE INDEX "BotMessage_toPhone_idx" ON "public"."BotMessage"("toPhone");

-- CreateIndex
CREATE INDEX "BotMessage_fromPhone_idx" ON "public"."BotMessage"("fromPhone");

-- CreateIndex
CREATE INDEX "BotMessage_provider_providerMessageId_idx" ON "public"."BotMessage"("provider", "providerMessageId");

-- CreateIndex
CREATE INDEX "BotMessage_provider_correlationId_idx" ON "public"."BotMessage"("provider", "correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "CitaConfirmation_citaId_key" ON "public"."CitaConfirmation"("citaId");

-- CreateIndex
CREATE INDEX "CitaConfirmation_confirmationMsgId_idx" ON "public"."CitaConfirmation"("confirmationMsgId");

-- CreateIndex
CREATE INDEX "CitaConfirmation_lastReplyMsgId_idx" ON "public"."CitaConfirmation"("lastReplyMsgId");

-- AddForeignKey
ALTER TABLE "public"."BotMessage" ADD CONSTRAINT "BotMessage_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "public"."Cita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CitaConfirmation" ADD CONSTRAINT "CitaConfirmation_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "public"."Cita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
