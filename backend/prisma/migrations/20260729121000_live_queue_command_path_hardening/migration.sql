-- A queue entry may only be inserted while its authoritative session can
-- accept queue work. This is forward-only because 13I.5 was already exercised
-- on the development database before this final command-path defense was added.
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
    IF session_row.status NOT IN ('open','paused')
       OR NEW.ticket_number < 1 OR NEW.ticket_number <> session_row.next_ticket
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
