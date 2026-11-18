-- Each doctor sets their own fee for a first visit and a follow-up.
-- NULL means the platform default (APPOINTMENT_FOUNDATION_FEE_IQD).
ALTER TABLE "doctors"
  ADD COLUMN "consultation_fee_iqd" INTEGER,
  ADD COLUMN "follow_up_fee_iqd" INTEGER;

ALTER TABLE "doctors"
  ADD CONSTRAINT "doctors_consultation_fee_iqd_range"
    CHECK ("consultation_fee_iqd" IS NULL OR "consultation_fee_iqd" BETWEEN 0 AND 5000000),
  ADD CONSTRAINT "doctors_follow_up_fee_iqd_range"
    CHECK ("follow_up_fee_iqd" IS NULL OR "follow_up_fee_iqd" BETWEEN 0 AND 5000000);
