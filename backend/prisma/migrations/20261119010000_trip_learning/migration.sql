-- "I'm on my way": the expected arrival for reception, and what Saxlem learns
-- about real drive times. The patient's position is never stored.
CREATE TABLE "appointment_trips" (
  "appointment_id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "clinic_id" UUID NOT NULL,
  "started_at" TIMESTAMPTZ(3) NOT NULL,
  "arrival_eta" TIMESTAMPTZ(3) NOT NULL,
  "route_seconds" INTEGER NOT NULL,
  "distance_band" SMALLINT NOT NULL,
  "basis" SMALLINT NOT NULL,
  CONSTRAINT "appointment_trips_pkey" PRIMARY KEY ("appointment_id"),
  CONSTRAINT "appointment_trips_route_seconds" CHECK ("route_seconds" BETWEEN 1 AND 86400),
  CONSTRAINT "appointment_trips_distance_band" CHECK ("distance_band" BETWEEN 0 AND 2),
  CONSTRAINT "appointment_trips_basis" CHECK ("basis" BETWEEN 0 AND 2),
  CONSTRAINT "appointment_trips_eta_after_start" CHECK ("arrival_eta" > "started_at")
);
CREATE INDEX "appointment_trips_started_at_idx" ON "appointment_trips"("started_at");
CREATE UNIQUE INDEX "appointment_trips_organization_id_clinic_id_appointment_id_key" ON "appointment_trips"("organization_id", "clinic_id", "appointment_id");
ALTER TABLE "appointment_trips"
  ADD CONSTRAINT "appointment_trips_organization_id_clinic_id_appointment_id_fkey"
  FOREIGN KEY ("organization_id", "clinic_id", "appointment_id")
  REFERENCES "appointments"("organization_id", "clinic_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "drive_time_learning" (
  "organization_id" UUID NOT NULL,
  "clinic_id" UUID NOT NULL,
  "basis" SMALLINT NOT NULL,
  "distance_band" SMALLINT NOT NULL,
  "day_kind" SMALLINT NOT NULL,
  "hour" SMALLINT NOT NULL,
  "trips" INTEGER NOT NULL DEFAULT 0,
  "sum_log_ratio" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_time_learning_pkey" PRIMARY KEY ("clinic_id", "basis", "distance_band", "day_kind", "hour"),
  CONSTRAINT "drive_time_learning_basis" CHECK ("basis" BETWEEN 0 AND 2),
  CONSTRAINT "drive_time_learning_distance_band" CHECK ("distance_band" BETWEEN 0 AND 2),
  CONSTRAINT "drive_time_learning_day_kind" CHECK ("day_kind" BETWEEN 0 AND 1),
  CONSTRAINT "drive_time_learning_hour" CHECK ("hour" BETWEEN 0 AND 23),
  CONSTRAINT "drive_time_learning_trips" CHECK ("trips" >= 0)
);
ALTER TABLE "drive_time_learning"
  ADD CONSTRAINT "drive_time_learning_organization_id_clinic_id_fkey"
  FOREIGN KEY ("organization_id", "clinic_id")
  REFERENCES "clinics"("organization_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
