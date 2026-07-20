DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DepositCalculationMode') THEN
    CREATE TYPE "DepositCalculationMode" AS ENUM ('PERCENT', 'FIXED');
  END IF;
END $$;

ALTER TABLE "services"
  ADD COLUMN IF NOT EXISTS "deposit_override_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "deposit_required" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "deposit_calculation_mode" "DepositCalculationMode",
  ADD COLUMN IF NOT EXISTS "deposit_value" DECIMAL(12,2);
