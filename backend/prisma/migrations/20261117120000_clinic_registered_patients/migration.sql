-- Patients who phone the clinic or walk in without the Saxlem app.
-- Reception registers them; they have no app account until they sign up.
ALTER TABLE "patient_profiles"
  ALTER COLUMN "patient_account_id" DROP NOT NULL,
  ALTER COLUMN "date_of_birth" DROP NOT NULL,
  ADD COLUMN "registered_by_organization_id" UUID,
  ADD COLUMN "contact_phone_number" TEXT;

ALTER TABLE "patient_profiles"
  ADD CONSTRAINT "patient_profiles_registered_by_organization_id_fkey"
  FOREIGN KEY ("registered_by_organization_id") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Either an app profile (account + date of birth) or a clinic-registered
-- profile (organization + normalized phone), never a mix.
ALTER TABLE "patient_profiles"
  ADD CONSTRAINT "patient_profiles_app_profile_check" CHECK (
    (
      "patient_account_id" IS NOT NULL
      AND "date_of_birth" IS NOT NULL
      AND "registered_by_organization_id" IS NULL
      AND "contact_phone_number" IS NULL
    )
    OR (
      "patient_account_id" IS NULL
      AND "registered_by_organization_id" IS NOT NULL
      AND "contact_phone_number" ~ '^\+9647[0-9]{9}$'
    )
  );

CREATE INDEX "patient_profiles_clinic_contact_idx"
  ON "patient_profiles"("registered_by_organization_id", "contact_phone_number");
