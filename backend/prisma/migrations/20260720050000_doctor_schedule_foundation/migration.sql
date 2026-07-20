-- Sprint 13F: authoritative, read-only doctor availability and schedule foundation.
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TYPE "ScheduleExceptionKind" AS ENUM ('working', 'closed');

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM "clinics" c
    WHERE NOT EXISTS (SELECT 1 FROM pg_timezone_names t WHERE t.name = c."timezone")
  ) THEN RAISE EXCEPTION 'Existing clinic contains an invalid IANA timezone identifier'; END IF;
END $$;
CREATE FUNCTION enforce_clinic_timezone() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = NEW."timezone") THEN
    RAISE EXCEPTION 'Clinic timezone must be a valid IANA timezone identifier';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "clinic_timezone_identifier" BEFORE INSERT OR UPDATE OF "timezone" ON "clinics"
  FOR EACH ROW EXECUTE FUNCTION enforce_clinic_timezone();

CREATE TABLE "clinic_working_hours" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "clinic_id" UUID NOT NULL,
  "weekday" INTEGER NOT NULL,
  "opens_minute" INTEGER NOT NULL,
  "closes_minute" INTEGER NOT NULL,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "clinic_working_hours_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "clinic_working_hours_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "clinic_working_hours_clinic_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "clinic_working_hours_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
  CONSTRAINT "clinic_working_hours_period_check" CHECK ("opens_minute" >= 0 AND "closes_minute" <= 1440 AND "opens_minute" < "closes_minute"),
  CONSTRAINT "clinic_working_hours_version_check" CHECK ("version" > 0)
);
CREATE INDEX "clinic_working_hours_scope_idx" ON "clinic_working_hours"("organization_id", "clinic_id", "weekday", "status");
ALTER TABLE "clinic_working_hours" ADD CONSTRAINT "clinic_working_hours_no_overlap" EXCLUDE USING gist (
  "organization_id" WITH =, "clinic_id" WITH =, "weekday" WITH =,
  int4range("opens_minute", "closes_minute", '[)') WITH &&
) WHERE ("status" = 'active');

CREATE TABLE "doctor_weekly_schedule" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "clinic_id" UUID NOT NULL,
  "doctor_id" UUID NOT NULL,
  "weekday" INTEGER NOT NULL,
  "starts_minute" INTEGER NOT NULL,
  "ends_minute" INTEGER NOT NULL,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "doctor_weekly_schedule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "doctor_weekly_schedule_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_weekly_schedule_clinic_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_weekly_schedule_doctor_fkey" FOREIGN KEY ("organization_id", "doctor_id") REFERENCES "doctors"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_weekly_schedule_assignment_fkey" FOREIGN KEY ("organization_id", "clinic_id", "doctor_id") REFERENCES "doctor_clinic_assignments"("organization_id", "clinic_id", "doctor_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_weekly_schedule_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
  CONSTRAINT "doctor_weekly_schedule_period_check" CHECK ("starts_minute" >= 0 AND "ends_minute" <= 1440 AND "starts_minute" < "ends_minute"),
  CONSTRAINT "doctor_weekly_schedule_version_check" CHECK ("version" > 0)
);
CREATE INDEX "doctor_weekly_schedule_scope_idx" ON "doctor_weekly_schedule"("organization_id", "clinic_id", "doctor_id", "weekday", "status");
ALTER TABLE "doctor_weekly_schedule" ADD CONSTRAINT "doctor_weekly_schedule_no_overlap" EXCLUDE USING gist (
  "organization_id" WITH =, "clinic_id" WITH =, "doctor_id" WITH =, "weekday" WITH =,
  int4range("starts_minute", "ends_minute", '[)') WITH &&
) WHERE ("status" = 'active');

CREATE TABLE "doctor_breaks" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "clinic_id" UUID NOT NULL,
  "doctor_id" UUID NOT NULL,
  "weekday" INTEGER NOT NULL,
  "starts_minute" INTEGER NOT NULL,
  "ends_minute" INTEGER NOT NULL,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "doctor_breaks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "doctor_breaks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_breaks_clinic_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_breaks_doctor_fkey" FOREIGN KEY ("organization_id", "doctor_id") REFERENCES "doctors"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_breaks_assignment_fkey" FOREIGN KEY ("organization_id", "clinic_id", "doctor_id") REFERENCES "doctor_clinic_assignments"("organization_id", "clinic_id", "doctor_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_breaks_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
  CONSTRAINT "doctor_breaks_period_check" CHECK ("starts_minute" >= 0 AND "ends_minute" <= 1440 AND "starts_minute" < "ends_minute"),
  CONSTRAINT "doctor_breaks_version_check" CHECK ("version" > 0)
);
CREATE INDEX "doctor_breaks_scope_idx" ON "doctor_breaks"("organization_id", "clinic_id", "doctor_id", "weekday", "status");
ALTER TABLE "doctor_breaks" ADD CONSTRAINT "doctor_breaks_no_overlap" EXCLUDE USING gist (
  "organization_id" WITH =, "clinic_id" WITH =, "doctor_id" WITH =, "weekday" WITH =,
  int4range("starts_minute", "ends_minute", '[)') WITH &&
) WHERE ("status" = 'active');

