-- AlterTable
ALTER TABLE "services"
ADD COLUMN "detail_summary" TEXT,
ADD COLUMN "highlights" JSONB,
ADD COLUMN "suitable_for" JSONB,
ADD COLUMN "included_items" JSONB,
ADD COLUMN "preparation_notes" JSONB,
ADD COLUMN "aftercare_notes" JSONB,
ADD COLUMN "important_notes" JSONB,
ADD COLUMN "pricing_note" TEXT;
