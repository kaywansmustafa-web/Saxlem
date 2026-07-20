-- Sprint 13G.5: forward-only appointment hardening.
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_duration_minutes_positive";
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_duration_minutes_bounded" CHECK ("duration_minutes" BETWEEN 5 AND 480);
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cancellation_reason_valid" CHECK (
  "cancellation_reason" IS NULL OR char_length(btrim("cancellation_reason")) BETWEEN 1 AND 500
);

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organization_id_id_key" UNIQUE ("organization_id", "id");
ALTER TABLE "appointment_events" DROP CONSTRAINT "appointment_events_appointment_id_fkey";
ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_organization_id_appointment_id_fkey"
  FOREIGN KEY ("organization_id", "appointment_id") REFERENCES "appointments"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION reject_appointment_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Appointments cannot be physically deleted'; END $$;
CREATE TRIGGER "appointment_no_delete" BEFORE DELETE ON "appointments" FOR EACH ROW EXECUTE FUNCTION reject_appointment_delete();

DROP TRIGGER "appointment_reference_generate" ON "appointments";
CREATE FUNCTION generate_appointment_reference_strict() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."public_reference" IS NOT NULL AND btrim(NEW."public_reference") <> '' THEN
    RAISE EXCEPTION 'Appointment reference must not be supplied by callers';
  END IF;
  NEW."public_reference" := 'SX-' || to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY') || '-' || lpad(nextval('appointment_reference_sequence')::text, 6, '0');
  RETURN NEW;
END $$;
CREATE TRIGGER "appointment_reference_generate" BEFORE INSERT ON "appointments"
  FOR EACH ROW EXECUTE FUNCTION generate_appointment_reference_strict();

CREATE FUNCTION enforce_appointment_lifecycle_and_version() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE protected_changed boolean;
BEGIN
  protected_changed := ROW(NEW."clinic_id", NEW."doctor_id", NEW."patient_profile_id", NEW."type", NEW."reason", NEW."starts_at", NEW."ends_at", NEW."duration_minutes", NEW."fee_iqd", NEW."status", NEW."cancellation_reason", NEW."cancelled_at")
    IS DISTINCT FROM ROW(OLD."clinic_id", OLD."doctor_id", OLD."patient_profile_id", OLD."type", OLD."reason", OLD."starts_at", OLD."ends_at", OLD."duration_minutes", OLD."fee_iqd", OLD."status", OLD."cancellation_reason", OLD."cancelled_at");
  IF protected_changed AND NEW."version" <> OLD."version" + 1 THEN RAISE EXCEPTION 'Protected appointment changes require version increment by one'; END IF;
  IF OLD."status" IN ('cancelled', 'completed', 'noShow') AND protected_changed THEN RAISE EXCEPTION 'Terminal appointments cannot be modified'; END IF;
  IF NEW."status" <> OLD."status" AND NOT (
    (OLD."status" = 'scheduled' AND NEW."status" IN ('confirmed', 'cancelled', 'noShow')) OR
    (OLD."status" = 'confirmed' AND NEW."status" IN ('cancelled', 'completed', 'noShow'))
  ) THEN RAISE EXCEPTION 'Invalid appointment lifecycle transition'; END IF;
  IF NEW."status" = 'cancelled' AND (NEW."cancelled_at" IS NULL OR NEW."cancellation_reason" IS NULL OR btrim(NEW."cancellation_reason") = '') THEN
    RAISE EXCEPTION 'Cancelled appointments require a timestamp and reason';
  END IF;
  IF NEW."status" <> 'cancelled' AND (NEW."cancelled_at" IS NOT NULL OR NEW."cancellation_reason" IS NOT NULL) THEN
    RAISE EXCEPTION 'Cancellation details are only valid for cancelled appointments';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "appointment_lifecycle_version_guard" BEFORE UPDATE ON "appointments"
  FOR EACH ROW EXECUTE FUNCTION enforce_appointment_lifecycle_and_version();

CREATE FUNCTION lock_doctor_schedule_context() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pair record;
BEGIN
  FOR pair IN
    SELECT DISTINCT organization_id, doctor_id FROM (
      SELECT OLD."organization_id" organization_id, OLD."doctor_id" doctor_id WHERE TG_OP <> 'INSERT'
      UNION ALL
      SELECT NEW."organization_id", NEW."doctor_id" WHERE TG_OP <> 'DELETE'
    ) contexts ORDER BY organization_id, doctor_id
  LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended(pair.organization_id::text || ':' || pair.doctor_id::text, 0));
  END LOOP;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "appointment_schedule_lock" BEFORE INSERT OR UPDATE ON "appointments" FOR EACH ROW EXECUTE FUNCTION lock_doctor_schedule_context();
CREATE TRIGGER "weekly_schedule_booking_lock" BEFORE INSERT OR UPDATE OR DELETE ON "doctor_weekly_schedule" FOR EACH ROW EXECUTE FUNCTION lock_doctor_schedule_context();
CREATE TRIGGER "doctor_break_booking_lock" BEFORE INSERT OR UPDATE OR DELETE ON "doctor_breaks" FOR EACH ROW EXECUTE FUNCTION lock_doctor_schedule_context();
CREATE TRIGGER "doctor_leave_booking_lock" BEFORE INSERT OR UPDATE OR DELETE ON "doctor_leave" FOR EACH ROW EXECUTE FUNCTION lock_doctor_schedule_context();
CREATE TRIGGER "doctor_holiday_booking_lock" BEFORE INSERT OR UPDATE OR DELETE ON "doctor_holidays" FOR EACH ROW EXECUTE FUNCTION lock_doctor_schedule_context();
CREATE TRIGGER "doctor_exception_booking_lock" BEFORE INSERT OR UPDATE OR DELETE ON "doctor_schedule_exceptions" FOR EACH ROW EXECUTE FUNCTION lock_doctor_schedule_context();

CREATE FUNCTION lock_doctor_record() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(COALESCE(NEW."organization_id", OLD."organization_id")::text || ':' || COALESCE(NEW."id", OLD."id")::text, 0));
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "doctor_booking_lock" BEFORE UPDATE OR DELETE ON "doctors" FOR EACH ROW EXECUTE FUNCTION lock_doctor_record();
CREATE TRIGGER "doctor_assignment_booking_lock" BEFORE INSERT OR UPDATE OR DELETE ON "doctor_clinic_assignments" FOR EACH ROW EXECUTE FUNCTION lock_doctor_schedule_context();

CREATE FUNCTION lock_clinic_booking_context() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE org uuid; clinic uuid; doctor uuid;
BEGIN
  org := COALESCE(NEW."organization_id", OLD."organization_id");
  IF TG_TABLE_NAME = 'clinics' THEN
    clinic := COALESCE(NEW."id", OLD."id");
  ELSE
    clinic := COALESCE(NEW."clinic_id", OLD."clinic_id");
  END IF;
  FOR doctor IN SELECT "doctor_id" FROM "doctor_clinic_assignments" WHERE "organization_id" = org AND "clinic_id" = clinic ORDER BY "doctor_id"
  LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended(org::text || ':' || doctor::text, 0));
  END LOOP;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "clinic_booking_lock" BEFORE UPDATE OR DELETE ON "clinics" FOR EACH ROW EXECUTE FUNCTION lock_clinic_booking_context();
CREATE TRIGGER "clinic_hours_booking_lock" BEFORE INSERT OR UPDATE OR DELETE ON "clinic_working_hours" FOR EACH ROW EXECUTE FUNCTION lock_clinic_booking_context();
