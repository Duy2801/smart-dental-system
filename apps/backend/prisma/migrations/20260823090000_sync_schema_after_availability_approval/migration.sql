-- CreateEnum
CREATE TYPE "AvailabilityApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "banners"
  ALTER COLUMN "id" DROP DEFAULT,
  ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "clinical_cases"
  ALTER COLUMN "id" DROP DEFAULT,
  ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "consultation_packages"
  ALTER COLUMN "id" DROP DEFAULT,
  ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "doctor_availability"
  ADD COLUMN "approval_status" "AvailabilityApprovalStatus" NOT NULL DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE "doctor_certificates"
  ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "doctor_educations"
  ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "doctor_media"
  ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "patient_accounts"
  ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "specializations"
  ALTER COLUMN "id" DROP DEFAULT,
  ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "treatment_methods"
  ALTER COLUMN "id" DROP DEFAULT,
  ALTER COLUMN "updated_at" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "clinical_cases_is_published_patient_consent_public_display_orde"
  RENAME TO "clinical_cases_is_published_patient_consent_public_display__idx";
