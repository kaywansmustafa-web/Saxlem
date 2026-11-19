-- Doctors a patient keeps for later.
CREATE TABLE "saved_doctors" (
  "patient_account_id" UUID NOT NULL,
  "doctor_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_doctors_pkey" PRIMARY KEY ("patient_account_id", "doctor_id")
);
CREATE INDEX "saved_doctors_patient_account_id_created_at_idx" ON "saved_doctors"("patient_account_id", "created_at");
ALTER TABLE "saved_doctors"
  ADD CONSTRAINT "saved_doctors_patient_account_id_fkey"
  FOREIGN KEY ("patient_account_id") REFERENCES "patient_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_doctors"
  ADD CONSTRAINT "saved_doctors_doctor_id_fkey"
  FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
