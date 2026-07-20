DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SchedulePaymentOption') THEN
    CREATE TYPE "SchedulePaymentOption" AS ENUM ('DEPOSIT_30_PERCENT', 'PAY_AT_COUNTER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SchedulePaymentStatus') THEN
    CREATE TYPE "SchedulePaymentStatus" AS ENUM (
      'NOT_SELECTED',
      'PENDING_DEPOSIT',
      'DEPOSIT_PAID',
      'PAY_AT_COUNTER_SELECTED',
      'COUNTER_PAID',
      'WAIVED'
    );
  END IF;
END $$;

ALTER TABLE "treatment_plans"
  ADD COLUMN IF NOT EXISTS "schedule_payment_option" "SchedulePaymentOption",
  ADD COLUMN IF NOT EXISTS "schedule_payment_status" "SchedulePaymentStatus" NOT NULL DEFAULT 'NOT_SELECTED',
  ADD COLUMN IF NOT EXISTS "deposit_percent" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  ADD COLUMN IF NOT EXISTS "deposit_amount" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "schedule_confirmed_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "treatment_plans_schedule_payment_status_idx"
  ON "treatment_plans"("schedule_payment_status");
