-- Số giấy phép không còn bắt buộc khi tạo bác sĩ
ALTER TABLE "doctors" ALTER COLUMN "license_number" DROP NOT NULL;
