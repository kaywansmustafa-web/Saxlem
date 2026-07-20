-- Holidays are clinic-effective rules. Keep their overlap invariant aligned with projection scope.
ALTER TABLE "doctor_holidays"
  DROP CONSTRAINT "doctor_holidays_no_overlap";
ALTER TABLE "doctor_holidays"
  ADD CONSTRAINT "doctor_holidays_no_overlap"
  EXCLUDE USING gist (
    "organization_id" WITH =,
    "clinic_id" WITH =,
    "doctor_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  ) WHERE ("status" = 'active');
