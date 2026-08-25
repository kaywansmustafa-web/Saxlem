CREATE TYPE "AppointmentOrigin" AS ENUM ('patientBooked', 'clinicCreated', 'walkIn');
CREATE TYPE "BillingPlanStatus" AS ENUM ('active', 'inactive');
CREATE TYPE "CommissionLedgerStatus" AS ENUM ('earned', 'reversed');
CREATE TYPE "BillingStatementStatus" AS ENUM ('draft', 'finalized');

ALTER TABLE "appointments" ADD COLUMN "origin" "AppointmentOrigin";

CREATE FUNCTION enforce_appointment_origin() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW."origin" IS NULL THEN
    RAISE EXCEPTION 'New appointments require an authoritative origin';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW."origin" IS DISTINCT FROM OLD."origin" THEN
    RAISE EXCEPTION 'Appointment origin is immutable';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "appointment_origin_required" BEFORE INSERT ON "appointments"
  FOR EACH ROW EXECUTE FUNCTION enforce_appointment_origin();
CREATE TRIGGER "appointment_origin_immutable" BEFORE UPDATE OF "origin" ON "appointments"
  FOR EACH ROW EXECUTE FUNCTION enforce_appointment_origin();

CREATE TABLE "billing_plans" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "status" "BillingPlanStatus" NOT NULL DEFAULT 'active',
  "currency" TEXT NOT NULL DEFAULT 'IQD',
  "commission_amount_iqd" INTEGER NOT NULL,
  "rule_code" TEXT NOT NULL,
  "rule_version" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "billing_plans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "billing_plans_code_key" UNIQUE ("code"),
  CONSTRAINT "billing_plan_iqd_only" CHECK ("currency" = 'IQD' AND "commission_amount_iqd" > 0),
  CONSTRAINT "billing_plan_rule_valid" CHECK ("rule_version" > 0 AND "version" > 0)
);

INSERT INTO "billing_plans" ("id", "code", "display_name", "currency", "commission_amount_iqd", "rule_code", "rule_version", "updated_at")
VALUES ('0198a4ae-1250-7000-8000-000000000001', 'STANDARD_1250', 'Standard 1,250 IQD Commission', 'IQD', 1250, 'QUALIFYING_INITIAL_PATIENT_BOOKED_COMPLETION', 1, CURRENT_TIMESTAMP);

CREATE TABLE "organization_plan_assignments" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "effective_from" TIMESTAMPTZ(3) NOT NULL,
  "effective_to" TIMESTAMPTZ(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_plan_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organization_plan_assignment_range" CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from"),
  CONSTRAINT "organization_plan_assignment_version" CHECK ("version" > 0),
  CONSTRAINT "organization_plan_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT,
  CONSTRAINT "organization_plan_assignments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "billing_plans"("id") ON DELETE RESTRICT
);
CREATE INDEX "organization_plan_assignments_organization_id_effective_from_idx" ON "organization_plan_assignments"("organization_id", "effective_from");
ALTER TABLE "organization_plan_assignments" ADD CONSTRAINT "organization_plan_assignments_no_overlap" EXCLUDE USING gist (
  "organization_id" WITH =, tstzrange("effective_from", COALESCE("effective_to", 'infinity'::timestamptz), '[)') WITH &&
);

INSERT INTO "organization_plan_assignments" ("id", "organization_id", "plan_id", "effective_from")
SELECT gen_random_uuid(), "id", '0198a4ae-1250-7000-8000-000000000001', '2026-08-10T00:00:00.000Z'
FROM "organizations";

