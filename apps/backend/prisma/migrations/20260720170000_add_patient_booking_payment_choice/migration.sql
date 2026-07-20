DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AppointmentPaymentOption') THEN
    CREATE TYPE "AppointmentPaymentOption" AS ENUM ('DEPOSIT_30_PERCENT', 'PAY_AT_COUNTER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AppointmentPaymentStatus') THEN
    CREATE TYPE "AppointmentPaymentStatus" AS ENUM (
      'NOT_SELECTED',
      'PENDING_DEPOSIT',
      'DEPOSIT_PAID',
      'PAY_AT_COUNTER_SELECTED',
      'COUNTER_PAID',
      'WAIVED'
    );
  END IF;
END $$;

ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "payment_option" "AppointmentPaymentOption",
  ADD COLUMN IF NOT EXISTS "payment_status" "AppointmentPaymentStatus" NOT NULL DEFAULT 'NOT_SELECTED',
  ADD COLUMN IF NOT EXISTS "deposit_percent" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  ADD COLUMN IF NOT EXISTS "deposit_amount" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "schedule_confirmed_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "appointments_payment_status_idx"
  ON "appointments"("payment_status");
