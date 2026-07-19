CREATE TABLE IF NOT EXISTS "clinical_cases" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "patient_id" UUID NOT NULL,
  "doctor_id" UUID NOT NULL,
  "service_id" UUID NOT NULL,
  "appointment_id" UUID NOT NULL,
  "medical_record_id" UUID NOT NULL,
  "treatment_plan_id" UUID,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "treatment_duration" TEXT,
  "before_image_url" TEXT NOT NULL,
  "after_image_url" TEXT NOT NULL,
  "patient_consent_public" BOOLEAN NOT NULL DEFAULT false,
  "is_published" BOOLEAN NOT NULL DEFAULT false,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "clinical_cases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "clinical_cases_is_published_patient_consent_public_display_order_idx"
  ON "clinical_cases"("is_published", "patient_consent_public", "display_order");
CREATE INDEX IF NOT EXISTS "clinical_cases_patient_id_created_at_idx"
  ON "clinical_cases"("patient_id", "created_at");
CREATE INDEX IF NOT EXISTS "clinical_cases_doctor_id_idx"
  ON "clinical_cases"("doctor_id");
CREATE INDEX IF NOT EXISTS "clinical_cases_service_id_idx"
  ON "clinical_cases"("service_id");
CREATE INDEX IF NOT EXISTS "clinical_cases_appointment_id_idx"
  ON "clinical_cases"("appointment_id");
CREATE INDEX IF NOT EXISTS "clinical_cases_medical_record_id_idx"
  ON "clinical_cases"("medical_record_id");
CREATE INDEX IF NOT EXISTS "clinical_cases_treatment_plan_id_idx"
  ON "clinical_cases"("treatment_plan_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clinical_cases_patient_id_fkey'
  ) THEN
    ALTER TABLE "clinical_cases"
      ADD CONSTRAINT "clinical_cases_patient_id_fkey"
      FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clinical_cases_doctor_id_fkey'
  ) THEN
    ALTER TABLE "clinical_cases"
      ADD CONSTRAINT "clinical_cases_doctor_id_fkey"
      FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clinical_cases_service_id_fkey'
  ) THEN
    ALTER TABLE "clinical_cases"
      ADD CONSTRAINT "clinical_cases_service_id_fkey"
      FOREIGN KEY ("service_id") REFERENCES "services"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clinical_cases_appointment_id_fkey'
  ) THEN
    ALTER TABLE "clinical_cases"
      ADD CONSTRAINT "clinical_cases_appointment_id_fkey"
      FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clinical_cases_medical_record_id_fkey'
  ) THEN
    ALTER TABLE "clinical_cases"
      ADD CONSTRAINT "clinical_cases_medical_record_id_fkey"
      FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clinical_cases_treatment_plan_id_fkey'
  ) THEN
    ALTER TABLE "clinical_cases"
      ADD CONSTRAINT "clinical_cases_treatment_plan_id_fkey"
      FOREIGN KEY ("treatment_plan_id") REFERENCES "treatment_plans"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
