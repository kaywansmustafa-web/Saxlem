ALTER TABLE "queue_sessions"
  ADD COLUMN "recall_grace_minutes" INTEGER NOT NULL DEFAULT 5,
  ADD CONSTRAINT "queue_sessions_recall_grace_bounds"
    CHECK ("recall_grace_minutes" BETWEEN 1 AND 1440);

CREATE OR REPLACE FUNCTION queue_create_session(
  p_organization_id uuid,
  p_clinic_id uuid,
  p_doctor_id uuid,
  p_operational_date date,
  p_effective_timezone text,
  p_recall_grace_minutes integer
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE created_id uuid := gen_random_uuid();
BEGIN
  IF p_effective_timezone IS NULL OR length(p_effective_timezone) > 255
     OR p_recall_grace_minutes NOT BETWEEN 1 AND 1440 THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'invalid queue policy';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.doctor_clinic_assignments dca
    JOIN public.doctors d ON d.id = dca.doctor_id AND d.organization_id = dca.organization_id
    JOIN public.clinics c ON c.id = dca.clinic_id AND c.organization_id = dca.organization_id
    JOIN public.organizations o ON o.id = dca.organization_id
    WHERE dca.organization_id = p_organization_id
      AND dca.clinic_id = p_clinic_id AND dca.doctor_id = p_doctor_id
      AND dca.status = 'active' AND d.status = 'active'
      AND c.status = 'active' AND o.status = 'active'
      AND c.timezone = p_effective_timezone
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'queue session context is unavailable';
  END IF;
  INSERT INTO public.queue_sessions (
    id, organization_id, clinic_id, doctor_id, operational_date,
    effective_timezone, recall_grace_minutes, status
  ) VALUES (
    created_id, p_organization_id, p_clinic_id, p_doctor_id,
    p_operational_date, p_effective_timezone, p_recall_grace_minutes,
    'notStarted'
  );
  RETURN created_id;
END
$function$;
REVOKE ALL ON FUNCTION queue_create_session(uuid,uuid,uuid,date,text,integer)
  FROM PUBLIC;

CREATE OR REPLACE FUNCTION assign_queue_no_response_deadline()
RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $function$
DECLARE grace integer;
BEGIN
  IF NEW.status = 'noResponse' AND OLD.status = 'called' THEN
    SELECT recall_grace_minutes INTO STRICT grace
    FROM public.queue_sessions WHERE id = NEW.queue_session_id;
    NEW.no_response_at := CURRENT_TIMESTAMP;
    NEW.recall_deadline_at :=
      NEW.no_response_at + make_interval(mins => grace);
  END IF;
  RETURN NEW;
END
$function$;
CREATE TRIGGER a_queue_entries_no_response_deadline
BEFORE UPDATE ON "queue_entries" FOR EACH ROW
EXECUTE FUNCTION assign_queue_no_response_deadline();

CREATE OR REPLACE FUNCTION prevent_queue_policy_rewrite()
RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $function$
BEGIN
  IF NEW.recall_grace_minutes <> OLD.recall_grace_minutes THEN
    RAISE EXCEPTION USING ERRCODE = '23514',
      MESSAGE = 'queue recall policy is immutable';
  END IF;
  RETURN NEW;
END
$function$;
CREATE TRIGGER queue_sessions_policy_immutable
BEFORE UPDATE ON "queue_sessions" FOR EACH ROW
EXECUTE FUNCTION prevent_queue_policy_rewrite();

CREATE OR REPLACE FUNCTION enforce_queue_command_side_effects()
RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $function$
DECLARE sid uuid; eid uuid; current_version integer;
BEGIN
  IF TG_TABLE_NAME = 'queue_sessions' THEN
    sid := NEW.id;
    eid := NULL;
    current_version := NEW.version;
  ELSE
    sid := NEW.queue_session_id;
    eid := NEW.id;
    SELECT version INTO STRICT current_version
    FROM public.queue_sessions WHERE id = sid;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.queue_audits qa
    WHERE qa.queue_session_id = sid
      AND (eid IS NULL OR qa.queue_entry_id = eid)
      AND (qa.metadata->>'version')::integer = current_version
  ) OR NOT EXISTS (
    SELECT 1 FROM public.queue_activities qac
    WHERE qac.queue_session_id = sid
      AND (eid IS NULL OR qac.queue_entry_id = eid)
  ) OR NOT EXISTS (
    SELECT 1 FROM public.audit_events ae
    WHERE ae.target_type = 'QueueSession' AND ae.target_id = sid
      AND (ae.metadata->>'version')::integer = current_version
  ) OR NOT EXISTS (
    SELECT 1 FROM public.outbox_events oe
    WHERE oe.aggregate_type = 'QueueSession' AND oe.aggregate_id = sid
      AND (oe.payload->>'queueSessionId')::uuid = sid
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514',
      MESSAGE = 'queue command side effects are incomplete';
  END IF;
  RETURN NULL;
END
$function$;

CREATE CONSTRAINT TRIGGER queue_session_command_side_effects
AFTER UPDATE ON "queue_sessions" DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_queue_command_side_effects();
CREATE CONSTRAINT TRIGGER queue_entry_command_side_effects
AFTER INSERT OR UPDATE ON "queue_entries" DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_queue_command_side_effects();