CREATE TABLE "commission_ledger_entries" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "clinic_id" UUID NOT NULL,
  "appointment_id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "original_commission_id" UUID,
  "amount_iqd" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'IQD',
  "rule_code" TEXT NOT NULL,
  "rule_version" INTEGER NOT NULL,
  "plan_version" INTEGER NOT NULL,
  "appointment_type" "AppointmentType" NOT NULL,
  "appointment_origin" "AppointmentOrigin" NOT NULL,
  "completed_at" TIMESTAMPTZ(3) NOT NULL,
  "recognized_at" TIMESTAMPTZ(3) NOT NULL,
  "status" "CommissionLedgerStatus" NOT NULL,
  "reversal_reason" TEXT,
  "reversal_actor_id" UUID,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commission_ledger_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "commission_ledger_iqd_only" CHECK ("currency" = 'IQD' AND "amount_iqd" > 0),
  CONSTRAINT "commission_ledger_versions" CHECK ("rule_version" > 0 AND "plan_version" > 0),
  CONSTRAINT "commission_ledger_reversal_shape" CHECK (("status" = 'earned' AND "original_commission_id" IS NULL AND "reversal_reason" IS NULL AND "reversal_actor_id" IS NULL) OR ("status" = 'reversed' AND "original_commission_id" IS NOT NULL AND char_length(btrim("reversal_reason")) BETWEEN 1 AND 500 AND "reversal_actor_id" IS NOT NULL)),
  CONSTRAINT "commission_ledger_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT,
  CONSTRAINT "commission_ledger_entries_clinic_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "commission_ledger_entries_appointment_fkey" FOREIGN KEY ("organization_id", "appointment_id") REFERENCES "appointments"("organization_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "commission_ledger_entries_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "billing_plans"("id") ON DELETE RESTRICT,
  CONSTRAINT "commission_ledger_entries_original_fkey" FOREIGN KEY ("original_commission_id") REFERENCES "commission_ledger_entries"("id") ON DELETE RESTRICT,
  CONSTRAINT "commission_ledger_entries_reversal_actor_fkey" FOREIGN KEY ("reversal_actor_id") REFERENCES "users"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "commission_one_earned_per_appointment" ON "commission_ledger_entries"("appointment_id") WHERE "status" = 'earned';
CREATE UNIQUE INDEX "commission_one_reversal_per_original" ON "commission_ledger_entries"("original_commission_id");
CREATE INDEX "commission_ledger_entries_organization_id_recognized_at_id_idx" ON "commission_ledger_entries"("organization_id", "recognized_at", "id");
CREATE INDEX "commission_ledger_entries_organization_id_clinic_id_recognized_at_idx" ON "commission_ledger_entries"("organization_id", "clinic_id", "recognized_at");

CREATE FUNCTION reject_financial_history_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Financial history is immutable'; END $$;
CREATE TRIGGER "commission_ledger_immutable" BEFORE UPDATE OR DELETE ON "commission_ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION reject_financial_history_mutation();

CREATE FUNCTION validate_commission_reversal() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE original "commission_ledger_entries"%ROWTYPE;
BEGIN
  IF NEW."status" = 'earned' THEN RETURN NEW; END IF;
  SELECT * INTO original FROM "commission_ledger_entries"
    WHERE "id" = NEW."original_commission_id" FOR KEY SHARE;
  IF NOT FOUND OR original."status" <> 'earned' OR
     NEW."organization_id" <> original."organization_id" OR
     NEW."clinic_id" <> original."clinic_id" OR
     NEW."appointment_id" <> original."appointment_id" OR
     NEW."plan_id" <> original."plan_id" OR
     NEW."amount_iqd" <> original."amount_iqd" OR
     NEW."currency" <> original."currency" OR
     NEW."rule_code" <> original."rule_code" OR
     NEW."rule_version" <> original."rule_version" OR
     NEW."plan_version" <> original."plan_version" OR
     NEW."appointment_type" <> original."appointment_type" OR
     NEW."appointment_origin" <> original."appointment_origin" OR
     NEW."completed_at" <> original."completed_at" OR
     NEW."recognized_at" < original."recognized_at" THEN
    RAISE EXCEPTION 'A reversal must fully mirror its original earned commission';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "commission_reversal_full_and_linked" BEFORE INSERT ON "commission_ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION validate_commission_reversal();

