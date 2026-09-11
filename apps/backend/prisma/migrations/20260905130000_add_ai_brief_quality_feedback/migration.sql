CREATE TYPE "AiBriefFeedback" AS ENUM ('HELPFUL', 'INACCURATE', 'MISSED_RISK');

ALTER TABLE "patient_ai_briefs"
  ADD COLUMN "source_data" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "model" TEXT,
  ADD COLUMN "feedback" "AiBriefFeedback",
  ADD COLUMN "feedback_note" TEXT,
  ADD COLUMN "reviewed_at" TIMESTAMP(3);
