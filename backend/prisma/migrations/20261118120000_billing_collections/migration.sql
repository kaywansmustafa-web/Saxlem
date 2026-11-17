-- Collecting what doctors owe, gently and in order: reminders, then the
-- unpaid balance is carried into the next statement (taken from app
-- payments), then, only if still unpaid well past the due date, the doctor
-- is hidden from the patient app until it is paid.

ALTER TABLE "doctors"
  ADD COLUMN "app_hidden_at" TIMESTAMPTZ(3),
  ADD COLUMN "billing_grace_until" TIMESTAMPTZ(3);

ALTER TABLE "organization_payouts" DROP CONSTRAINT "organization_payout_method";
ALTER TABLE "organization_payouts" ADD CONSTRAINT "organization_payout_method"
  CHECK ("method" IN ('fib', 'cash', 'carried'));
ALTER TABLE "organization_payouts"
  ADD COLUMN "carried_into_cycle" INTEGER,
  ADD COLUMN "carried_in_iqd" INTEGER NOT NULL DEFAULT 0;
-- A carried statement is one the doctor owed and did not pay; it moves into
-- the next statement instead of being paid.
ALTER TABLE "organization_payouts" ADD CONSTRAINT "organization_payout_carried"
  CHECK (
    ("method" = 'carried') = ("carried_into_cycle" IS NOT NULL)
    AND ("method" <> 'carried' OR ("net_payable_iqd" < 0 AND "carried_into_cycle" = "cycle_number" + 1))
  );
ALTER TABLE "organization_payouts" ADD CONSTRAINT "organization_payout_carried_in"
  CHECK ("carried_in_iqd" <= 0);

-- Carrying happens automatically; every cash or FIB settlement still names
-- who recorded it.
ALTER TABLE "organization_payouts" ALTER COLUMN "settled_by_id" DROP NOT NULL;
ALTER TABLE "organization_payouts" ADD CONSTRAINT "organization_payout_recorded_by"
  CHECK ("method" = 'carried' OR "settled_by_id" IS NOT NULL);

-- The net now includes any unpaid balance carried in from earlier statements.
ALTER TABLE "organization_payouts" DROP CONSTRAINT "organization_payouts_amounts_check";
ALTER TABLE "organization_payouts" ADD CONSTRAINT "organization_payouts_amounts_check" CHECK (
  "gross_collected_iqd" >= 0 AND "clawback_iqd" >= 0 AND "provider_fee_iqd" >= 0 AND "payment_count" >= 0
  AND "net_payable_iqd" = "gross_collected_iqd" - "clawback_iqd" - "provider_fee_iqd" - "commission_iqd" + "carried_in_iqd"
);
