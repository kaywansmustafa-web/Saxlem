-- Sprint 13I replaces the unused foundation placeholders with the authoritative queue model.
DROP INDEX IF EXISTS "queue_entries_queue_session_id_appointment_id_key";
DROP INDEX IF EXISTS "queue_entries_single_active_consultation";

ALTER TABLE "queue_sessions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "QueueSessionStatus" RENAME TO "QueueSessionStatus_legacy";
CREATE TYPE "QueueSessionStatus" AS ENUM ('notStarted', 'open', 'paused', 'closed');
ALTER TABLE "queue_sessions" ALTER COLUMN "status" TYPE "QueueSessionStatus"
USING (
  CASE "status"::text
    WHEN 'scheduled' THEN 'notStarted'
    WHEN 'closing' THEN 'paused'
    ELSE "status"::text
  END
)::"QueueSessionStatus";
DROP TYPE "QueueSessionStatus_legacy";
ALTER TABLE "queue_sessions" ALTER COLUMN "status" SET DEFAULT 'notStarted';
ALTER TABLE "queue_sessions"
  ADD COLUMN "next_ticket" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "opened_at" TIMESTAMPTZ(3),
  ADD COLUMN "paused_at" TIMESTAMPTZ(3),
  ADD COLUMN "closed_at" TIMESTAMPTZ(3),
  ADD COLUMN "pause_reason" TEXT;

ALTER TABLE "queue_entries" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "QueueEntryStatus" RENAME TO "QueueEntryStatus_legacy";
CREATE TYPE "QueueEntryStatus" AS ENUM ('waiting', 'called', 'inConsultation', 'completed', 'noResponse', 'removed');
ALTER TABLE "queue_entries" ALTER COLUMN "status" TYPE "QueueEntryStatus"
USING (
  CASE
    WHEN "status"::text IN ('expected', 'checkedIn', 'ready') THEN 'waiting'
    ELSE "status"::text
  END
)::"QueueEntryStatus";
DROP TYPE "QueueEntryStatus_legacy";
ALTER TABLE "queue_entries" ALTER COLUMN "status" SET DEFAULT 'waiting';
ALTER TABLE "queue_entries" RENAME COLUMN "queue_number" TO "ticket_number";
ALTER TABLE "queue_entries"
  ADD COLUMN "arrival_id" UUID,
  ADD COLUMN "called_at" TIMESTAMPTZ(3),
  ADD COLUMN "recalled_at" TIMESTAMPTZ(3),
  ADD COLUMN "consultation_started_at" TIMESTAMPTZ(3),
  ADD COLUMN "completed_at" TIMESTAMPTZ(3),
  ADD COLUMN "no_response_at" TIMESTAMPTZ(3);
UPDATE "queue_entries" q
SET "arrival_id" = a."id"
FROM "appointment_arrivals" a
WHERE a."appointment_id" = q."appointment_id";
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "queue_entries" WHERE "arrival_id" IS NULL OR "appointment_id" IS NULL) THEN
    RAISE EXCEPTION 'Legacy queue placeholders cannot be migrated without an appointment arrival';
  END IF;
END $$;
ALTER TABLE "queue_entries"
  ALTER COLUMN "arrival_id" SET NOT NULL,
  ALTER COLUMN "appointment_id" SET NOT NULL,
  DROP COLUMN "position";
