-- Sprint 13I.5: forward-only Live Queue structural hardening.
ALTER TABLE "doctor_clinic_assignments"
  ADD COLUMN "status" "RecordStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "organization_patient_profiles"
  ADD COLUMN "status" "RecordStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "queue_sessions"
  ADD COLUMN "effective_timezone" TEXT NOT NULL DEFAULT 'Asia/Baghdad';
UPDATE "queue_sessions" qs
SET "effective_timezone" = c."timezone"
FROM "clinics" c
WHERE c."id" = qs."clinic_id";
ALTER TABLE "queue_entries"
  ADD COLUMN "recall_deadline_at" TIMESTAMPTZ(3);

ALTER TABLE "queue_activities" DROP CONSTRAINT "queue_activities_entry_fkey";
ALTER TABLE "queue_audits" DROP CONSTRAINT "queue_audits_entry_fkey";
ALTER TABLE "queue_entries"
  ADD CONSTRAINT "queue_entry_history_scope_key"
  UNIQUE ("organization_id", "clinic_id", "queue_session_id", "id");
ALTER TABLE "queue_activities"
  ADD CONSTRAINT "queue_activities_entry_scope_fkey"
  FOREIGN KEY ("organization_id", "clinic_id", "queue_session_id", "queue_entry_id")
  REFERENCES "queue_entries" ("organization_id", "clinic_id", "queue_session_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "queue_audits"
  ADD CONSTRAINT "queue_audits_entry_scope_fkey"
  FOREIGN KEY ("organization_id", "clinic_id", "queue_session_id", "queue_entry_id")
  REFERENCES "queue_entries" ("organization_id", "clinic_id", "queue_session_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION enforce_queue_session_lifecycle() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $function$
DECLARE unresolved integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'queue sessions are immutable history';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'notStarted' OR NEW.next_ticket < 1 OR NEW.version < 1
       OR NEW.opened_at IS NOT NULL OR NEW.paused_at IS NOT NULL
       OR NEW.closed_at IS NOT NULL THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'invalid queue session insertion';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.version <> OLD.version + 1 OR NEW.version < 1 THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'queue session version conflict';
  END IF;
  IF NEW.organization_id <> OLD.organization_id OR NEW.clinic_id <> OLD.clinic_id
     OR NEW.doctor_id <> OLD.doctor_id OR NEW.operational_date <> OLD.operational_date
     OR NEW.effective_timezone <> OLD.effective_timezone
     OR NEW.next_ticket < OLD.next_ticket OR NEW.next_ticket > OLD.next_ticket + 1 THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'queue session identity or ticket counter is invalid';
  END IF;
  IF OLD.status = 'closed' THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'closed queue is terminal';
  END IF;
  IF NEW.status <> OLD.status AND NOT (
    (OLD.status = 'notStarted' AND NEW.status = 'open') OR
    (OLD.status = 'open' AND NEW.status IN ('paused', 'closed')) OR
    (OLD.status = 'paused' AND NEW.status IN ('open', 'closed'))
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'invalid queue session transition';
  END IF;
  IF NEW.status IN ('open', 'paused', 'closed') AND NEW.opened_at IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'opened_at is required';
  END IF;
  IF OLD.opened_at IS NOT NULL AND NEW.opened_at IS DISTINCT FROM OLD.opened_at THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'opened_at is immutable';
  END IF;
  IF OLD.paused_at IS NOT NULL AND NEW.paused_at IS DISTINCT FROM OLD.paused_at THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'paused_at is immutable';
  END IF;
  IF OLD.closed_at IS NOT NULL AND NEW.closed_at IS DISTINCT FROM OLD.closed_at THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'closed_at is immutable';
  END IF;
  IF (NEW.status = 'closed') <> (NEW.closed_at IS NOT NULL) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'closed_at must match closed status';
  END IF;
  IF NEW.status = 'closed' THEN
    SELECT count(*) INTO unresolved FROM public.queue_entries
    WHERE queue_session_id = NEW.id
      AND status IN ('waiting', 'called', 'inConsultation');
    IF unresolved > 0 THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'queue has unresolved work';
    END IF;
  END IF;
  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION enforce_queue_entry_lifecycle() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $function$
DECLARE session_row public.queue_sessions%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'queue entries are immutable history';
  END IF;
  SELECT * INTO session_row FROM public.queue_sessions
  WHERE id = NEW.queue_session_id FOR UPDATE;
  IF NOT FOUND OR session_row.organization_id <> NEW.organization_id
     OR session_row.clinic_id <> NEW.clinic_id THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'queue entry scope is invalid';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.ticket_number < 1 OR NEW.ticket_number <> session_row.next_ticket
       OR NEW.status <> 'waiting' OR NEW.version <> 1
       OR NEW.called_at IS NOT NULL OR NEW.recalled_at IS NOT NULL
       OR NEW.consultation_started_at IS NOT NULL OR NEW.completed_at IS NOT NULL
       OR NEW.no_response_at IS NOT NULL OR NEW.recall_deadline_at IS NOT NULL THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'invalid queue entry insertion';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.version <> OLD.version + 1 OR NEW.version < 1 THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'queue entry version conflict';
  END IF;
  IF NEW.organization_id <> OLD.organization_id OR NEW.clinic_id <> OLD.clinic_id
     OR NEW.queue_session_id <> OLD.queue_session_id OR NEW.appointment_id <> OLD.appointment_id
     OR NEW.arrival_id <> OLD.arrival_id OR NEW.patient_profile_id <> OLD.patient_profile_id
     OR NEW.ticket_number <> OLD.ticket_number OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'queue entry identity is immutable';
  END IF;
  IF NEW.status <> OLD.status AND NOT (
    (OLD.status = 'waiting' AND NEW.status = 'called') OR
    (OLD.status = 'called' AND NEW.status IN ('inConsultation', 'noResponse')) OR
    (OLD.status = 'noResponse' AND NEW.status = 'called'
      AND CURRENT_TIMESTAMP <= OLD.recall_deadline_at) OR
    (OLD.status = 'inConsultation' AND NEW.status = 'completed')
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'invalid queue entry transition';
  END IF;
  IF OLD.called_at IS NOT NULL AND NEW.called_at IS DISTINCT FROM OLD.called_at
     AND NOT (OLD.status = 'noResponse' AND NEW.status = 'called') THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'called_at is immutable';
  END IF;
  IF OLD.consultation_started_at IS NOT NULL
     AND NEW.consultation_started_at IS DISTINCT FROM OLD.consultation_started_at THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'consultation_started_at is immutable';
  END IF;
  IF OLD.completed_at IS NOT NULL AND NEW.completed_at IS DISTINCT FROM OLD.completed_at
     OR OLD.no_response_at IS NOT NULL AND NEW.no_response_at IS DISTINCT FROM OLD.no_response_at
     OR OLD.recall_deadline_at IS NOT NULL AND NEW.recall_deadline_at IS DISTINCT FROM OLD.recall_deadline_at THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'queue lifecycle timestamps are immutable';
  END IF;
  IF NEW.status IN ('called','inConsultation','completed','noResponse') AND NEW.called_at IS NULL
     OR NEW.status IN ('inConsultation','completed') AND NEW.consultation_started_at IS NULL
     OR (NEW.status = 'completed') <> (NEW.completed_at IS NOT NULL)
     OR NEW.status = 'noResponse' AND (NEW.no_response_at IS NULL OR NEW.recall_deadline_at IS NULL) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'queue lifecycle timestamps are inconsistent';
  END IF;
  IF session_row.status = 'closed' THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'closed queue history cannot be reopened';
  END IF;
  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION enforce_queue_ticket_coherence() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $function$
DECLARE sid uuid; expected integer; actual integer;
BEGIN
  IF TG_TABLE_NAME = 'queue_entries' THEN
    sid := NEW.queue_session_id;
  ELSE
    sid := NEW.id;
  END IF;
  SELECT next_ticket INTO actual FROM public.queue_sessions WHERE id = sid;
  SELECT COALESCE(max(ticket_number), 0) + 1 INTO expected
  FROM public.queue_entries WHERE queue_session_id = sid;
  IF actual <> expected THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'queue ticket counter is incoherent';
  END IF;
  RETURN NULL;
END
$function$;

DROP TRIGGER IF EXISTS queue_ticket_coherence_entry ON "queue_entries";
CREATE CONSTRAINT TRIGGER queue_ticket_coherence_entry
AFTER INSERT OR UPDATE ON "queue_entries" DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_queue_ticket_coherence();
DROP TRIGGER IF EXISTS queue_ticket_coherence_session ON "queue_sessions";
CREATE CONSTRAINT TRIGGER queue_ticket_coherence_session
AFTER INSERT OR UPDATE ON "queue_sessions" DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_queue_ticket_coherence();

CREATE OR REPLACE FUNCTION prevent_active_queue_participant_deactivation()
RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $function$
DECLARE active_entry boolean := false;
BEGIN
  IF OLD.status::text <> 'active' OR NEW.status::text = 'active' THEN
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME = 'organizations' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.queue_entries qe
      WHERE qe.organization_id = OLD.id
        AND qe.status IN ('waiting','called','inConsultation')
    ) INTO active_entry;
  ELSIF TG_TABLE_NAME = 'clinics' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.queue_entries qe
      WHERE qe.clinic_id = OLD.id
        AND qe.status IN ('waiting','called','inConsultation')
    ) INTO active_entry;
  ELSIF TG_TABLE_NAME = 'doctors' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.queue_entries qe
      JOIN public.queue_sessions qs ON qs.id = qe.queue_session_id
      WHERE qs.doctor_id = OLD.id
        AND qe.status IN ('waiting','called','inConsultation')
    ) INTO active_entry;
  ELSIF TG_TABLE_NAME = 'doctor_clinic_assignments' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.queue_entries qe
      JOIN public.queue_sessions qs ON qs.id = qe.queue_session_id
      WHERE qs.organization_id = OLD.organization_id
        AND qs.clinic_id = OLD.clinic_id AND qs.doctor_id = OLD.doctor_id
        AND qe.status IN ('waiting','called','inConsultation')
    ) INTO active_entry;
  ELSIF TG_TABLE_NAME = 'organization_patient_profiles' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.queue_entries qe
      WHERE qe.organization_id = OLD.organization_id
        AND qe.patient_profile_id = OLD.patient_profile_id
        AND qe.status IN ('waiting','called','inConsultation')
    ) INTO active_entry;
  ELSIF TG_TABLE_NAME = 'patient_profiles' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.queue_entries qe
      WHERE qe.patient_profile_id = OLD.id
        AND qe.status IN ('waiting','called','inConsultation')
    ) INTO active_entry;
  END IF;
  IF active_entry THEN
    RAISE EXCEPTION USING ERRCODE = '23514',
      MESSAGE = 'active queue participant cannot be deactivated';
  END IF;
  RETURN NEW;
