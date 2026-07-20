-- Sprint 13D: authoritative patient profiles and active-patient selection.
CREATE TYPE "PatientGender" AS ENUM ('female', 'male', 'unspecified');
CREATE TYPE "FamilyRelationshipType" AS ENUM (
  'self', 'mother', 'father', 'son', 'daughter', 'brother', 'sister',
  'grandfather', 'grandmother', 'wife', 'husband', 'other'
);

ALTER TABLE "patient_profiles"
  ADD COLUMN "gender" "PatientGender" NOT NULL DEFAULT 'unspecified',
  ADD COLUMN "status" "RecordStatus" NOT NULL DEFAULT 'active',
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD CONSTRAINT "patient_profiles_date_of_birth_check" CHECK ("date_of_birth" <= CURRENT_DATE),
  ADD CONSTRAINT "patient_profiles_version_check" CHECK ("version" > 0),
  ADD CONSTRAINT "patient_profiles_first_name_length_check" CHECK (char_length(btrim("first_name")) BETWEEN 1 AND 80),
  ADD CONSTRAINT "patient_profiles_last_name_length_check" CHECK (char_length(btrim("last_name")) BETWEEN 1 AND 80);

ALTER TABLE "family_relationships"
  ALTER COLUMN "relationship" TYPE "FamilyRelationshipType"
  USING "relationship"::"FamilyRelationshipType";

CREATE UNIQUE INDEX "patient_profiles_patient_account_id_id_key"
  ON "patient_profiles"("patient_account_id", "id");
CREATE INDEX "patient_profiles_patient_account_id_status_idx"
  ON "patient_profiles"("patient_account_id", "status");
CREATE UNIQUE INDEX "family_relationships_one_self_per_account_key"
  ON "family_relationships"("patient_account_id") WHERE "relationship" = 'self';

ALTER TABLE "family_relationships"
  DROP CONSTRAINT "family_relationships_patient_profile_id_fkey",
  ADD CONSTRAINT "family_relationships_patient_account_id_patient_profile_id_fkey"
    FOREIGN KEY ("patient_account_id", "patient_profile_id")
    REFERENCES "patient_profiles"("patient_account_id", "id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "patient_account_active_profile" (
  "patient_account_id" UUID NOT NULL,
  "patient_profile_id" UUID NOT NULL,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "patient_account_active_profile_pkey" PRIMARY KEY ("patient_account_id")
);
CREATE UNIQUE INDEX "patient_account_active_profile_patient_profile_id_key"
  ON "patient_account_active_profile"("patient_profile_id");
CREATE UNIQUE INDEX "patient_account_active_profile_patient_account_id_patient_profile_id_key"
  ON "patient_account_active_profile"("patient_account_id", "patient_profile_id");
ALTER TABLE "patient_account_active_profile"
  ADD CONSTRAINT "patient_account_active_profile_patient_account_id_fkey"
    FOREIGN KEY ("patient_account_id") REFERENCES "patient_accounts"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "patient_account_active_profile_account_profile_fkey"
    FOREIGN KEY ("patient_account_id", "patient_profile_id")
    REFERENCES "patient_profiles"("patient_account_id", "id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