CREATE TABLE "billing_statements" (
  "id" UUID NOT NULL, "organization_id" UUID NOT NULL,
  "period_start" TIMESTAMPTZ(3) NOT NULL, "period_end" TIMESTAMPTZ(3) NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Baghdad', "status" "BillingStatementStatus" NOT NULL DEFAULT 'draft',
  "gross_earned_iqd" INTEGER NOT NULL DEFAULT 0, "reversals_iqd" INTEGER NOT NULL DEFAULT 0,
  "net_commission_iqd" INTEGER NOT NULL DEFAULT 0, "qualifying_count" INTEGER NOT NULL DEFAULT 0,
  "reversal_count" INTEGER NOT NULL DEFAULT 0, "version" INTEGER NOT NULL DEFAULT 1,
  "finalized_at" TIMESTAMPTZ(3), "finalized_by_id" UUID,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "billing_statements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "billing_statements_organization_period_key" UNIQUE ("organization_id", "period_start"),
  CONSTRAINT "billing_statement_period" CHECK ("period_end" > "period_start" AND "timezone" = 'Asia/Baghdad'),
  CONSTRAINT "billing_statement_finalization" CHECK (("status" = 'draft' AND "finalized_at" IS NULL AND "finalized_by_id" IS NULL) OR ("status" = 'finalized' AND "finalized_at" IS NOT NULL AND "finalized_by_id" IS NOT NULL)),
  CONSTRAINT "billing_statements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT,
  CONSTRAINT "billing_statements_finalized_by_id_fkey" FOREIGN KEY ("finalized_by_id") REFERENCES "users"("id") ON DELETE RESTRICT
);
CREATE INDEX "billing_statements_organization_id_period_start_id_idx" ON "billing_statements"("organization_id", "period_start", "id");

CREATE TABLE "billing_statement_lines" (
  "id" UUID NOT NULL, "statement_id" UUID NOT NULL, "ledger_entry_id" UUID NOT NULL,
  "clinic_id" UUID NOT NULL, "appointment_id" UUID NOT NULL, "appointment_reference" TEXT NOT NULL,
  "recognized_at" TIMESTAMPTZ(3) NOT NULL, "status" "CommissionLedgerStatus" NOT NULL,
  "amount_iqd" INTEGER NOT NULL, "net_amount_iqd" INTEGER NOT NULL, "currency" TEXT NOT NULL DEFAULT 'IQD',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_statement_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "billing_statement_lines_ledger_entry_id_key" UNIQUE ("ledger_entry_id"),
  CONSTRAINT "billing_statement_line_iqd" CHECK ("currency" = 'IQD' AND "amount_iqd" > 0),
  CONSTRAINT "billing_statement_lines_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "billing_statements"("id") ON DELETE RESTRICT,
  CONSTRAINT "billing_statement_lines_ledger_entry_id_fkey" FOREIGN KEY ("ledger_entry_id") REFERENCES "commission_ledger_entries"("id") ON DELETE RESTRICT,
  CONSTRAINT "billing_statement_lines_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT,
  CONSTRAINT "billing_statement_lines_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT
);
CREATE INDEX "billing_statement_lines_statement_id_recognized_at_id_idx" ON "billing_statement_lines"("statement_id", "recognized_at", "id");

CREATE TABLE "billing_statement_clinic_breakdowns" (
  "id" UUID NOT NULL, "statement_id" UUID NOT NULL, "clinic_id" UUID NOT NULL,
  "gross_earned_iqd" INTEGER NOT NULL, "reversals_iqd" INTEGER NOT NULL,
  "net_commission_iqd" INTEGER NOT NULL, "qualifying_count" INTEGER NOT NULL, "reversal_count" INTEGER NOT NULL,
  CONSTRAINT "billing_statement_clinic_breakdowns_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "billing_statement_clinic_breakdowns_statement_clinic_key" UNIQUE ("statement_id", "clinic_id"),
  CONSTRAINT "billing_statement_clinic_breakdowns_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "billing_statements"("id") ON DELETE RESTRICT,
  CONSTRAINT "billing_statement_clinic_breakdowns_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT
);

