CREATE OR REPLACE FUNCTION queue_create_entry(
  p_organization_id uuid,
  p_clinic_id uuid,
  p_queue_session_id uuid,
  p_appointment_id uuid,
  p_arrival_id uuid,
  p_patient_profile_id uuid,
  p_ticket_number integer
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE created_id uuid := gen_random_uuid(); doctor_id_value uuid;
BEGIN
  PERFORM 1 FROM public.queue_sessions
    WHERE id = p_queue_session_id FOR UPDATE;
  SELECT doctor_id INTO STRICT doctor_id_value
    FROM public.appointments WHERE id = p_appointment_id FOR UPDATE;
  PERFORM 1 FROM public.appointment_arrivals
    WHERE id = p_arrival_id FOR UPDATE;
  PERFORM 1 FROM public.organizations
    WHERE id = p_organization_id FOR UPDATE;
  PERFORM 1 FROM public.clinics
    WHERE id = p_clinic_id FOR UPDATE;
  PERFORM 1 FROM public.doctors
    WHERE id = doctor_id_value FOR UPDATE;
  PERFORM 1 FROM public.doctor_clinic_assignments
    WHERE organization_id = p_organization_id
      AND clinic_id = p_clinic_id AND doctor_id = doctor_id_value
    FOR UPDATE;
  PERFORM 1 FROM public.organization_patient_profiles
    WHERE organization_id = p_organization_id
      AND patient_profile_id = p_patient_profile_id FOR UPDATE;
  PERFORM 1 FROM public.patient_profiles
    WHERE id = p_patient_profile_id FOR UPDATE;

  IF NOT EXISTS (
    SELECT 1 FROM public.queue_sessions qs
    JOIN public.organizations o ON o.id = qs.organization_id
    JOIN public.clinics c ON c.id = qs.clinic_id
      AND c.organization_id = qs.organization_id
    JOIN public.doctor_clinic_assignments dca
      ON dca.organization_id = qs.organization_id
      AND dca.clinic_id = qs.clinic_id AND dca.doctor_id = qs.doctor_id
    JOIN public.doctors d ON d.id = dca.doctor_id
      AND d.organization_id = dca.organization_id
    JOIN public.appointments a
      ON a.organization_id = qs.organization_id
      AND a.clinic_id = qs.clinic_id AND a.doctor_id = qs.doctor_id
    JOIN public.appointment_arrivals ar
      ON ar.organization_id = a.organization_id
      AND ar.clinic_id = a.clinic_id AND ar.appointment_id = a.id
      AND ar.patient_profile_id = a.patient_profile_id
    JOIN public.organization_patient_profiles opp
      ON opp.organization_id = a.organization_id
      AND opp.patient_profile_id = a.patient_profile_id
    JOIN public.patient_profiles pp ON pp.id = a.patient_profile_id
    WHERE qs.id = p_queue_session_id
      AND qs.organization_id = p_organization_id AND qs.clinic_id = p_clinic_id
      AND qs.status IN ('open','paused') AND qs.next_ticket = p_ticket_number
      AND o.status = 'active' AND c.status = 'active'
      AND dca.status = 'active' AND d.status = 'active'
      AND a.id = p_appointment_id AND a.patient_profile_id = p_patient_profile_id
      AND a.status IN ('scheduled','confirmed')
      AND ar.id = p_arrival_id AND ar.status = 'queueReady'
      AND opp.status = 'active' AND pp.status = 'active'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'queue entry context is unavailable';
  END IF;
  INSERT INTO public.queue_entries (
    id, organization_id, clinic_id, queue_session_id, appointment_id,
    arrival_id, patient_profile_id, ticket_number, status
  ) VALUES (
    created_id, p_organization_id, p_clinic_id, p_queue_session_id,
    p_appointment_id, p_arrival_id, p_patient_profile_id, p_ticket_number,
    'waiting'
  );
  RETURN created_id;
END
$function$;
