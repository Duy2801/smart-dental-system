-- Move user-role membership from the many-to-many join table to one primary role per user.
ALTER TABLE "users" ADD COLUMN "role_id" UUID;
ALTER TABLE "users" ADD COLUMN "role_assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "users" ADD COLUMN "role_assigned_by" UUID;

WITH ranked_user_roles AS (
  SELECT
    ur."user_id",
    ur."role_id",
    ur."assigned_at",
    ur."assigned_by",
    ROW_NUMBER() OVER (
      PARTITION BY ur."user_id"
      ORDER BY
        CASE r."code"
          WHEN 'ADMIN' THEN 1
          WHEN 'DOCTOR' THEN 2
          WHEN 'RECEPTIONIST' THEN 3
          WHEN 'PATIENT' THEN 4
          ELSE 5
        END,
        ur."assigned_at" ASC
    ) AS rn
  FROM "user_roles" ur
  INNER JOIN "roles" r ON r."id" = ur."role_id"
)
UPDATE "users" u
SET
  "role_id" = ranked_user_roles."role_id",
  "role_assigned_at" = COALESCE(ranked_user_roles."assigned_at", CURRENT_TIMESTAMP),
  "role_assigned_by" = ranked_user_roles."assigned_by"
FROM ranked_user_roles
WHERE u."id" = ranked_user_roles."user_id"
  AND ranked_user_roles.rn = 1;

UPDATE "users" u
SET "role_id" = r."id"
FROM "roles" r
WHERE u."role_id" IS NULL
  AND r."code" = 'PATIENT';

ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL;

DROP TABLE "user_roles";

CREATE INDEX "users_role_id_idx" ON "users"("role_id");
CREATE INDEX "users_role_assigned_by_idx" ON "users"("role_assigned_by");

ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_role_assigned_by_fkey" FOREIGN KEY ("role_assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
