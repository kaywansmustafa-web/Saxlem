-- Billing runs in 30-day cycles from the day an organization's first clinic
-- was listed in the app (Asia/Baghdad date). Settlements go both ways, in cash
-- or by FIB. Commission plans can be free (pilots) and set per doctor.

ALTER TABLE "organizations" ADD COLUMN "billing_cycle_start" DATE;
UPDATE "organizations" o SET "billing_cycle_start" = COALESCE(
  (SELECT (min(c."created_at") AT TIME ZONE 'Asia/Baghdad')::date FROM "clinics" c WHERE c."organization_id" = o."id"),
  (o."created_at" AT TIME ZONE 'Asia/Baghdad')::date);

-- Free plans (0 IQD) are allowed; they simply create no charges.
ALTER TABLE "billing_plans" DROP CONSTRAINT "billing_plan_iqd_only";
ALTER TABLE "billing_plans" ADD CONSTRAINT "billing_plan_iqd_only"
  CHECK ("currency" = 'IQD' AND "commission_amount_iqd" >= 0 AND "commission_amount_iqd" <= 1000000);

-- A doctor-specific plan overrides the organization's plan.
CREATE TABLE "doctor_plan_assignments" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "doctor_id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "effective_from" TIMESTAMPTZ(3) NOT NULL,
  "effective_to" TIMESTAMPTZ(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "doctor_plan_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "doctor_plan_assignment_window" CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from"),
  CONSTRAINT "doctor_plan_assignments_doctor_fkey" FOREIGN KEY ("organization_id", "doctor_id") REFERENCES "doctors"("organization_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "doctor_plan_assignments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "billing_plans"("id") ON DELETE RESTRICT
);
CREATE INDEX "doctor_plan_assignments_doctor_idx" ON "doctor_plan_assignments"("organization_id", "doctor_id", "effective_from");
CREATE UNIQUE INDEX "doctor_plan_assignments_one_open" ON "doctor_plan_assignments"("doctor_id") WHERE "effective_to" IS NULL;

-- Settlements: cash or FIB, either direction.
ALTER TABLE "organization_payouts"
  ADD COLUMN "method" TEXT NOT NULL DEFAULT 'fib',
  ADD COLUMN "cycle_number" INTEGER,
  ADD COLUMN "window_start" TIMESTAMPTZ(3),
  ADD COLUMN "counterparty_name" TEXT,
  ALTER COLUMN "reference" DROP NOT NULL;
ALTER TABLE "organization_payouts" ADD CONSTRAINT "organization_payout_method" CHECK ("method" IN ('fib', 'cash'));
ALTER TABLE "organization_payouts" ADD CONSTRAINT "organization_payout_fib_reference"
  CHECK ("method" <> 'fib' OR char_length(btrim(coalesce("reference", ''))) > 0);
ALTER TABLE "organization_payouts" ADD CONSTRAINT "organization_payout_cycle" CHECK ("cycle_number" IS NULL OR "cycle_number" > 0);
