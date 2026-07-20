-- AlterTable
ALTER TABLE "session_families" ADD COLUMN     "clinic_id" UUID,
ADD COLUMN     "expires_at" TIMESTAMPTZ(3),
ADD COLUMN     "organization_id" UUID,
ADD COLUMN     "role" "IdentityRole";

-- Backfill legacy families from an active scoped membership when possible.
UPDATE "session_families" AS sf
SET "expires_at" = sf."created_at" + INTERVAL '90 days',
    "role" = COALESCE(
      (SELECT ira."role" FROM "identity_role_assignments" ira
       WHERE ira."user_id" = sf."user_id"
       ORDER BY CASE WHEN ira."role" = 'patient' THEN 0 ELSE 1 END
       LIMIT 1),
      'patient'::"IdentityRole"
    );

WITH membership AS (
  SELECT DISTINCT ON (cm."user_id", cm."role")
    cm."user_id", cm."role", cm."organization_id", cm."clinic_id"
  FROM "clinic_memberships" cm
  WHERE cm."status" = 'active'
  ORDER BY cm."user_id", cm."role", cm."created_at"
)
UPDATE "identity_role_assignments" AS ira
SET "organization_id" = membership."organization_id",
    "clinic_id" = membership."clinic_id"
FROM membership
WHERE ira."role" IN ('receptionist', 'doctor', 'clinicManager')
  AND membership."user_id" = ira."user_id"
  AND membership."role" = ira."role"::text
  AND (ira."organization_id" IS NULL OR ira."clinic_id" IS NULL);

UPDATE "session_families" AS sf
SET "organization_id" = assignment."organization_id",
    "clinic_id" = assignment."clinic_id"
FROM "identity_role_assignments" assignment
WHERE sf."role" IN ('receptionist', 'doctor', 'clinicManager')
  AND assignment."user_id" = sf."user_id"
  AND assignment."role" = sf."role";

ALTER TABLE "session_families"
  ALTER COLUMN "expires_at" SET NOT NULL,
  ALTER COLUMN "role" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "authorization_version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "role_version" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "identity_role_assignments" ADD CONSTRAINT "identity_role_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_role_assignments" ADD CONSTRAINT "identity_role_assignments_organization_id_clinic_id_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "session_families" ADD CONSTRAINT "session_families_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_families" ADD CONSTRAINT "session_families_organization_id_clinic_id_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "identity_role_assignments" ADD CONSTRAINT "identity_role_scope_check" CHECK (
  ("role" IN ('patient', 'platformAdministrator') AND "organization_id" IS NULL AND "clinic_id" IS NULL)
  OR
  ("role" IN ('receptionist', 'doctor', 'clinicManager') AND "organization_id" IS NOT NULL AND "clinic_id" IS NOT NULL)
);

ALTER TABLE "session_families" ADD CONSTRAINT "session_family_scope_check" CHECK (
  ("role" IN ('patient', 'platformAdministrator') AND "organization_id" IS NULL AND "clinic_id" IS NULL)
  OR
  ("role" IN ('receptionist', 'doctor', 'clinicManager') AND "organization_id" IS NOT NULL AND "clinic_id" IS NOT NULL)
);
