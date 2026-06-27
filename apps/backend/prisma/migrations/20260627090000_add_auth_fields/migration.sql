-- Allow Google-only accounts and keep the Google subject identifier unique.
ALTER TABLE "users"
  ALTER COLUMN "password_hash" DROP NOT NULL,
  ADD COLUMN "google_id" TEXT;

CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
