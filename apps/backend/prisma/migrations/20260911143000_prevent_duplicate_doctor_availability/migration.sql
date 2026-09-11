CREATE UNIQUE INDEX "doctor_availability_weekly_slot_key"
ON "doctor_availability" ("doctor_id", "record_type", "day_of_week", "start_time", "end_time")
WHERE "specific_date" IS NULL;

CREATE UNIQUE INDEX "doctor_availability_date_slot_key"
ON "doctor_availability" ("doctor_id", "record_type", "specific_date", "start_time", "end_time")
WHERE "specific_date" IS NOT NULL;
