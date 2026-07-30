-- Sprint 13J: durable, recipient-scoped Live Queue notifications.
CREATE TABLE notification_record_archive (
  id UUID PRIMARY KEY,
  organization_id UUID,
  clinic_id UUID,
  recipient_user_id UUID NOT NULL,
  patient_profile_id UUID,
  type TEXT NOT NULL,
  priority "NotificationPriority" NOT NULL,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ(3) NOT NULL,
  read_at TIMESTAMPTZ(3),
  archived_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archive_reason TEXT NOT NULL
);

INSERT INTO notification_record_archive (
  id, organization_id, clinic_id, recipient_user_id, patient_profile_id,
  type, priority, payload, occurred_at, read_at, archive_reason
)
SELECT
  id, organization_id, clinic_id, recipient_user_id, patient_profile_id,
  type, priority, payload, occurred_at, read_at, 'LEGACY_UNSCOPED'
FROM notification_records
WHERE organization_id IS NULL OR clinic_id IS NULL;

DELETE FROM notification_records
WHERE organization_id IS NULL OR clinic_id IS NULL;

ALTER TABLE notification_records
  ADD COLUMN delivery_sequence BIGINT GENERATED ALWAYS AS IDENTITY,
  ADD COLUMN source_outbox_event_id UUID,
  ADD COLUMN created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN organization_id SET NOT NULL,
  ALTER COLUMN clinic_id SET NOT NULL;

CREATE TABLE legacy_notification_outbox_map (
  notification_id UUID PRIMARY KEY,
  outbox_id UUID NOT NULL UNIQUE
);

INSERT INTO legacy_notification_outbox_map (notification_id, outbox_id)
SELECT id, gen_random_uuid()
FROM notification_records;

INSERT INTO outbox_events (
  id, aggregate_type, aggregate_id, event_type, payload,
  occurred_at, published_at, attempts
)
SELECT
  mapping.outbox_id, 'LegacyNotification', notification.id,
  'notification.legacy', '{}'::jsonb,
  notification.occurred_at, CURRENT_TIMESTAMP, 1
FROM notification_records notification
JOIN legacy_notification_outbox_map mapping
  ON mapping.notification_id = notification.id;

UPDATE notification_records notification
SET source_outbox_event_id = mapping.outbox_id
FROM legacy_notification_outbox_map mapping
WHERE mapping.notification_id = notification.id
  AND notification.source_outbox_event_id IS NULL;

DROP TABLE legacy_notification_outbox_map;

ALTER TABLE notification_records
  ALTER COLUMN source_outbox_event_id SET NOT NULL,
  ADD CONSTRAINT notification_records_delivery_sequence_positive
    CHECK (delivery_sequence > 0);

ALTER TABLE outbox_events
  ADD COLUMN next_attempt_at TIMESTAMPTZ(3),
  ADD COLUMN failed_at TIMESTAMPTZ(3),
  ADD COLUMN last_error_code TEXT,
  ADD CONSTRAINT outbox_events_attempts_nonnegative CHECK (attempts >= 0),
  ADD CONSTRAINT outbox_events_error_code_safe CHECK (
    last_error_code IS NULL OR last_error_code ~ '^[A-Z][A-Z0-9_]{0,63}$'
  );

DROP INDEX notification_records_recipient_user_id_read_at_occurred_at_idx;
DROP INDEX notification_records_organization_id_clinic_id_occurred_at_idx;
DROP INDEX outbox_events_published_at_occurred_at_idx;
ALTER TABLE notification_records
  DROP CONSTRAINT notification_records_clinic_id_fkey,
  DROP CONSTRAINT notification_records_patient_profile_id_fkey;

ALTER TABLE notification_records
  ADD CONSTRAINT notification_records_clinic_scope_fkey
    FOREIGN KEY (organization_id, clinic_id)
    REFERENCES clinics(organization_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT notification_records_patient_scope_fkey
    FOREIGN KEY (organization_id, patient_profile_id)
    REFERENCES organization_patient_profiles(organization_id, patient_profile_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT notification_records_source_outbox_event_id_fkey
    FOREIGN KEY (source_outbox_event_id)
    REFERENCES outbox_events(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX notification_records_delivery_sequence_key
  ON notification_records(delivery_sequence);
CREATE UNIQUE INDEX notification_records_source_recipient_type_key
  ON notification_records(source_outbox_event_id, recipient_user_id, type);
CREATE INDEX notification_records_recipient_sequence_idx
  ON notification_records(recipient_user_id, delivery_sequence);
CREATE INDEX notification_records_recipient_read_sequence_idx
  ON notification_records(recipient_user_id, read_at, delivery_sequence);
CREATE INDEX notification_records_scope_recipient_sequence_idx
  ON notification_records(
    organization_id, clinic_id, recipient_user_id, delivery_sequence
  );
CREATE INDEX outbox_events_notification_worker_idx
  ON outbox_events(published_at, failed_at, next_attempt_at, occurred_at, id);

CREATE OR REPLACE FUNCTION notification_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF ROW(
    OLD.id, OLD.delivery_sequence, OLD.source_outbox_event_id,
    OLD.organization_id, OLD.clinic_id, OLD.recipient_user_id,
    OLD.patient_profile_id, OLD.type, OLD.priority, OLD.payload,
    OLD.occurred_at, OLD.created_at
  ) IS DISTINCT FROM ROW(
    NEW.id, NEW.delivery_sequence, NEW.source_outbox_event_id,
    NEW.organization_id, NEW.clinic_id, NEW.recipient_user_id,
    NEW.patient_profile_id, NEW.type, NEW.priority, NEW.payload,
    NEW.occurred_at, NEW.created_at
  ) THEN
    RAISE EXCEPTION 'Notification immutable fields cannot be changed'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER notification_records_immutable_fields
BEFORE UPDATE ON notification_records
FOR EACH ROW EXECUTE FUNCTION notification_immutable_fields();

CREATE OR REPLACE FUNCTION notification_mark_read(
  target_notification_id UUID,
  authenticated_recipient_id UUID,
  read_timestamp TIMESTAMPTZ
)
RETURNS TABLE(id UUID, read_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  UPDATE public.notification_records
  SET read_at = COALESCE(notification_records.read_at, read_timestamp)
  WHERE notification_records.id = target_notification_id
    AND notification_records.recipient_user_id = authenticated_recipient_id
  RETURNING notification_records.id, notification_records.read_at;
$$;

REVOKE ALL ON FUNCTION notification_mark_read(UUID, UUID, TIMESTAMPTZ)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION notification_immutable_fields() FROM PUBLIC;
