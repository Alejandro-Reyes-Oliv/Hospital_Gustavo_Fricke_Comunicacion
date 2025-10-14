-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "messageId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fromWaId" TEXT,
    "toPhoneNumberId" TEXT,
    "type" TEXT NOT NULL,
    "textBody" TEXT,
    "raw" JSONB NOT NULL,
    "meta" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_messageId_key" ON "WhatsAppMessage"("messageId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_timestamp_idx" ON "WhatsAppMessage"("timestamp");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_direction_type_idx" ON "WhatsAppMessage"("direction", "type");
