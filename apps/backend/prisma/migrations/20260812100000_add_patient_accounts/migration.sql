CREATE TYPE "PatientRelationship" AS ENUM ('SELF', 'CHILD', 'FATHER', 'MOTHER', 'OTHER');

ALTER TABLE "patients"
  ADD COLUMN "full_name" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "email" TEXT,
  ALTER COLUMN "user_id" DROP NOT NULL;

UPDATE "patients" p
SET
  "full_name" = u."full_name",
  "phone" = u."phone",
  "email" = u."email"
FROM "users" u
WHERE p."user_id" = u."id";

CREATE TABLE "patient_accounts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "relationship" "PatientRelationship" NOT NULL DEFAULT 'OTHER',
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "can_book" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "patient_accounts_pkey" PRIMARY KEY ("id")
);

INSERT INTO "patient_accounts" (
  "user_id",
  "patient_id",
  "relationship",
  "is_primary",
  "can_book",
  "updated_at"
)
SELECT
  "user_id",
  "id",
  'SELF',
  true,
  true,
  CURRENT_TIMESTAMP
FROM "patients"
WHERE "user_id" IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE UNIQUE INDEX "patient_accounts_user_id_patient_id_key"
  ON "patient_accounts"("user_id", "patient_id");

CREATE INDEX "patient_accounts_user_id_relationship_idx"
  ON "patient_accounts"("user_id", "relationship");

CREATE INDEX "patient_accounts_patient_id_idx"
  ON "patient_accounts"("patient_id");

ALTER TABLE "patient_accounts"
  ADD CONSTRAINT "patient_accounts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "patient_accounts"
  ADD CONSTRAINT "patient_accounts_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "patients_user_id_fkey";

ALTER TABLE "patients"
  ADD CONSTRAINT "patients_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