CREATE TABLE "doctor_leave" (
  "id" UUID NOT NULL, "organization_id" UUID NOT NULL, "clinic_id" UUID NOT NULL, "doctor_id" UUID NOT NULL,
  "starts_at" TIMESTAMPTZ(3) NOT NULL, "ends_at" TIMESTAMPTZ(3) NOT NULL,
  "status" "RecordStatus" NOT NULL DEFAULT 'active', "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "doctor_leave_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "doctor_leave_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_leave_clinic_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_leave_doctor_fkey" FOREIGN KEY ("organization_id", "doctor_id") REFERENCES "doctors"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_leave_assignment_fkey" FOREIGN KEY ("organization_id", "clinic_id", "doctor_id") REFERENCES "doctor_clinic_assignments"("organization_id", "clinic_id", "doctor_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_leave_period_check" CHECK ("starts_at" < "ends_at"), CONSTRAINT "doctor_leave_version_check" CHECK ("version" > 0)
);
CREATE INDEX "doctor_leave_scope_idx" ON "doctor_leave"("organization_id", "clinic_id", "doctor_id", "starts_at", "ends_at", "status");
ALTER TABLE "doctor_leave" ADD CONSTRAINT "doctor_leave_no_overlap" EXCLUDE USING gist (
  "organization_id" WITH =, "clinic_id" WITH =, "doctor_id" WITH =, tstzrange("starts_at", "ends_at", '[)') WITH &&
) WHERE ("status" = 'active');

CREATE TABLE "doctor_holidays" (
  "id" UUID NOT NULL, "organization_id" UUID NOT NULL, "clinic_id" UUID NOT NULL, "doctor_id" UUID NOT NULL,
  "name" TEXT NOT NULL, "starts_at" TIMESTAMPTZ(3) NOT NULL, "ends_at" TIMESTAMPTZ(3) NOT NULL,
  "status" "RecordStatus" NOT NULL DEFAULT 'active', "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "doctor_holidays_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "doctor_holidays_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_holidays_clinic_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_holidays_doctor_fkey" FOREIGN KEY ("organization_id", "doctor_id") REFERENCES "doctors"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_holidays_assignment_fkey" FOREIGN KEY ("organization_id", "clinic_id", "doctor_id") REFERENCES "doctor_clinic_assignments"("organization_id", "clinic_id", "doctor_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_holidays_name_check" CHECK (char_length(btrim("name")) BETWEEN 1 AND 120),
  CONSTRAINT "doctor_holidays_period_check" CHECK ("starts_at" < "ends_at"), CONSTRAINT "doctor_holidays_version_check" CHECK ("version" > 0)
);
CREATE INDEX "doctor_holidays_scope_idx" ON "doctor_holidays"("organization_id", "clinic_id", "doctor_id", "starts_at", "ends_at", "status");

CREATE TABLE "doctor_schedule_exceptions" (
  "id" UUID NOT NULL, "organization_id" UUID NOT NULL, "clinic_id" UUID NOT NULL, "doctor_id" UUID NOT NULL,
  "kind" "ScheduleExceptionKind" NOT NULL, "starts_at" TIMESTAMPTZ(3) NOT NULL, "ends_at" TIMESTAMPTZ(3) NOT NULL,
  "status" "RecordStatus" NOT NULL DEFAULT 'active', "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "doctor_schedule_exceptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "doctor_schedule_exceptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_schedule_exceptions_clinic_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_schedule_exceptions_doctor_fkey" FOREIGN KEY ("organization_id", "doctor_id") REFERENCES "doctors"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_schedule_exceptions_assignment_fkey" FOREIGN KEY ("organization_id", "clinic_id", "doctor_id") REFERENCES "doctor_clinic_assignments"("organization_id", "clinic_id", "doctor_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "doctor_schedule_exceptions_period_check" CHECK ("starts_at" < "ends_at"), CONSTRAINT "doctor_schedule_exceptions_version_check" CHECK ("version" > 0)
);
CREATE INDEX "doctor_schedule_exceptions_scope_idx" ON "doctor_schedule_exceptions"("organization_id", "clinic_id", "doctor_id", "starts_at", "ends_at", "status");
ALTER TABLE "doctor_schedule_exceptions" ADD CONSTRAINT "doctor_schedule_exceptions_no_overlap" EXCLUDE USING gist (
  "organization_id" WITH =, "clinic_id" WITH =, "doctor_id" WITH =, tstzrange("starts_at", "ends_at", '[)') WITH &&
) WHERE ("status" = 'active');

