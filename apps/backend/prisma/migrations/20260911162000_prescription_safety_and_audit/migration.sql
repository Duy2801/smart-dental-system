ALTER TABLE "prescriptions"
ADD COLUMN "cancelled_at" TIMESTAMP(3),
ADD COLUMN "cancelled_by" UUID,
ADD COLUMN "email_queued_at" TIMESTAMP(3),
ADD COLUMN "safety_confirmed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "safety_override" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "prescription_audits" (
    "id" UUID NOT NULL,
    "prescription_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "changed_by" UUID NOT NULL,
    "previous_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prescription_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "prescription_audits_prescription_id_created_at_idx"
ON "prescription_audits"("prescription_id", "created_at");

ALTER TABLE "prescription_audits"
ADD CONSTRAINT "prescription_audits_prescription_id_fkey"
FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "prescriptions" DROP CONSTRAINT "prescriptions_medical_record_id_fkey";
ALTER TABLE "prescriptions"
ADD CONSTRAINT "prescriptions_medical_record_id_fkey"
FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
