-- One bill and one payout per doctor (founder decision 2026-11-17).

-- Commission entries carry their doctor.
ALTER TABLE "commission_ledger_entries" ADD COLUMN "doctor_id" UUID;
-- Ledger rows are immutable; this one-time backfill only adds the doctor that
-- each row's appointment already records.
ALTER TABLE "commission_ledger_entries" DISABLE TRIGGER "commission_ledger_immutable";
UPDATE "commission_ledger_entries" c
   SET "doctor_id" = a."doctor_id"
  FROM "appointments" a
 WHERE a."id" = c."appointment_id";
ALTER TABLE "commission_ledger_entries" ENABLE TRIGGER "commission_ledger_immutable";
ALTER TABLE "commission_ledger_entries" ALTER COLUMN "doctor_id" SET NOT NULL;
ALTER TABLE "commission_ledger_entries"
  ADD CONSTRAINT "commission_ledger_entries_organization_id_doctor_id_fkey"
  FOREIGN KEY ("organization_id", "doctor_id") REFERENCES "doctors"("organization_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "commission_ledger_entries_organization_id_doctor_id_recogni_idx"
  ON "commission_ledger_entries"("organization_id", "doctor_id", "recognized_at");

-- Statements: one per doctor per month. Draft clinic-wide statements are
-- rebuilt per doctor on next read; finalized ones stay as history.
ALTER TABLE "billing_statements" ADD COLUMN "doctor_id" UUID;
-- Drafts are a running total recomputed on every read, never history.
ALTER TABLE "billing_statements" DISABLE TRIGGER "billing_statement_no_delete";
DELETE FROM "billing_statements" s
 WHERE s."status" = 'draft'
   AND NOT EXISTS (SELECT 1 FROM "billing_statement_lines" l WHERE l."statement_id" = s."id")
   AND NOT EXISTS (SELECT 1 FROM "billing_statement_clinic_breakdowns" b WHERE b."statement_id" = s."id");
ALTER TABLE "billing_statements" ENABLE TRIGGER "billing_statement_no_delete";
ALTER TABLE "billing_statements" DROP CONSTRAINT "billing_statements_organization_period_key";
CREATE UNIQUE INDEX "billing_statements_organization_id_doctor_id_period_start_key"
  ON "billing_statements"("organization_id", "doctor_id", "period_start");
ALTER TABLE "billing_statements"
  ADD CONSTRAINT "billing_statements_organization_id_doctor_id_fkey"
  FOREIGN KEY ("organization_id", "doctor_id") REFERENCES "doctors"("organization_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Payouts: one per doctor per month.
ALTER TABLE "organization_payouts" ADD COLUMN "doctor_id" UUID;
DROP INDEX "organization_payouts_organization_id_period_start_key";
CREATE UNIQUE INDEX "organization_payouts_organization_id_doctor_id_period_start_key"
  ON "organization_payouts"("organization_id", "doctor_id", "period_start");
ALTER TABLE "organization_payouts"
  ADD CONSTRAINT "organization_payouts_organization_id_doctor_id_fkey"
  FOREIGN KEY ("organization_id", "doctor_id") REFERENCES "doctors"("organization_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Each doctor's bank details for payouts.
CREATE TABLE "doctor_payout_profiles" (
    "doctor_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "payout_account_name" TEXT,
    "payout_account_number" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "doctor_payout_profiles_pkey" PRIMARY KEY ("doctor_id"),
    CONSTRAINT "doctor_payout_profiles_name_check" CHECK ("payout_account_name" IS NULL OR length("payout_account_name") BETWEEN 1 AND 200),
    CONSTRAINT "doctor_payout_profiles_number_check" CHECK ("payout_account_number" IS NULL OR length("payout_account_number") BETWEEN 4 AND 64),
    CONSTRAINT "doctor_payout_profiles_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "doctor_payout_profiles_organization_id_doctor_id_key"
  ON "doctor_payout_profiles"("organization_id", "doctor_id");
ALTER TABLE "doctor_payout_profiles"
  ADD CONSTRAINT "doctor_payout_profiles_organization_id_doctor_id_fkey"
  FOREIGN KEY ("organization_id", "doctor_id") REFERENCES "doctors"("organization_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- A doctor's statement may only contain that doctor's commission.
CREATE OR REPLACE FUNCTION validate_statement_line_insert() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE statement "billing_statements"%ROWTYPE;
DECLARE ledger "commission_ledger_entries"%ROWTYPE;
DECLARE reference TEXT;
BEGIN
  SELECT * INTO statement FROM "billing_statements" WHERE "id" = NEW."statement_id" FOR KEY SHARE;
  SELECT * INTO ledger FROM "commission_ledger_entries" WHERE "id" = NEW."ledger_entry_id" FOR KEY SHARE;
  SELECT "public_reference" INTO reference FROM "appointments" WHERE "id" = ledger."appointment_id";
  IF statement."id" IS NULL OR ledger."id" IS NULL OR reference IS NULL OR statement."status" <> 'draft' OR
     ledger."organization_id" <> statement."organization_id" OR
     (statement."doctor_id" IS NOT NULL AND ledger."doctor_id" <> statement."doctor_id") OR
     ledger."recognized_at" < statement."period_start" OR ledger."recognized_at" >= statement."period_end" OR
     NEW."clinic_id" <> ledger."clinic_id" OR NEW."appointment_id" <> ledger."appointment_id" OR
     NEW."appointment_reference" <> reference OR NEW."recognized_at" <> ledger."recognized_at" OR
     NEW."status" <> ledger."status" OR NEW."amount_iqd" <> ledger."amount_iqd" OR
     NEW."currency" <> ledger."currency" OR
     NEW."net_amount_iqd" <> (CASE WHEN ledger."status" = 'earned' THEN ledger."amount_iqd" ELSE -ledger."amount_iqd" END) THEN
    RAISE EXCEPTION 'Statement line does not match its draft statement and ledger entry';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION validate_statement_breakdown_insert() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE statement "billing_statements"%ROWTYPE;
DECLARE totals RECORD;
BEGIN
  SELECT * INTO statement FROM "billing_statements" WHERE "id" = NEW."statement_id" FOR KEY SHARE;
  SELECT
    COALESCE(SUM("amount_iqd") FILTER (WHERE "status" = 'earned'), 0)::INTEGER AS gross,
    COALESCE(SUM("amount_iqd") FILTER (WHERE "status" = 'reversed'), 0)::INTEGER AS reversals,
    COUNT(*) FILTER (WHERE "status" = 'earned')::INTEGER AS qualifying,
    COUNT(*) FILTER (WHERE "status" = 'reversed')::INTEGER AS reversal_count
  INTO totals FROM "commission_ledger_entries"
  WHERE "organization_id" = statement."organization_id" AND "clinic_id" = NEW."clinic_id"
    AND (statement."doctor_id" IS NULL OR "doctor_id" = statement."doctor_id")
    AND "recognized_at" >= statement."period_start" AND "recognized_at" < statement."period_end";
  IF statement."id" IS NULL OR statement."status" <> 'draft' OR
     NOT EXISTS (SELECT 1 FROM "clinics" WHERE "id" = NEW."clinic_id" AND "organization_id" = statement."organization_id") OR
     NEW."gross_earned_iqd" <> totals.gross OR NEW."reversals_iqd" <> totals.reversals OR
     NEW."net_commission_iqd" <> totals.gross - totals.reversals OR
     NEW."qualifying_count" <> totals.qualifying OR NEW."reversal_count" <> totals.reversal_count THEN
    RAISE EXCEPTION 'Statement clinic breakdown does not reconcile';
  END IF;
  RETURN NEW;
END $$;
