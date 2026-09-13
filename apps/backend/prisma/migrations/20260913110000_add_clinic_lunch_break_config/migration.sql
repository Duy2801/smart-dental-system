INSERT INTO "clinic_config" (
  "id",
  "config_type",
  "config_key",
  "config_value",
  "updated_at"
)
VALUES (
  '8f4db36d-5579-4dc6-9d5a-f933334c1641',
  'CLINIC_PROFILE',
  'clinic.lunchBreak',
  '{"isEnabled":true,"start":"12:00","end":"13:30"}',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("config_key") DO NOTHING;