CREATE FUNCTION enforce_active_doctor_schedule() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" = 'active' AND NOT EXISTS (
    SELECT 1 FROM "doctors" WHERE "id" = NEW."doctor_id" AND "organization_id" = NEW."organization_id" AND "status" = 'active'
  ) THEN RAISE EXCEPTION 'Only active doctors may have active schedule records'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "weekly_schedule_active_doctor" BEFORE INSERT OR UPDATE ON "doctor_weekly_schedule" FOR EACH ROW EXECUTE FUNCTION enforce_active_doctor_schedule();
CREATE TRIGGER "doctor_break_active_doctor" BEFORE INSERT OR UPDATE ON "doctor_breaks" FOR EACH ROW EXECUTE FUNCTION enforce_active_doctor_schedule();
CREATE TRIGGER "doctor_leave_active_doctor" BEFORE INSERT OR UPDATE ON "doctor_leave" FOR EACH ROW EXECUTE FUNCTION enforce_active_doctor_schedule();
CREATE TRIGGER "doctor_holiday_active_doctor" BEFORE INSERT OR UPDATE ON "doctor_holidays" FOR EACH ROW EXECUTE FUNCTION enforce_active_doctor_schedule();
CREATE TRIGGER "doctor_exception_active_doctor" BEFORE INSERT OR UPDATE ON "doctor_schedule_exceptions" FOR EACH ROW EXECUTE FUNCTION enforce_active_doctor_schedule();

CREATE FUNCTION prevent_inactive_doctor_schedule() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" <> 'active' AND (
    EXISTS (SELECT 1 FROM "doctor_weekly_schedule" WHERE "doctor_id" = NEW."id" AND "status" = 'active') OR
    EXISTS (SELECT 1 FROM "doctor_breaks" WHERE "doctor_id" = NEW."id" AND "status" = 'active') OR
    EXISTS (SELECT 1 FROM "doctor_leave" WHERE "doctor_id" = NEW."id" AND "status" = 'active') OR
    EXISTS (SELECT 1 FROM "doctor_holidays" WHERE "doctor_id" = NEW."id" AND "status" = 'active') OR
    EXISTS (SELECT 1 FROM "doctor_schedule_exceptions" WHERE "doctor_id" = NEW."id" AND "status" = 'active')
  ) THEN RAISE EXCEPTION 'Active schedule records must be disabled before doctor deactivation or archival'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "doctor_status_schedule_guard" BEFORE UPDATE OF "status" ON "doctors"
  FOR EACH ROW EXECUTE FUNCTION prevent_inactive_doctor_schedule();

CREATE FUNCTION enforce_doctor_schedule_boundaries() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" = 'active' AND NOT EXISTS (
    SELECT 1 FROM "clinic_working_hours" h
    WHERE h."organization_id" = NEW."organization_id" AND h."clinic_id" = NEW."clinic_id"
      AND h."weekday" = NEW."weekday" AND h."status" = 'active'
      AND h."opens_minute" <= NEW."starts_minute" AND h."closes_minute" >= NEW."ends_minute"
  ) THEN RAISE EXCEPTION 'Doctor working period must be within active clinic working hours'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "doctor_schedule_within_clinic_hours" BEFORE INSERT OR UPDATE ON "doctor_weekly_schedule" FOR EACH ROW EXECUTE FUNCTION enforce_doctor_schedule_boundaries();

CREATE FUNCTION enforce_doctor_break_boundaries() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" = 'active' AND NOT EXISTS (
    SELECT 1 FROM "doctor_weekly_schedule" s
    WHERE s."organization_id" = NEW."organization_id" AND s."clinic_id" = NEW."clinic_id" AND s."doctor_id" = NEW."doctor_id"
      AND s."weekday" = NEW."weekday" AND s."status" = 'active'
      AND s."starts_minute" <= NEW."starts_minute" AND s."ends_minute" >= NEW."ends_minute"
  ) THEN RAISE EXCEPTION 'Doctor break must be within an active weekly working period'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "doctor_break_within_schedule" BEFORE INSERT OR UPDATE ON "doctor_breaks" FOR EACH ROW EXECUTE FUNCTION enforce_doctor_break_boundaries();