ALTER TABLE "queue_entries"
  ADD CONSTRAINT "queue_entries_arrival_id_key" UNIQUE ("arrival_id"),
  ADD CONSTRAINT "queue_entries_queue_session_id_appointment_id_key" UNIQUE ("queue_session_id", "appointment_id"),
  ADD CONSTRAINT "queue_entries_arrival_scope_fkey"
    FOREIGN KEY ("organization_id", "clinic_id", "arrival_id")
    REFERENCES "appointment_arrivals" ("organization_id", "clinic_id", "id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "queue_entries_organization_id_queue_session_id_status_ticket_idx"
  ON "queue_entries" ("organization_id", "queue_session_id", "status", "ticket_number");
CREATE UNIQUE INDEX "queue_entries_single_current"
  ON "queue_entries" ("queue_session_id")
  WHERE "status" IN ('called', 'inConsultation');

CREATE TABLE "queue_activities" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "clinic_id" UUID NOT NULL,
  "queue_session_id" UUID NOT NULL,
  "queue_entry_id" UUID,
  "actor_user_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "occurred_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "queue_activities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "queue_activities_organization_fkey" FOREIGN KEY ("organization_id")
    REFERENCES "organizations" ("id") ON DELETE RESTRICT,
  CONSTRAINT "queue_activities_clinic_fkey" FOREIGN KEY ("organization_id", "clinic_id")
    REFERENCES "clinics" ("organization_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "queue_activities_session_fkey" FOREIGN KEY ("organization_id", "clinic_id", "queue_session_id")
    REFERENCES "queue_sessions" ("organization_id", "clinic_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "queue_activities_entry_fkey" FOREIGN KEY ("queue_entry_id")
    REFERENCES "queue_entries" ("id") ON DELETE RESTRICT,
  CONSTRAINT "queue_activities_actor_fkey" FOREIGN KEY ("actor_user_id")
    REFERENCES "users" ("id") ON DELETE RESTRICT
);
CREATE INDEX "queue_activities_organization_id_session_occurred_idx"
  ON "queue_activities" ("organization_id", "queue_session_id", "occurred_at");

CREATE TABLE "queue_audits" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "clinic_id" UUID NOT NULL,
  "queue_session_id" UUID NOT NULL,
  "queue_entry_id" UUID,
  "actor_user_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "request_id" TEXT NOT NULL,
  "metadata" JSONB,
  "occurred_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "queue_audits_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "queue_audits_organization_fkey" FOREIGN KEY ("organization_id")
    REFERENCES "organizations" ("id") ON DELETE RESTRICT,
  CONSTRAINT "queue_audits_clinic_fkey" FOREIGN KEY ("organization_id", "clinic_id")
    REFERENCES "clinics" ("organization_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "queue_audits_session_fkey" FOREIGN KEY ("organization_id", "clinic_id", "queue_session_id")
    REFERENCES "queue_sessions" ("organization_id", "clinic_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "queue_audits_entry_fkey" FOREIGN KEY ("queue_entry_id")
    REFERENCES "queue_entries" ("id") ON DELETE RESTRICT,
  CONSTRAINT "queue_audits_actor_fkey" FOREIGN KEY ("actor_user_id")
    REFERENCES "users" ("id") ON DELETE RESTRICT
);
CREATE INDEX "queue_audits_organization_id_session_occurred_idx"
  ON "queue_audits" ("organization_id", "queue_session_id", "occurred_at");

CREATE OR REPLACE FUNCTION enforce_queue_session_lifecycle() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'queue sessions are immutable history'; END IF;
  IF NEW.version <> OLD.version + 1 THEN RAISE EXCEPTION 'queue session version must increment by one'; END IF;
  IF NEW.organization_id <> OLD.organization_id OR NEW.clinic_id <> OLD.clinic_id
     OR NEW.doctor_id <> OLD.doctor_id OR NEW.operational_date <> OLD.operational_date
     OR NEW.next_ticket < OLD.next_ticket THEN
    RAISE EXCEPTION 'queue session identity and ticket counter are immutable';
  END IF;
  IF NEW.status <> OLD.status AND NOT (
    (OLD.status = 'notStarted' AND NEW.status = 'open') OR
    (OLD.status = 'open' AND NEW.status IN ('paused', 'closed')) OR
    (OLD.status = 'paused' AND NEW.status IN ('open', 'closed'))
  ) THEN RAISE EXCEPTION 'invalid queue session transition'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER queue_sessions_lifecycle
  BEFORE UPDATE OR DELETE ON "queue_sessions"
  FOR EACH ROW EXECUTE FUNCTION enforce_queue_session_lifecycle();

CREATE OR REPLACE FUNCTION enforce_queue_entry_lifecycle() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'queue entries are immutable history'; END IF;
  IF NEW.version <> OLD.version + 1 THEN RAISE EXCEPTION 'queue entry version must increment by one'; END IF;
  IF NEW.organization_id <> OLD.organization_id OR NEW.clinic_id <> OLD.clinic_id
     OR NEW.queue_session_id <> OLD.queue_session_id OR NEW.appointment_id <> OLD.appointment_id
     OR NEW.arrival_id <> OLD.arrival_id OR NEW.patient_profile_id <> OLD.patient_profile_id
     OR NEW.ticket_number <> OLD.ticket_number OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'queue entry identity and ticket are immutable';
  END IF;
  IF NEW.status <> OLD.status AND NOT (
    (OLD.status = 'waiting' AND NEW.status = 'called') OR
    (OLD.status = 'called' AND NEW.status IN ('inConsultation', 'noResponse')) OR
    (OLD.status = 'noResponse' AND NEW.status = 'called') OR
    (OLD.status = 'inConsultation' AND NEW.status = 'completed')
  ) THEN RAISE EXCEPTION 'invalid queue entry transition'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER queue_entries_lifecycle
  BEFORE UPDATE OR DELETE ON "queue_entries"
  FOR EACH ROW EXECUTE FUNCTION enforce_queue_entry_lifecycle();

CREATE OR REPLACE FUNCTION prevent_queue_history_mutation() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN RAISE EXCEPTION 'queue history is append-only'; END $$;
CREATE TRIGGER queue_activities_append_only
  BEFORE UPDATE OR DELETE ON "queue_activities"
  FOR EACH ROW EXECUTE FUNCTION prevent_queue_history_mutation();
CREATE TRIGGER queue_audits_append_only
  BEFORE UPDATE OR DELETE ON "queue_audits"
  FOR EACH ROW EXECUTE FUNCTION prevent_queue_history_mutation();