CREATE FUNCTION validate_statement_line_insert() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE statement "billing_statements"%ROWTYPE;
DECLARE ledger "commission_ledger_entries"%ROWTYPE;
DECLARE reference TEXT;
BEGIN
  SELECT * INTO statement FROM "billing_statements" WHERE "id" = NEW."statement_id" FOR KEY SHARE;
  SELECT * INTO ledger FROM "commission_ledger_entries" WHERE "id" = NEW."ledger_entry_id" FOR KEY SHARE;
  SELECT "public_reference" INTO reference FROM "appointments" WHERE "id" = ledger."appointment_id";
  IF statement."id" IS NULL OR ledger."id" IS NULL OR reference IS NULL OR statement."status" <> 'draft' OR
     ledger."organization_id" <> statement."organization_id" OR
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
CREATE TRIGGER "billing_statement_line_valid" BEFORE INSERT ON "billing_statement_lines"
  FOR EACH ROW EXECUTE FUNCTION validate_statement_line_insert();

CREATE FUNCTION validate_statement_breakdown_insert() RETURNS trigger LANGUAGE plpgsql AS $$
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
CREATE TRIGGER "billing_statement_breakdown_valid" BEFORE INSERT ON "billing_statement_clinic_breakdowns"
  FOR EACH ROW EXECUTE FUNCTION validate_statement_breakdown_insert();

CREATE FUNCTION protect_finalized_statement() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE line_totals RECORD;
DECLARE breakdown_totals RECORD;
BEGIN
  IF OLD."status" = 'finalized' THEN RAISE EXCEPTION 'Finalized statement is immutable'; END IF;
  IF NEW."status" = 'draft' AND NEW IS DISTINCT FROM OLD THEN RETURN NEW; END IF;
  IF NEW."status" = 'finalized' THEN
    SELECT
      COALESCE(SUM("amount_iqd") FILTER (WHERE "status" = 'earned'), 0)::INTEGER AS gross,
      COALESCE(SUM("amount_iqd") FILTER (WHERE "status" = 'reversed'), 0)::INTEGER AS reversals,
      COUNT(*) FILTER (WHERE "status" = 'earned')::INTEGER AS qualifying,
      COUNT(*) FILTER (WHERE "status" = 'reversed')::INTEGER AS reversal_count
    INTO line_totals FROM "billing_statement_lines" WHERE "statement_id" = OLD."id";
    SELECT COALESCE(SUM("gross_earned_iqd"), 0)::INTEGER AS gross,
      COALESCE(SUM("reversals_iqd"), 0)::INTEGER AS reversals,
      COALESCE(SUM("net_commission_iqd"), 0)::INTEGER AS net,
      COALESCE(SUM("qualifying_count"), 0)::INTEGER AS qualifying,
      COALESCE(SUM("reversal_count"), 0)::INTEGER AS reversal_count
    INTO breakdown_totals FROM "billing_statement_clinic_breakdowns" WHERE "statement_id" = OLD."id";
    IF NEW."gross_earned_iqd" <> line_totals.gross OR NEW."reversals_iqd" <> line_totals.reversals OR
       NEW."net_commission_iqd" <> line_totals.gross - line_totals.reversals OR
       NEW."qualifying_count" <> line_totals.qualifying OR NEW."reversal_count" <> line_totals.reversal_count OR
       NEW."gross_earned_iqd" <> breakdown_totals.gross OR NEW."reversals_iqd" <> breakdown_totals.reversals OR
       NEW."net_commission_iqd" <> breakdown_totals.net OR NEW."qualifying_count" <> breakdown_totals.qualifying OR
       NEW."reversal_count" <> breakdown_totals.reversal_count THEN
      RAISE EXCEPTION 'Finalized statement snapshot does not reconcile';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Invalid statement lifecycle';
END $$;
CREATE TRIGGER "billing_statement_immutable_after_finalization" BEFORE UPDATE ON "billing_statements"
  FOR EACH ROW EXECUTE FUNCTION protect_finalized_statement();
CREATE TRIGGER "billing_statement_no_delete" BEFORE DELETE ON "billing_statements"
  FOR EACH ROW EXECUTE FUNCTION reject_financial_history_mutation();
CREATE TRIGGER "billing_statement_lines_immutable" BEFORE UPDATE OR DELETE ON "billing_statement_lines"
  FOR EACH ROW EXECUTE FUNCTION reject_financial_history_mutation();
CREATE TRIGGER "billing_statement_breakdowns_immutable" BEFORE UPDATE OR DELETE ON "billing_statement_clinic_breakdowns"
  FOR EACH ROW EXECUTE FUNCTION reject_financial_history_mutation();
