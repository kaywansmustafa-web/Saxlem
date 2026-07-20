-- Sprint 13F.5: harden schedule invariants without rewriting the applied foundation migration.

-- A doctor cannot work overlapping local-wall-clock periods at different clinics.
ALTER TABLE "doctor_weekly_schedule"
  DROP CONSTRAINT "doctor_weekly_schedule_no_overlap";
ALTER TABLE "doctor_weekly_schedule"
  ADD CONSTRAINT "doctor_weekly_schedule_no_overlap"
  EXCLUDE USING gist (
    "organization_id" WITH =,
    "doctor_id" WITH =,
    "weekday" WITH =,
    int4range("starts_minute", "ends_minute", '[)') WITH &&
  ) WHERE ("status" = 'active');

-- Holidays are doctor-global absences, even when their source record is associated with a clinic.
ALTER TABLE "doctor_holidays"
  ADD CONSTRAINT "doctor_holidays_no_overlap"
  EXCLUDE USING gist (
    "organization_id" WITH =,
    "doctor_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  ) WHERE ("status" = 'active');

-- Deferred reverse checks protect children when a parent is shrunk, moved, or disabled.
CREATE FUNCTION enforce_all_doctor_periods_within_clinic_hours()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "doctor_weekly_schedule" s
    WHERE s."status" = 'active'
      AND NOT EXISTS (
        SELECT 1
        FROM "clinic_working_hours" h
        WHERE h."organization_id" = s."organization_id"
          AND h."clinic_id" = s."clinic_id"
          AND h."weekday" = s."weekday"
          AND h."status" = 'active'
          AND h."opens_minute" <= s."starts_minute"
          AND h."closes_minute" >= s."ends_minute"
      )
  ) THEN
    RAISE EXCEPTION 'Clinic-hours change would strand an active doctor working period';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE CONSTRAINT TRIGGER "clinic_hours_preserve_doctor_periods"
AFTER UPDATE OR DELETE ON "clinic_working_hours"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_all_doctor_periods_within_clinic_hours();

CREATE FUNCTION enforce_all_breaks_within_doctor_periods()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "doctor_breaks" b
    WHERE b."status" = 'active'
      AND NOT EXISTS (
        SELECT 1
        FROM "doctor_weekly_schedule" s
        WHERE s."organization_id" = b."organization_id"
          AND s."clinic_id" = b."clinic_id"
          AND s."doctor_id" = b."doctor_id"
          AND s."weekday" = b."weekday"
          AND s."status" = 'active'
          AND s."starts_minute" <= b."starts_minute"
          AND s."ends_minute" >= b."ends_minute"
      )
  ) THEN
    RAISE EXCEPTION 'Doctor-period change would strand an active break';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE CONSTRAINT TRIGGER "doctor_periods_preserve_breaks"
AFTER UPDATE OR DELETE ON "doctor_weekly_schedule"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_all_breaks_within_doctor_periods();