END
$function$;

CREATE TRIGGER organizations_queue_deactivation
BEFORE UPDATE OF status ON "organizations" FOR EACH ROW
EXECUTE FUNCTION prevent_active_queue_participant_deactivation();
CREATE TRIGGER clinics_queue_deactivation
BEFORE UPDATE OF status ON "clinics" FOR EACH ROW
EXECUTE FUNCTION prevent_active_queue_participant_deactivation();
CREATE TRIGGER doctors_queue_deactivation
BEFORE UPDATE OF status ON "doctors" FOR EACH ROW
EXECUTE FUNCTION prevent_active_queue_participant_deactivation();
CREATE TRIGGER doctor_assignments_queue_deactivation
BEFORE UPDATE OF status ON "doctor_clinic_assignments" FOR EACH ROW
EXECUTE FUNCTION prevent_active_queue_participant_deactivation();
CREATE TRIGGER patient_registrations_queue_deactivation
BEFORE UPDATE OF status ON "organization_patient_profiles" FOR EACH ROW
EXECUTE FUNCTION prevent_active_queue_participant_deactivation();
CREATE TRIGGER patient_profiles_queue_deactivation
BEFORE UPDATE OF status ON "patient_profiles" FOR EACH ROW
EXECUTE FUNCTION prevent_active_queue_participant_deactivation();

