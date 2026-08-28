CREATE TABLE "ai_xray_analysis_audits" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "doctor_id" UUID,
    "patient_id" UUID NOT NULL,
    "medical_record_id" UUID NOT NULL,
    "image_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "error_status" TEXT,
    "model_version" TEXT NOT NULL,
    "finding_count" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_xray_analysis_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_xray_analysis_audits_user_id_created_at_idx"
ON "ai_xray_analysis_audits"("user_id", "created_at");

CREATE INDEX "ai_xray_analysis_audits_patient_id_created_at_idx"
ON "ai_xray_analysis_audits"("patient_id", "created_at");

CREATE INDEX "ai_xray_analysis_audits_image_id_created_at_idx"
ON "ai_xray_analysis_audits"("image_id", "created_at");
