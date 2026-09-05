CREATE TABLE "medical_record_audits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "medical_record_id" UUID NOT NULL,
    "changed_by" UUID NOT NULL,
    "previous_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_record_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "medical_record_audits_medical_record_id_created_at_idx"
ON "medical_record_audits"("medical_record_id", "created_at");

CREATE INDEX "medical_record_audits_changed_by_created_at_idx"
ON "medical_record_audits"("changed_by", "created_at");

ALTER TABLE "medical_record_audits"
ADD CONSTRAINT "medical_record_audits_medical_record_id_fkey"
FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
