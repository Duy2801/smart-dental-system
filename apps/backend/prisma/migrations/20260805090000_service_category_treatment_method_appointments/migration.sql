CREATE TABLE IF NOT EXISTS "treatment_methods" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "service_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT,
  "description" TEXT,
  "image_url" TEXT,
  "base_price" DECIMAL(12,2) NOT NULL,
  "duration_minutes" INTEGER,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "treatment_methods_pkey" PRIMARY KEY ("id")
);

INSERT INTO "treatment_methods" (
  "service_id",
  "name",
  "slug",
  "description",
  "base_price",
  "duration_minutes",
  "display_order",
  "is_active",
  "updated_at"
)
SELECT
  s."id",
  s."name",
  CASE
    WHEN s."slug" IS NULL THEN NULL
    ELSE s."slug" || '-standard'
  END,
  s."description",
  s."base_price",
  s."duration_minutes",
  0,
  s."is_active",
  CURRENT_TIMESTAMP
FROM "services" s
WHERE NOT EXISTS (
  SELECT 1 FROM "treatment_methods" tm WHERE tm."service_id" = s."id"
);

CREATE UNIQUE INDEX IF NOT EXISTS "treatment_methods_slug_key"
  ON "treatment_methods"("slug");

CREATE INDEX IF NOT EXISTS "treatment_methods_service_id_is_active_idx"
  ON "treatment_methods"("service_id", "is_active");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'treatment_methods_service_id_fkey'
  ) THEN
    ALTER TABLE "treatment_methods"
      ADD CONSTRAINT "treatment_methods_service_id_fkey"
      FOREIGN KEY ("service_id") REFERENCES "services"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

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
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_treatment_method_id_fkey'
  ) THEN
    ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_treatment_method_id_fkey"
      FOREIGN KEY ("treatment_method_id") REFERENCES "treatment_methods"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS "service_media_service_id_sort_order_idx";
DROP INDEX IF EXISTS "service_procedure_steps_service_id_step_order_key";
DROP INDEX IF EXISTS "service_procedure_steps_service_id_idx";
DROP INDEX IF EXISTS "service_faqs_service_id_sort_order_idx";

ALTER TABLE "service_media"
  ADD COLUMN IF NOT EXISTS "treatment_method_id" UUID;

ALTER TABLE "service_procedure_steps"
  ADD COLUMN IF NOT EXISTS "treatment_method_id" UUID;

ALTER TABLE "service_faqs"
  ADD COLUMN IF NOT EXISTS "treatment_method_id" UUID;

WITH preferred_methods AS (
  SELECT DISTINCT ON ("service_id")
    "id",
    "service_id"
  FROM "treatment_methods"
  WHERE "is_active" = true
  ORDER BY "service_id", "display_order" ASC, "created_at" ASC
)
UPDATE "service_media" sm
SET "treatment_method_id" = pm."id"
FROM preferred_methods pm
WHERE sm."treatment_method_id" IS NULL
  AND sm."service_id" = pm."service_id";

WITH preferred_methods AS (
  SELECT DISTINCT ON ("service_id")
    "id",
    "service_id"
  FROM "treatment_methods"
  WHERE "is_active" = true
  ORDER BY "service_id", "display_order" ASC, "created_at" ASC
)
UPDATE "service_procedure_steps" sps
SET "treatment_method_id" = pm."id"
FROM preferred_methods pm
WHERE sps."treatment_method_id" IS NULL
  AND sps."service_id" = pm."service_id";

WITH preferred_methods AS (
  SELECT DISTINCT ON ("service_id")
    "id",
    "service_id"
  FROM "treatment_methods"
  WHERE "is_active" = true
  ORDER BY "service_id", "display_order" ASC, "created_at" ASC
)
UPDATE "service_faqs" sf
SET "treatment_method_id" = pm."id"
FROM preferred_methods pm
WHERE sf."treatment_method_id" IS NULL
  AND sf."service_id" = pm."service_id";

ALTER TABLE "service_media"
  ALTER COLUMN "treatment_method_id" SET NOT NULL;

ALTER TABLE "service_procedure_steps"
  ALTER COLUMN "treatment_method_id" SET NOT NULL;

ALTER TABLE "service_faqs"
  ALTER COLUMN "treatment_method_id" SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_media_service_id_fkey'
  ) THEN
    ALTER TABLE "service_media" DROP CONSTRAINT "service_media_service_id_fkey";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_procedure_steps_service_id_fkey'
  ) THEN
    ALTER TABLE "service_procedure_steps" DROP CONSTRAINT "service_procedure_steps_service_id_fkey";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_faqs_service_id_fkey'
  ) THEN
    ALTER TABLE "service_faqs" DROP CONSTRAINT "service_faqs_service_id_fkey";
  END IF;
END $$;

ALTER TABLE "service_media" DROP COLUMN IF EXISTS "service_id";
ALTER TABLE "service_procedure_steps" DROP COLUMN IF EXISTS "service_id";
ALTER TABLE "service_faqs" DROP COLUMN IF EXISTS "service_id";

CREATE INDEX IF NOT EXISTS "service_media_treatment_method_id_sort_order_idx"
  ON "service_media"("treatment_method_id", "sort_order");

CREATE UNIQUE INDEX IF NOT EXISTS "service_procedure_steps_treatment_method_id_step_order_key"
  ON "service_procedure_steps"("treatment_method_id", "step_order");

CREATE INDEX IF NOT EXISTS "service_procedure_steps_treatment_method_id_idx"
  ON "service_procedure_steps"("treatment_method_id");

CREATE INDEX IF NOT EXISTS "service_faqs_treatment_method_id_sort_order_idx"
  ON "service_faqs"("treatment_method_id", "sort_order");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_media_treatment_method_id_fkey'
  ) THEN
    ALTER TABLE "service_media"
      ADD CONSTRAINT "service_media_treatment_method_id_fkey"
      FOREIGN KEY ("treatment_method_id") REFERENCES "treatment_methods"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_procedure_steps_treatment_method_id_fkey'
  ) THEN
    ALTER TABLE "service_procedure_steps"
      ADD CONSTRAINT "service_procedure_steps_treatment_method_id_fkey"
      FOREIGN KEY ("treatment_method_id") REFERENCES "treatment_methods"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_faqs_treatment_method_id_fkey'
  ) THEN
    ALTER TABLE "service_faqs"
      ADD CONSTRAINT "service_faqs_treatment_method_id_fkey"
      FOREIGN KEY ("treatment_method_id") REFERENCES "treatment_methods"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "promotions"
  ADD COLUMN IF NOT EXISTS "image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "applicable_service_slug" TEXT,
  ADD COLUMN IF NOT EXISTS "applicable_treatment_method_id" UUID;

CREATE INDEX IF NOT EXISTS "promotions_applicable_treatment_method_id_idx"
  ON "promotions"("applicable_treatment_method_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'promotions_applicable_treatment_method_id_fkey'
  ) THEN
    ALTER TABLE "promotions"
      ADD CONSTRAINT "promotions_applicable_treatment_method_id_fkey"
      FOREIGN KEY ("applicable_treatment_method_id") REFERENCES "treatment_methods"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
