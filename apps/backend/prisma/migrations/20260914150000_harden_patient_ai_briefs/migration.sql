ALTER TABLE "patient_ai_briefs"
  ADD COLUMN "appointment_id" UUID,
  ADD COLUMN "bullet_sources" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "risk_sources" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "context_fingerprint" TEXT,
  ADD COLUMN "reviewed_by" UUID;

CREATE INDEX "patient_ai_briefs_appointment_id_created_at_idx"
  ON "patient_ai_briefs"("appointment_id", "created_at");
CREATE INDEX "patient_ai_briefs_reviewed_by_reviewed_at_idx"
  ON "patient_ai_briefs"("reviewed_by", "reviewed_at");

ALTER TABLE "patient_ai_briefs"
  ADD CONSTRAINT "patient_ai_briefs_appointment_id_fkey"
  FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "patient_ai_briefs"
  ADD CONSTRAINT "patient_ai_briefs_reviewed_by_fkey"
  FOREIGN KEY ("reviewed_by") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
