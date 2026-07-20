DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TreatmentStepStatus') THEN
    CREATE TYPE "TreatmentStepStatus" AS ENUM ('PLANNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvoiceType') THEN
    CREATE TYPE "InvoiceType" AS ENUM ('SERVICE', 'DEPOSIT', 'STEP_PAYMENT', 'FINAL_PAYMENT');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "treatment_plan_steps" (
  "id" UUID NOT NULL,
  "treatment_plan_id" UUID NOT NULL,
  "doctor_id" UUID NOT NULL,
  "step_order" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "target_tooth" TEXT,
  "status" "TreatmentStepStatus" NOT NULL DEFAULT 'PLANNED',
  "estimated_cost" DECIMAL(12,2),
  "expected_date" DATE,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "treatment_plan_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "prescriptions" (
  "id" UUID NOT NULL,
  "medical_record_id" UUID NOT NULL,
  "treatment_plan_step_id" UUID,
  "doctor_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "prescription_items" (
  "id" UUID NOT NULL,
  "prescription_id" UUID NOT NULL,
  "medicine_name" TEXT NOT NULL,
  "dosage" TEXT NOT NULL,
  "frequency" TEXT,
  "duration" TEXT,
  "instruction" TEXT,
  CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "treatment_plan_step_id" UUID;

ALTER TABLE "medical_records"
  ADD COLUMN IF NOT EXISTS "treatment_plan_step_id" UUID;

ALTER TABLE "invoices"
  ADD COLUMN IF NOT EXISTS "treatment_plan_id" UUID,
  ADD COLUMN IF NOT EXISTS "treatment_plan_step_id" UUID,
  ADD COLUMN IF NOT EXISTS "invoice_type" "InvoiceType" NOT NULL DEFAULT 'SERVICE';

ALTER TABLE "invoices"
  ALTER COLUMN "appointment_id" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "treatment_plan_steps_treatment_plan_id_step_order_key"
  ON "treatment_plan_steps"("treatment_plan_id", "step_order");

CREATE INDEX IF NOT EXISTS "treatment_plan_steps_doctor_id_idx"
  ON "treatment_plan_steps"("doctor_id");

CREATE INDEX IF NOT EXISTS "treatment_plan_steps_status_expected_date_idx"
  ON "treatment_plan_steps"("status", "expected_date");

CREATE INDEX IF NOT EXISTS "appointments_treatment_plan_step_id_idx"
  ON "appointments"("treatment_plan_step_id");

CREATE INDEX IF NOT EXISTS "medical_records_treatment_plan_step_id_idx"
  ON "medical_records"("treatment_plan_step_id");

CREATE INDEX IF NOT EXISTS "prescriptions_medical_record_id_idx"
  ON "prescriptions"("medical_record_id");

CREATE INDEX IF NOT EXISTS "prescriptions_treatment_plan_step_id_idx"
  ON "prescriptions"("treatment_plan_step_id");

CREATE INDEX IF NOT EXISTS "prescriptions_doctor_id_idx"
  ON "prescriptions"("doctor_id");

CREATE INDEX IF NOT EXISTS "prescriptions_patient_id_created_at_idx"
  ON "prescriptions"("patient_id", "created_at");

CREATE INDEX IF NOT EXISTS "prescription_items_prescription_id_idx"
  ON "prescription_items"("prescription_id");

CREATE INDEX IF NOT EXISTS "invoices_treatment_plan_id_idx"
  ON "invoices"("treatment_plan_id");

CREATE INDEX IF NOT EXISTS "invoices_treatment_plan_step_id_idx"
  ON "invoices"("treatment_plan_step_id");

CREATE INDEX IF NOT EXISTS "invoices_invoice_type_idx"
  ON "invoices"("invoice_type");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'treatment_plan_steps_treatment_plan_id_fkey') THEN
    ALTER TABLE "treatment_plan_steps"
      ADD CONSTRAINT "treatment_plan_steps_treatment_plan_id_fkey"
      FOREIGN KEY ("treatment_plan_id") REFERENCES "treatment_plans"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'treatment_plan_steps_doctor_id_fkey') THEN
    ALTER TABLE "treatment_plan_steps"
      ADD CONSTRAINT "treatment_plan_steps_doctor_id_fkey"
      FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_treatment_plan_step_id_fkey') THEN
    ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_treatment_plan_step_id_fkey"
      FOREIGN KEY ("treatment_plan_step_id") REFERENCES "treatment_plan_steps"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medical_records_treatment_plan_step_id_fkey') THEN
    ALTER TABLE "medical_records"
      ADD CONSTRAINT "medical_records_treatment_plan_step_id_fkey"
      FOREIGN KEY ("treatment_plan_step_id") REFERENCES "treatment_plan_steps"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prescriptions_medical_record_id_fkey') THEN
    ALTER TABLE "prescriptions"
      ADD CONSTRAINT "prescriptions_medical_record_id_fkey"
      FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prescriptions_treatment_plan_step_id_fkey') THEN
    ALTER TABLE "prescriptions"
      ADD CONSTRAINT "prescriptions_treatment_plan_step_id_fkey"
      FOREIGN KEY ("treatment_plan_step_id") REFERENCES "treatment_plan_steps"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prescriptions_doctor_id_fkey') THEN
    ALTER TABLE "prescriptions"
      ADD CONSTRAINT "prescriptions_doctor_id_fkey"
      FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prescriptions_patient_id_fkey') THEN
    ALTER TABLE "prescriptions"
      ADD CONSTRAINT "prescriptions_patient_id_fkey"
      FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prescription_items_prescription_id_fkey') THEN
    ALTER TABLE "prescription_items"
      ADD CONSTRAINT "prescription_items_prescription_id_fkey"
      FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_treatment_plan_id_fkey') THEN
    ALTER TABLE "invoices"
      ADD CONSTRAINT "invoices_treatment_plan_id_fkey"
      FOREIGN KEY ("treatment_plan_id") REFERENCES "treatment_plans"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_treatment_plan_step_id_fkey') THEN
    ALTER TABLE "invoices"
      ADD CONSTRAINT "invoices_treatment_plan_step_id_fkey"
      FOREIGN KEY ("treatment_plan_step_id") REFERENCES "treatment_plan_steps"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
