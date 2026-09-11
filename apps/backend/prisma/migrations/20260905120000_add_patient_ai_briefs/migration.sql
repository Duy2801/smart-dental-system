CREATE TABLE "patient_ai_briefs" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID,
    "created_by" UUID NOT NULL,
    "consultation_id" UUID,
    "patient_name" TEXT NOT NULL,
    "bullet_points" JSONB NOT NULL,
    "questions_to_ask" JSONB NOT NULL,
    "risk_flags" JSONB NOT NULL,
    "disclaimer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_ai_briefs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "patient_ai_briefs_patient_id_created_at_idx"
    ON "patient_ai_briefs"("patient_id", "created_at");
CREATE INDEX "patient_ai_briefs_doctor_id_created_at_idx"
    ON "patient_ai_briefs"("doctor_id", "created_at");
CREATE INDEX "patient_ai_briefs_created_by_created_at_idx"
    ON "patient_ai_briefs"("created_by", "created_at");
CREATE INDEX "patient_ai_briefs_consultation_id_created_at_idx"
    ON "patient_ai_briefs"("consultation_id", "created_at");

ALTER TABLE "patient_ai_briefs"
    ADD CONSTRAINT "patient_ai_briefs_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_ai_briefs"
    ADD CONSTRAINT "patient_ai_briefs_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "patient_ai_briefs"
    ADD CONSTRAINT "patient_ai_briefs_doctor_id_fkey"
    FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "patient_ai_briefs"
    ADD CONSTRAINT "patient_ai_briefs_consultation_id_fkey"
    FOREIGN KEY ("consultation_id") REFERENCES "video_consultations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