CREATE OR REPLACE FUNCTION prevent_active_queue_eligibility_change()
RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $function$
DECLARE active_entry boolean;
BEGIN
  IF TG_TABLE_NAME = 'appointments'
     AND OLD.status::text IN ('scheduled','confirmed')
     AND NEW.status::text NOT IN ('scheduled','confirmed','completed') THEN
    SELECT EXISTS (
      SELECT 1 FROM public.queue_entries
      WHERE appointment_id = OLD.id
        AND status IN ('waiting','called','inConsultation')
    ) INTO active_entry;
  ELSIF TG_TABLE_NAME = 'appointment_arrivals'
     AND OLD.status::text = 'queueReady'
     AND NEW.status::text <> 'queueReady' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.queue_entries
      WHERE arrival_id = OLD.id
        AND status IN ('waiting','called','inConsultation')
    ) INTO active_entry;
  ELSE
    RETURN NEW;
  END IF;
  IF active_entry THEN
    RAISE EXCEPTION USING ERRCODE = '23514',
      MESSAGE = 'active queue eligibility cannot be removed';
  END IF;
  RETURN NEW;
END
$function$;
CREATE TRIGGER appointments_queue_eligibility
BEFORE UPDATE OF status ON "appointments" FOR EACH ROW
EXECUTE FUNCTION prevent_active_queue_eligibility_change();
CREATE TRIGGER arrivals_queue_eligibility
BEFORE UPDATE OF status ON "appointment_arrivals" FOR EACH ROW
EXECUTE FUNCTION prevent_active_queue_eligibility_change();
