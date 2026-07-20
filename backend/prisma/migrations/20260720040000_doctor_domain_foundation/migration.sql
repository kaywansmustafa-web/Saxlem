-- Sprint 13E: authoritative, tenant-safe doctor directory foundation.
CREATE TYPE "DoctorGender" AS ENUM ('female', 'male', 'unspecified');
CREATE TYPE "DoctorStatus" AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE "DoctorAvailabilityStatus" AS ENUM ('available', 'unavailable');

ALTER TABLE "doctors"
  ADD COLUMN "organization_id" UUID,
  ADD COLUMN "first_name" TEXT,
  ADD COLUMN "last_name" TEXT,
  ADD COLUMN "gender" "DoctorGender" NOT NULL DEFAULT 'unspecified',
  ADD COLUMN "status" "DoctorStatus" NOT NULL DEFAULT 'active',
  ADD COLUMN "license_number" TEXT,
  ADD COLUMN "years_of_experience" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "biography" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY['english']::TEXT[],
  ADD COLUMN "profile_photo_key" TEXT,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

UPDATE "doctors" d SET
  "organization_id" = source."organization_id",
  "first_name" = d."display_name",
  "last_name" = 'Unknown',
  "license_number" = 'LEGACY-' || replace(d."id"::TEXT, '-', '')
FROM (
  SELECT "doctor_id", min("organization_id"::TEXT)::UUID AS "organization_id"
  FROM "doctor_clinic_assignments" GROUP BY "doctor_id"
) source
WHERE source."doctor_id" = d."id";

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "doctors" WHERE "organization_id" IS NULL) THEN
    RAISE EXCEPTION 'Every existing doctor must have a clinic assignment before Sprint 13E migration';
  END IF;
END $$;

ALTER TABLE "doctors"
  ALTER COLUMN "organization_id" SET NOT NULL,
  ALTER COLUMN "first_name" SET NOT NULL,
  ALTER COLUMN "last_name" SET NOT NULL,
  ALTER COLUMN "license_number" SET NOT NULL,
  ADD CONSTRAINT "doctors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "doctors_display_name_check" CHECK (char_length(btrim("display_name")) BETWEEN 1 AND 120),
  ADD CONSTRAINT "doctors_license_number_check" CHECK ("license_number" ~ '^[A-Za-z0-9][A-Za-z0-9./-]{2,63}$'),
  ADD CONSTRAINT "doctors_years_of_experience_check" CHECK ("years_of_experience" BETWEEN 0 AND 80),
  ADD CONSTRAINT "doctors_biography_check" CHECK (char_length("biography") <= 4000),
  ADD CONSTRAINT "doctors_languages_check" CHECK (cardinality("languages") BETWEEN 1 AND 10 AND "languages" <@ ARRAY['badiniKurdish','soraniKurdish','arabic','english','turkish']::TEXT[]),
  ADD CONSTRAINT "doctors_version_check" CHECK ("version" > 0);

CREATE UNIQUE INDEX "doctors_organization_id_id_key" ON "doctors"("organization_id", "id");
CREATE UNIQUE INDEX "doctors_organization_id_license_number_key" ON "doctors"("organization_id", "license_number");
CREATE INDEX "doctors_organization_id_status_display_name_idx" ON "doctors"("organization_id", "status", "display_name");

ALTER TABLE "doctor_clinic_assignments" DROP CONSTRAINT "doctor_clinic_assignments_doctor_id_fkey";
ALTER TABLE "doctor_clinic_assignments" ADD CONSTRAINT "doctor_clinic_assignments_organization_id_doctor_id_fkey"
  FOREIGN KEY ("organization_id", "doctor_id") REFERENCES "doctors"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "doctor_schedules" DROP CONSTRAINT "doctor_schedules_doctor_id_fkey";
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_organization_id_doctor_id_fkey"
  FOREIGN KEY ("organization_id", "doctor_id") REFERENCES "doctors"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "specialties" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "specialties_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "specialties_code_check" CHECK ("code" ~ '^[a-z][a-z0-9-]{1,63}$'),
  CONSTRAINT "specialties_display_name_check" CHECK (char_length(btrim("display_name")) BETWEEN 1 AND 120)
);
CREATE UNIQUE INDEX "specialties_code_key" ON "specialties"("code");
CREATE INDEX "specialties_status_display_name_idx" ON "specialties"("status", "display_name");

