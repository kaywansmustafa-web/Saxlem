-- Verified reviews: one per completed visit, written by the patient.
CREATE TYPE "DoctorReviewStatus" AS ENUM ('published', 'hidden');

CREATE TABLE "doctor_reviews" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "clinic_id" UUID NOT NULL,
  "doctor_id" UUID NOT NULL,
  "appointment_id" UUID NOT NULL,
  "patient_profile_id" UUID NOT NULL,
  "rating" SMALLINT NOT NULL,
  "comment" TEXT,
  "anonymous" BOOLEAN NOT NULL DEFAULT false,
  "author_name" TEXT NOT NULL,
  "status" "DoctorReviewStatus" NOT NULL DEFAULT 'published',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "doctor_reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "doctor_reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5),
  CONSTRAINT "doctor_reviews_comment_length" CHECK ("comment" IS NULL OR char_length("comment") BETWEEN 1 AND 500),
  CONSTRAINT "doctor_reviews_author_length" CHECK (char_length("author_name") BETWEEN 1 AND 80)
);
CREATE UNIQUE INDEX "doctor_reviews_appointment_id_key" ON "doctor_reviews"("appointment_id");
CREATE UNIQUE INDEX "doctor_reviews_organization_id_clinic_id_appointment_id_pat_key" ON "doctor_reviews"("organization_id", "clinic_id", "appointment_id", "patient_profile_id");
CREATE INDEX "doctor_reviews_doctor_id_status_created_at_idx" ON "doctor_reviews"("doctor_id", "status", "created_at");
CREATE INDEX "doctor_reviews_status_created_at_idx" ON "doctor_reviews"("status", "created_at");
ALTER TABLE "doctor_reviews"
  ADD CONSTRAINT "doctor_reviews_organization_id_clinic_id_appointment_id_pa_fkey"
  FOREIGN KEY ("organization_id", "clinic_id", "appointment_id", "patient_profile_id")
  REFERENCES "appointments"("organization_id", "clinic_id", "id", "patient_profile_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "doctor_review_stats" (
  "doctor_id" UUID NOT NULL,
  "review_count" INTEGER NOT NULL DEFAULT 0,
  "review_sum" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "doctor_review_stats_pkey" PRIMARY KEY ("doctor_id"),
  CONSTRAINT "doctor_review_stats_counts" CHECK ("review_count" >= 0 AND "review_sum" BETWEEN "review_count" AND 5 * "review_count")
);
ALTER TABLE "doctor_review_stats"
  ADD CONSTRAINT "doctor_review_stats_doctor_id_fkey"
  FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
