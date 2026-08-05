ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "treatment_method_id" UUID;

WITH preferred_methods AS (
  SELECT DISTINCT ON ("service_id")
    "id",
    "service_id"
  FROM "treatment_methods"
  WHERE "is_active" = true
  ORDER BY "service_id", "display_order" ASC, "created_at" ASC
)
UPDATE "appointments" a
SET "treatment_method_id" = pm."id"
FROM preferred_methods pm
WHERE a."treatment_method_id" IS NULL
  AND a."service_id" = pm."service_id";

DO $$
DECLARE
  missing_count integer;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM "appointments"
  WHERE "treatment_method_id" IS NULL;

  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Cannot require appointments.treatment_method_id: % appointments have no matching treatment method', missing_count;
  END IF;
END $$;

ALTER TABLE "appointments"
  ALTER COLUMN "treatment_method_id" SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_treatment_method_id_fkey'
  ) THEN
    ALTER TABLE "appointments" DROP CONSTRAINT "appointments_treatment_method_id_fkey";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_service_id_fkey'
  ) THEN
    ALTER TABLE "appointments" DROP CONSTRAINT "appointments_service_id_fkey";
  END IF;
END $$;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_treatment_method_id_fkey"
  FOREIGN KEY ("treatment_method_id") REFERENCES "treatment_methods"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "appointments_service_id_idx";
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "service_id";

ALTER TABLE "services" DROP COLUMN IF EXISTS "base_price";
ALTER TABLE "services" DROP COLUMN IF EXISTS "duration_minutes";
