ALTER TABLE "treatment_plans" ADD COLUMN "email_queued_at" TIMESTAMP(3);

CREATE TABLE "treatment_plan_audits" (
  "id" UUID NOT NULL,
  "treatment_plan_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "changed_by" UUID NOT NULL,
  "previous_data" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "treatment_plan_audits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "treatment_plan_audits_treatment_plan_id_created_at_idx"
ON "treatment_plan_audits"("treatment_plan_id", "created_at");
ALTER TABLE "treatment_plan_audits" ADD CONSTRAINT "treatment_plan_audits_treatment_plan_id_fkey"
FOREIGN KEY ("treatment_plan_id") REFERENCES "treatment_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "invoices_treatment_plan_step_id_active_key"
ON "invoices"("treatment_plan_step_id")
WHERE "treatment_plan_step_id" IS NOT NULL AND "status" NOT IN ('CANCELLED', 'REFUNDED');
