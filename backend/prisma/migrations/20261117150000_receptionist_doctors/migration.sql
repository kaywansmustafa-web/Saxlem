-- Which doctors a receptionist works for at a clinic (default: one).
CREATE TABLE "receptionist_doctor_assignments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "receptionist_doctor_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "receptionist_doctor_assignments_organization_id_clinic_id_u_key"
  ON "receptionist_doctor_assignments"("organization_id", "clinic_id", "user_id", "doctor_id");
CREATE INDEX "receptionist_doctor_assignments_organization_id_clinic_id_d_idx"
  ON "receptionist_doctor_assignments"("organization_id", "clinic_id", "doctor_id");

ALTER TABLE "receptionist_doctor_assignments"
  ADD CONSTRAINT "receptionist_doctor_assignments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- The doctor must work at this clinic.
ALTER TABLE "receptionist_doctor_assignments"
  ADD CONSTRAINT "receptionist_doctor_assignments_organization_id_clinic_id__fkey"
  FOREIGN KEY ("organization_id", "clinic_id", "doctor_id")
  REFERENCES "doctor_clinic_assignments"("organization_id", "clinic_id", "doctor_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
