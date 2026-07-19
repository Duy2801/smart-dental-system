ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "position" TEXT;
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "workplace" TEXT;
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "years_experience" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "doctor_educations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "doctor_id" UUID NOT NULL,
  "degree" TEXT NOT NULL,
  "school" TEXT NOT NULL,
  "major" TEXT,
  "graduation_year" INTEGER,
  "description" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "doctor_educations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "doctor_certificates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "doctor_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "issuer" TEXT NOT NULL,
  "issued_at" DATE,
  "expires_at" DATE,
  "certificate_url" TEXT,
  "image_url" TEXT,
  "description" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "doctor_certificates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "doctor_media" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "doctor_id" UUID NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "type" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "doctor_media_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "doctor_educations_doctor_id_degree_school_key"
  ON "doctor_educations"("doctor_id", "degree", "school");
CREATE INDEX IF NOT EXISTS "doctor_educations_doctor_id_sort_order_idx"
  ON "doctor_educations"("doctor_id", "sort_order");

CREATE UNIQUE INDEX IF NOT EXISTS "doctor_certificates_doctor_id_title_issuer_key"
  ON "doctor_certificates"("doctor_id", "title", "issuer");
CREATE INDEX IF NOT EXISTS "doctor_certificates_doctor_id_sort_order_idx"
  ON "doctor_certificates"("doctor_id", "sort_order");

CREATE INDEX IF NOT EXISTS "doctor_media_doctor_id_sort_order_idx"
  ON "doctor_media"("doctor_id", "sort_order");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'doctor_educations_doctor_id_fkey'
  ) THEN
    ALTER TABLE "doctor_educations"
      ADD CONSTRAINT "doctor_educations_doctor_id_fkey"
      FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'doctor_certificates_doctor_id_fkey'
  ) THEN
    ALTER TABLE "doctor_certificates"
      ADD CONSTRAINT "doctor_certificates_doctor_id_fkey"
      FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'doctor_media_doctor_id_fkey'
  ) THEN
    ALTER TABLE "doctor_media"
      ADD CONSTRAINT "doctor_media_doctor_id_fkey"
      FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
