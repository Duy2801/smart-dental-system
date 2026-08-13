CREATE TABLE IF NOT EXISTS "specializations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "specializations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "specializations_name_key"
  ON "specializations"("name");

CREATE UNIQUE INDEX IF NOT EXISTS "specializations_code_key"
  ON "specializations"("code");

CREATE TABLE IF NOT EXISTS "doctor_specializations" (
  "doctor_id" UUID NOT NULL,
  "specialization_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "doctor_specializations_pkey" PRIMARY KEY ("doctor_id", "specialization_id")
);

CREATE INDEX IF NOT EXISTS "doctor_specializations_specialization_id_idx"
  ON "doctor_specializations"("specialization_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'doctor_specializations_doctor_id_fkey'
  ) THEN
    ALTER TABLE "doctor_specializations"
      ADD CONSTRAINT "doctor_specializations_doctor_id_fkey"
      FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'doctor_specializations_specialization_id_fkey'
  ) THEN
    ALTER TABLE "doctor_specializations"
      ADD CONSTRAINT "doctor_specializations_specialization_id_fkey"
      FOREIGN KEY ("specialization_id") REFERENCES "specializations"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "services"
  ADD COLUMN IF NOT EXISTS "specialization_id" UUID,
  ADD COLUMN IF NOT EXISTS "icon" TEXT;

ALTER TABLE "services"
  DROP COLUMN IF EXISTS "thumbnail_url";

ALTER TABLE "services"
  ALTER COLUMN "duration_minutes" DROP NOT NULL,
  ALTER COLUMN "base_price" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "services_specialization_id_idx"
  ON "services"("specialization_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_specialization_id_fkey'
  ) THEN
    ALTER TABLE "services"
      ADD CONSTRAINT "services_specialization_id_fkey"
      FOREIGN KEY ("specialization_id") REFERENCES "specializations"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "banners" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "image_url" TEXT NOT NULL,
  "link_url" TEXT,
  "target_type" TEXT DEFAULT 'SERVICE',
  "target_id" TEXT,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "start_date" TIMESTAMP(3),
  "end_date" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "banners_is_active_display_order_idx"
  ON "banners"("is_active", "display_order");

CREATE TABLE IF NOT EXISTS "consultation_packages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "minutes" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "price" DECIMAL(12,2) NOT NULL,
  "description" TEXT NOT NULL,
  "tag" TEXT,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "consultation_packages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "consultation_packages_minutes_key"
  ON "consultation_packages"("minutes");

CREATE INDEX IF NOT EXISTS "consultation_packages_is_active_display_order_idx"
  ON "consultation_packages"("is_active", "display_order");

CREATE INDEX IF NOT EXISTS "appointments_treatment_method_id_idx"
  ON "appointments"("treatment_method_id");

ALTER TABLE "invoices"
  ALTER COLUMN "appointment_id" DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoices_appointment_id_fkey'
  ) THEN
    ALTER TABLE "invoices" DROP CONSTRAINT "invoices_appointment_id_fkey";
  END IF;

  ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_appointment_id_fkey"
    FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
END $$;
