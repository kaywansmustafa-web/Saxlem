CREATE TYPE "AppointmentType" AS ENUM ('initial', 'followUp');
ALTER TYPE "AppointmentStatus" RENAME VALUE 'checkedIn' TO 'confirmed';

ALTER TABLE "appointments"
  ADD COLUMN "type" "AppointmentType" NOT NULL DEFAULT 'initial',
  ADD COLUMN "reason" TEXT NOT NULL DEFAULT 'General consultation',
  ADD COLUMN "ends_at" TIMESTAMPTZ(3),
  ADD COLUMN "cancellation_reason" TEXT,
  ADD COLUMN "cancelled_at" TIMESTAMPTZ(3);
UPDATE "appointments" SET "ends_at" = "starts_at" + make_interval(mins => "duration_minutes");
ALTER TABLE "appointments" ALTER COLUMN "ends_at" SET NOT NULL;
CREATE FUNCTION set_appointment_end() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."ends_at" IS NULL THEN NEW."ends_at" := NEW."starts_at" + make_interval(mins => NEW."duration_minutes"); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "appointment_end_default" BEFORE INSERT ON "appointments" FOR EACH ROW EXECUTE FUNCTION set_appointment_end();

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_time_range_valid" CHECK ("starts_at" < "ends_at"),
  ADD CONSTRAINT "appointments_duration_matches_range" CHECK ("ends_at" = "starts_at" + make_interval(mins => "duration_minutes")),
  ADD CONSTRAINT "appointments_reason_valid" CHECK (char_length(btrim("reason")) BETWEEN 1 AND 500),
  ADD CONSTRAINT "appointments_cancellation_consistent" CHECK (
    ("status" = 'cancelled' AND "cancelled_at" IS NOT NULL AND "cancellation_reason" IS NOT NULL)
    OR ("status" <> 'cancelled' AND "cancelled_at" IS NULL AND "cancellation_reason" IS NULL)
  );

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_no_overlap" EXCLUDE USING gist (
  "organization_id" WITH =, "doctor_id" WITH =, tstzrange("starts_at", "ends_at", '[)') WITH &&
) WHERE ("status" IN ('scheduled', 'confirmed'));
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_no_overlap" EXCLUDE USING gist (
  "patient_profile_id" WITH =, tstzrange("starts_at", "ends_at", '[)') WITH &&
) WHERE ("status" IN ('scheduled', 'confirmed'));

CREATE SEQUENCE "appointment_reference_sequence" AS BIGINT NO CYCLE;
CREATE FUNCTION generate_appointment_reference() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."public_reference" IS NULL OR btrim(NEW."public_reference") = '' THEN
    NEW."public_reference" := 'SX-' || to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY') || '-' || lpad(nextval('appointment_reference_sequence')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "appointment_reference_generate" BEFORE INSERT ON "appointments"
  FOR EACH ROW EXECUTE FUNCTION generate_appointment_reference();
CREATE FUNCTION preserve_appointment_reference() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."public_reference" <> OLD."public_reference" THEN
    RAISE EXCEPTION 'Appointment reference is immutable';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "appointment_reference_immutable" BEFORE UPDATE OF "public_reference" ON "appointments"
  FOR EACH ROW EXECUTE FUNCTION preserve_appointment_reference();

CREATE FUNCTION enforce_appointment_active_context() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "organizations" o JOIN "clinics" c ON c."organization_id" = o."id"
    JOIN "doctors" d ON d."organization_id" = o."id"
    JOIN "doctor_clinic_assignments" a ON a."organization_id" = o."id" AND a."clinic_id" = c."id" AND a."doctor_id" = d."id"
    JOIN "organization_patient_profiles" p ON p."organization_id" = o."id" AND p."patient_profile_id" = NEW."patient_profile_id"
    JOIN "patient_profiles" pp ON pp."id" = p."patient_profile_id"
    WHERE o."id" = NEW."organization_id" AND c."id" = NEW."clinic_id" AND d."id" = NEW."doctor_id"
      AND o."status" = 'active' AND c."status" = 'active' AND d."status" = 'active' AND pp."status" = 'active'
  ) THEN RAISE EXCEPTION 'Appointment requires active tenant participants and doctor assignment'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "appointment_active_context" BEFORE INSERT OR UPDATE OF "organization_id", "clinic_id", "doctor_id", "patient_profile_id" ON "appointments"
  FOR EACH ROW EXECUTE FUNCTION enforce_appointment_active_context();
