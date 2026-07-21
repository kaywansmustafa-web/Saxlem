-- Sprint 13H formal hardening: bind audit scope and enforce direct-write integrity.
ALTER TABLE "appointment_arrivals"
  ADD CONSTRAINT "arrival_tenant_clinic_key" UNIQUE ("organization_id", "clinic_id", "id");

ALTER TABLE "arrival_audits"
  DROP CONSTRAINT "arrival_audits_arrival_fkey",
  ADD CONSTRAINT "arrival_audits_arrival_fkey"
    FOREIGN KEY ("organization_id", "clinic_id", "arrival_id")
    REFERENCES "appointment_arrivals"("organization_id", "clinic_id", "id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "arrival_audit_transition_key"
    UNIQUE ("arrival_id", "from_status", "to_status");

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
        AND assignment."status" = 'active'
        AND doctor."status" = 'active'
        AND registration."status" = 'active'
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

CREATE FUNCTION enforce_arrival_audit_transition() RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT (
    (NEW."from_status" = 'expected' AND NEW."to_status" = 'arrived') OR
    (NEW."from_status" = 'arrived' AND NEW."to_status" = 'queueReady')
  ) THEN
    RAISE EXCEPTION 'Arrival audit transition is invalid';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public."appointment_arrivals" arrival
    WHERE arrival."id" = NEW."arrival_id"
      AND arrival."organization_id" = NEW."organization_id"
      AND arrival."clinic_id" = NEW."clinic_id"
      AND arrival."status" = NEW."to_status"
  ) THEN
    RAISE EXCEPTION 'Arrival audit does not match authoritative arrival state';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "arrival_audit_transition_guard"
BEFORE INSERT ON "arrival_audits"
FOR EACH ROW EXECUTE FUNCTION enforce_arrival_audit_transition();
