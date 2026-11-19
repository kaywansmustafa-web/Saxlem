-- Doctor schedules from the Owner Portal (founder request 2026-11-19):
-- each doctor's own visit length (null = the "Default visit length" app
-- setting). Weekly hours, breaks and days off already have tables.
ALTER TABLE "doctors"
  ADD COLUMN "visit_minutes" INTEGER,
  ADD CONSTRAINT "doctors_visit_minutes_check" CHECK ("visit_minutes" IS NULL OR "visit_minutes" BETWEEN 5 AND 240);

-- Review comments: the owner sets the limit (App settings → Reviews, at
-- most 2000 characters); the database allows that maximum.
ALTER TABLE "doctor_reviews" DROP CONSTRAINT "doctor_reviews_comment_length";
ALTER TABLE "doctor_reviews" ADD CONSTRAINT "doctor_reviews_comment_length"
  CHECK ("comment" IS NULL OR char_length("comment") BETWEEN 1 AND 2000);
