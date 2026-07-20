-- Extend the appointment consistency protocol to patient and organization lifecycle changes.
CREATE FUNCTION lock_patient_booking_context() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE org uuid; patient uuid;
BEGIN
  org := COALESCE(NEW."organization_id", OLD."organization_id");
  patient := COALESCE(NEW."patient_profile_id", OLD."patient_profile_id");
  PERFORM pg_advisory_xact_lock(hashtextextended('patient:' || org::text || ':' || patient::text, 0));
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "patient_registration_booking_lock" BEFORE UPDATE OR DELETE ON "organization_patient_profiles" FOR EACH ROW EXECUTE FUNCTION lock_patient_booking_context();

CREATE FUNCTION lock_patient_profile_booking_context() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE registration record;
BEGIN
  FOR registration IN SELECT "organization_id", "patient_profile_id" FROM "organization_patient_profiles" WHERE "patient_profile_id" = COALESCE(NEW."id", OLD."id") ORDER BY "organization_id"
  LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended('patient:' || registration."organization_id"::text || ':' || registration."patient_profile_id"::text, 0));
  END LOOP;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "patient_profile_booking_lock" BEFORE UPDATE OR DELETE ON "patient_profiles" FOR EACH ROW EXECUTE FUNCTION lock_patient_profile_booking_context();

CREATE FUNCTION lock_organization_booking_context() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE doctor uuid;
BEGIN
  FOR doctor IN SELECT "id" FROM "doctors" WHERE "organization_id" = COALESCE(NEW."id", OLD."id") ORDER BY "id"
  LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended(COALESCE(NEW."id", OLD."id")::text || ':' || doctor::text, 0));
  END LOOP;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "organization_booking_lock" BEFORE UPDATE OR DELETE ON "organizations" FOR EACH ROW EXECUTE FUNCTION lock_organization_booking_context();
