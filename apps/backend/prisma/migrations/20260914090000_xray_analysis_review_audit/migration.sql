ALTER TABLE "ai_xray_analysis_audits"
  ADD COLUMN "image_snapshot" JSONB,
  ADD COLUMN "result_snapshot" JSONB,
  ADD COLUMN "reviewed_findings" JSONB,
  ADD COLUMN "reviewed_by" UUID,
  ADD COLUMN "reviewed_at" TIMESTAMP(3);
