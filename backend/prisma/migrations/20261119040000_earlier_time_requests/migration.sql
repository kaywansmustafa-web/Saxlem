-- "Tell me if an earlier time opens" for an upcoming visit.
CREATE TABLE "earlier_time_requests" (
  "appointment_id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "clinic_id" UUID NOT NULL,
  "patient_profile_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_offered_starts_at" TIMESTAMPTZ(3),
  "last_offered_at" TIMESTAMPTZ(3),
  CONSTRAINT "earlier_time_requests_pkey" PRIMARY KEY ("appointment_id")
);
CREATE UNIQUE INDEX "earlier_time_requests_organization_id_clinic_id_appointment_key" ON "earlier_time_requests"("organization_id", "clinic_id", "appointment_id", "patient_profile_id");
CREATE INDEX "earlier_time_requests_created_at_idx" ON "earlier_time_requests"("created_at");
ALTER TABLE "earlier_time_requests"
  ADD CONSTRAINT "earlier_time_requests_organization_id_clinic_id_appointme_fkey"
  FOREIGN KEY ("organization_id", "clinic_id", "appointment_id", "patient_profile_id")
  REFERENCES "appointments"("organization_id", "clinic_id", "id", "patient_profile_id")
  ON DELETE CASCADE ON UPDATE CASCADE;
