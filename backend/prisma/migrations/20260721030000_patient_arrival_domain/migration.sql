-- Sprint 13H: authoritative Patient Arrival Domain. No queue mutation is introduced.
CREATE TYPE "ArrivalStatus" AS ENUM ('expected', 'arrived', 'queueReady');

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organization_id_clinic_id_id_patient_profile_id_key" UNIQUE ("organization_id", "clinic_id", "id", "patient_profile_id");

CREATE TABLE "appointment_arrivals" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "clinic_id" UUID NOT NULL,
  "appointment_id" UUID NOT NULL,
  "patient_profile_id" UUID NOT NULL,
  "status" "ArrivalStatus" NOT NULL DEFAULT 'expected',
  "arrived_at" TIMESTAMPTZ(3),
  "queue_ready_at" TIMESTAMPTZ(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "appointment_arrivals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "appointment_arrivals_appointment_id_key" UNIQUE ("appointment_id"),
  CONSTRAINT "appointment_arrivals_organization_id_id_key" UNIQUE ("organization_id", "id"),
  CONSTRAINT "arrival_appointment_scope_key" UNIQUE ("organization_id", "clinic_id", "appointment_id"),
  CONSTRAINT "arrival_patient_scope_key" UNIQUE ("organization_id", "clinic_id", "appointment_id", "patient_profile_id"),
  CONSTRAINT "appointment_arrivals_organization_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "appointment_arrivals_clinic_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "appointment_arrivals_appointment_fkey" FOREIGN KEY ("organization_id", "clinic_id", "appointment_id", "patient_profile_id") REFERENCES "appointments"("organization_id", "clinic_id", "id", "patient_profile_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "appointment_arrivals_patient_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "appointment_arrivals_scope_status_idx" ON "appointment_arrivals"("organization_id", "clinic_id", "status", "created_at");
CREATE INDEX "appointment_arrivals_patient_status_idx" ON "appointment_arrivals"("patient_profile_id", "status");

CREATE TABLE "arrival_audits" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "clinic_id" UUID NOT NULL,
  "arrival_id" UUID NOT NULL,
  "actor_user_id" UUID NOT NULL,
  "from_status" "ArrivalStatus" NOT NULL,
  "to_status" "ArrivalStatus" NOT NULL,
  "occurred_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "arrival_audits_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "arrival_audits_organization_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "arrival_audits_clinic_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "arrival_audits_arrival_fkey" FOREIGN KEY ("organization_id", "arrival_id") REFERENCES "appointment_arrivals"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "arrival_audits_actor_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "arrival_audits_arrival_time_idx" ON "arrival_audits"("organization_id", "arrival_id", "occurred_at");

-- PostgreSQL 17 has no native UUIDv7. Existing rows use the documented safe UUIDv4
-- migration fallback; all application-created Arrival and ArrivalAudit records use Prisma UUIDv7.
INSERT INTO "appointment_arrivals" ("id", "organization_id", "clinic_id", "appointment_id", "patient_profile_id", "status", "version", "created_at", "updated_at")
SELECT gen_random_uuid(), "organization_id", "clinic_id", "id", "patient_profile_id", 'expected', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "appointments";

CREATE FUNCTION enforce_arrival_lifecycle() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."status" <> 'expected' OR NEW."version" <> 1 OR NEW."arrived_at" IS NOT NULL OR NEW."queue_ready_at" IS NOT NULL THEN
      RAISE EXCEPTION 'Arrival must begin in expected state';
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
CREATE TRIGGER "appointment_arrival_lifecycle_guard" BEFORE INSERT OR UPDATE ON "appointment_arrivals" FOR EACH ROW EXECUTE FUNCTION enforce_arrival_lifecycle();

CREATE FUNCTION reject_arrival_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Arrival records cannot be physically deleted'; END $$;
CREATE TRIGGER "appointment_arrival_no_delete" BEFORE DELETE ON "appointment_arrivals" FOR EACH ROW EXECUTE FUNCTION reject_arrival_delete();

CREATE FUNCTION reject_arrival_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Arrival audits are append-only'; END $$;
CREATE TRIGGER "arrival_audit_append_only" BEFORE UPDATE OR DELETE ON "arrival_audits" FOR EACH ROW EXECUTE FUNCTION reject_arrival_audit_mutation();