CREATE TABLE "doctor_specialties" (
  "doctor_id" UUID NOT NULL,
  "specialty_id" UUID NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "doctor_specialties_pkey" PRIMARY KEY ("doctor_id", "specialty_id"),
  CONSTRAINT "doctor_specialties_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_specialties_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "doctor_specialties_specialty_id_doctor_id_idx" ON "doctor_specialties"("specialty_id", "doctor_id");
CREATE UNIQUE INDEX "doctor_specialties_one_primary_key" ON "doctor_specialties"("doctor_id") WHERE "is_primary";

INSERT INTO "specialties" ("id", "code", "display_name", "updated_at")
SELECT gen_random_uuid(), "specialty_code", initcap(replace("specialty_code", '-', ' ')), CURRENT_TIMESTAMP
FROM "doctors" GROUP BY "specialty_code";
INSERT INTO "doctor_specialties" ("doctor_id", "specialty_id", "is_primary")
SELECT d."id", s."id", true FROM "doctors" d JOIN "specialties" s ON s."code" = d."specialty_code";
ALTER TABLE "doctors" DROP COLUMN "specialty_code";

CREATE TABLE "doctor_availability_foundation" (
  "doctor_id" UUID NOT NULL,
  "status" "DoctorAvailabilityStatus" NOT NULL DEFAULT 'unavailable',
  "accepting_new_patients" BOOLEAN NOT NULL DEFAULT false,
  "next_available_at" TIMESTAMPTZ(3),
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "doctor_availability_foundation_pkey" PRIMARY KEY ("doctor_id"),
  CONSTRAINT "doctor_availability_foundation_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "doctor_availability_foundation_status_next_available_at_idx" ON "doctor_availability_foundation"("status", "next_available_at");

CREATE FUNCTION enforce_doctor_availability_status() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" = 'available' AND NOT EXISTS (SELECT 1 FROM "doctors" WHERE "id" = NEW."doctor_id" AND "status" = 'active') THEN
    RAISE EXCEPTION 'Only active doctors may be available';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "doctor_availability_active_only" BEFORE INSERT OR UPDATE ON "doctor_availability_foundation"
  FOR EACH ROW EXECUTE FUNCTION enforce_doctor_availability_status();

CREATE FUNCTION enforce_doctor_status_availability() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" <> 'active' AND EXISTS (SELECT 1 FROM "doctor_availability_foundation" WHERE "doctor_id" = NEW."id" AND "status" = 'available') THEN
    RAISE EXCEPTION 'Available doctors must be made unavailable before deactivation or archival';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "doctor_status_availability_guard" BEFORE UPDATE OF "status" ON "doctors"
  FOR EACH ROW EXECUTE FUNCTION enforce_doctor_status_availability();

CREATE FUNCTION enforce_doctor_has_clinic() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "doctor_clinic_assignments" WHERE "doctor_id" = NEW."id" AND "organization_id" = NEW."organization_id") THEN
    RAISE EXCEPTION 'Every doctor must belong to at least one clinic in the doctor organization';
  END IF;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER "doctor_requires_clinic" AFTER INSERT OR UPDATE ON "doctors"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION enforce_doctor_has_clinic();

CREATE FUNCTION prevent_last_doctor_clinic_removal() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "doctors" WHERE "id" = OLD."doctor_id")
     AND NOT EXISTS (SELECT 1 FROM "doctor_clinic_assignments" WHERE "doctor_id" = OLD."doctor_id") THEN
    RAISE EXCEPTION 'The final clinic assignment cannot be removed from a doctor';
  END IF;
  RETURN OLD;
END $$;
CREATE CONSTRAINT TRIGGER "doctor_keeps_clinic" AFTER DELETE OR UPDATE ON "doctor_clinic_assignments"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION prevent_last_doctor_clinic_removal();

CREATE FUNCTION prevent_doctor_physical_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Doctors must be archived, never physically deleted'; END $$;
CREATE TRIGGER "doctors_soft_delete_only" BEFORE DELETE ON "doctors"
  FOR EACH ROW EXECUTE FUNCTION prevent_doctor_physical_delete();
