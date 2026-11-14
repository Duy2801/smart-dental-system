-- Gộp ảnh đại diện vào icon (icon là hình app bệnh nhân hiển thị).
-- Chỉ chép sang những dịch vụ chưa có icon, rồi bỏ cột thumbnail_url.
UPDATE "services"
SET "icon" = "thumbnail_url"
WHERE ("icon" IS NULL OR "icon" = '')
  AND "thumbnail_url" IS NOT NULL
  AND "thumbnail_url" <> '';

ALTER TABLE "services" DROP COLUMN "thumbnail_url";
