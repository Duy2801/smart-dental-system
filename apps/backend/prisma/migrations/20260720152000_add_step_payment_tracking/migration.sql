DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TreatmentStepPaymentStatus') THEN
    CREATE TYPE "TreatmentStepPaymentStatus" AS ENUM ('UNBILLED', 'INVOICED', 'PARTIALLY_PAID', 'PAID', 'WAIVED');
  END IF;
END $$;

ALTER TABLE "treatment_plan_steps"
  ADD COLUMN IF NOT EXISTS "payment_amount" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "payment_status" "TreatmentStepPaymentStatus" NOT NULL DEFAULT 'UNBILLED',
  ADD COLUMN IF NOT EXISTS "payment_due_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "treatment_plan_steps_payment_status_payment_due_at_idx"
  ON "treatment_plan_steps"("payment_status", "payment_due_at");
