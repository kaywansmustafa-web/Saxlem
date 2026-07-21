-- Forward-only correction: assignments and registrations are existence records
-- and do not carry a status column in the authoritative schema.
CREATE OR REPLACE FUNCTION enforce_arrival_lifecycle() RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."status" <> 'expected' OR NEW."version" <> 1 OR NEW."arrived_at" IS NOT NULL OR NEW."queue_ready_at" IS NOT NULL THEN
      RAISE EXCEPTION 'Arrival must begin in expected state';
    END IF;
    IF NOT EXISTS (
      SELECT 1
      FROM public."appointments" appointment
      JOIN public."organizations" organization
        ON organization."id" = appointment."organization_id"
      JOIN public."clinics" clinic
        ON clinic."organization_id" = appointment."organization_id"
       AND clinic."id" = appointment."clinic_id"
      JOIN public."doctor_clinic_assignments" assignment
        ON assignment."organization_id" = appointment."organization_id"
       AND assignment."clinic_id" = appointment."clinic_id"
       AND assignment."doctor_id" = appointment."doctor_id"
      JOIN public."doctors" doctor
        ON doctor."organization_id" = assignment."organization_id"
       AND doctor."id" = assignment."doctor_id"
      JOIN public."organization_patient_profiles" registration
        ON registration."organization_id" = appointment."organization_id"
       AND registration."patient_profile_id" = appointment."patient_profile_id"
      JOIN public."patient_profiles" patient
        ON patient."id" = registration."patient_profile_id"
      WHERE appointment."id" = NEW."appointment_id"
        AND appointment."organization_id" = NEW."organization_id"
        AND appointment."clinic_id" = NEW."clinic_id"
        AND appointment."patient_profile_id" = NEW."patient_profile_id"
        AND appointment."status" IN ('scheduled', 'confirmed')
        AND organization."status" = 'active'
        AND clinic."status" = 'active'
        AND doctor."status" = 'active'
        AND patient."status" = 'active'
    ) THEN
      RAISE EXCEPTION 'Arrival requires an eligible active appointment context';
    END IF;
    RETURN NEW;
  END IF;
  IF ROW(NEW."organization_id", NEW."clinic_id", NEW."appointment_id", NEW."patient_profile_id") IS DISTINCT FROM
     ROW(OLD."organization_id", OLD."clinic_id", OLD."appointment_id", OLD."patient_profile_id") THEN
    RAISE EXCEPTION 'Arrival identity and tenant fields are immutable';
  END IF;
  IF NEW."version" <> OLD."version" + 1 THEN RAISE EXCEPTION 'Arrival change requires version increment by one'; END IF;
  IF OLD."arrived_at" IS NOT NULL AND NEW."arrived_at" IS DISTINCT FROM OLD."arrived_at" THEN RAISE EXCEPTION 'Arrival timestamp is immutable'; END IF;
  IF NOT ((OLD."status" = 'expected' AND NEW."status" = 'arrived') OR (OLD."status" = 'arrived' AND NEW."status" = 'queueReady')) THEN
    RAISE EXCEPTION 'Invalid arrival lifecycle transition';
  END IF;
  IF NEW."status" = 'arrived' AND (NEW."arrived_at" IS NULL OR NEW."queue_ready_at" IS NOT NULL) THEN RAISE EXCEPTION 'Arrived state requires only arrival timestamp'; END IF;
  IF NEW."status" = 'queueReady' AND (NEW."arrived_at" IS NULL OR NEW."queue_ready_at" IS NULL) THEN RAISE EXCEPTION 'Queue-ready state requires arrival timestamps'; END IF;
  RETURN NEW;
END $$;
