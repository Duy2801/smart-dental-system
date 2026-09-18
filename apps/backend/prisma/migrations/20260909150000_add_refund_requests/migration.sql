-- CreateEnum (if not exists — may have been created in earlier migrations)
DO $$ BEGIN
  CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "refund_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "refund_code" TEXT NOT NULL,
    "patient_id" UUID NOT NULL,
    "video_consultation_id" UUID,
    "appointment_id" UUID,
    "invoice_id" UUID,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_holder" TEXT NOT NULL,
    "qr_code_url" TEXT,
    "requested_amount" DECIMAL(12,2) NOT NULL,
    "refund_percent" INTEGER NOT NULL DEFAULT 100,
    "reason" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "reject_reason" TEXT,
    "proof_image_url" TEXT,
    "processed_by" UUID,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "refund_requests_refund_code_key" ON "refund_requests"("refund_code");
CREATE INDEX IF NOT EXISTS "refund_requests_patient_id_idx" ON "refund_requests"("patient_id");
CREATE INDEX IF NOT EXISTS "refund_requests_status_idx" ON "refund_requests"("status");
CREATE INDEX IF NOT EXISTS "refund_requests_video_consultation_id_idx" ON "refund_requests"("video_consultation_id");
CREATE INDEX IF NOT EXISTS "refund_requests_appointment_id_idx" ON "refund_requests"("appointment_id");
CREATE INDEX IF NOT EXISTS "refund_requests_invoice_id_idx" ON "refund_requests"("invoice_id");

-- AddForeignKey
ALTER TABLE "refund_requests"
    ADD CONSTRAINT "refund_requests_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refund_requests"
    ADD CONSTRAINT "refund_requests_video_consultation_id_fkey"
    FOREIGN KEY ("video_consultation_id") REFERENCES "video_consultations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "refund_requests"
    ADD CONSTRAINT "refund_requests_appointment_id_fkey"
    FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "refund_requests"
    ADD CONSTRAINT "refund_requests_invoice_id_fkey"
    FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "refund_requests"
    ADD CONSTRAINT "refund_requests_processed_by_fkey"
    FOREIGN KEY ("processed_by") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
