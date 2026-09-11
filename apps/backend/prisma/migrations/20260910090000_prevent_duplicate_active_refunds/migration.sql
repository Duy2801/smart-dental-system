CREATE UNIQUE INDEX "refund_requests_active_appointment_unique"
ON "refund_requests" ("appointment_id")
WHERE "appointment_id" IS NOT NULL AND "status" IN ('PENDING', 'PROCESSING', 'COMPLETED');

CREATE UNIQUE INDEX "refund_requests_active_video_unique"
ON "refund_requests" ("video_consultation_id")
WHERE "video_consultation_id" IS NOT NULL AND "status" IN ('PENDING', 'PROCESSING', 'COMPLETED');
