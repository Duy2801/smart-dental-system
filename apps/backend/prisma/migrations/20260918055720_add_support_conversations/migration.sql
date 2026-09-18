-- CreateEnum
CREATE TYPE "SupportConversationStatus" AS ENUM ('WAITING', 'ASSIGNED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportMessageSender" AS ENUM ('PATIENT', 'STAFF', 'SYSTEM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VideoConsultationStatus" ADD VALUE 'PENDING_PAYMENT';
ALTER TYPE "VideoConsultationStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "VideoConsultationStatus" ADD VALUE 'DOCTOR_MISSED';

-- AlterTable
ALTER TABLE "medical_record_audits" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "patient_ai_briefs" ALTER COLUMN "source_data" DROP DEFAULT;

-- AlterTable
ALTER TABLE "refund_requests" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "video_consultations" ADD COLUMN     "expires_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "support_conversations" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "status" "SupportConversationStatus" NOT NULL DEFAULT 'WAITING',
    "assigned_to_id" UUID,
    "assigned_at" TIMESTAMP(3),
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "support_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_type" "SupportMessageSender" NOT NULL,
    "sender_id" UUID,
    "content" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_conversations_status_last_message_at_idx" ON "support_conversations"("status", "last_message_at");

-- CreateIndex
CREATE INDEX "support_conversations_assigned_to_id_status_idx" ON "support_conversations"("assigned_to_id", "status");

-- CreateIndex
CREATE INDEX "support_messages_conversation_id_created_at_idx" ON "support_messages"("conversation_id", "created_at");

-- AddForeignKey
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "support_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
