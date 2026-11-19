-- Platform collection: online payments can be collected into Saxlem's own
-- FIB account and settled with each organization monthly.

CREATE TYPE "PaymentCollector" AS ENUM ('platform', 'organization');

ALTER TABLE "appointment_payments"
  ADD COLUMN "collected_by" "PaymentCollector",
  ADD COLUMN "payer_name" TEXT,
  ADD COLUMN "payout_id" UUID,
  ADD COLUMN "clawback_payout_id" UUID;

-- Existing online payments were collected into the organization's account.
UPDATE "appointment_payments" SET "collected_by" = 'organization' WHERE "method" = 'online';

ALTER TABLE "appointment_payments"
  ADD CONSTRAINT "appointment_payments_collector_check" CHECK (
    ("method" = 'counter' AND "collected_by" IS NULL)
    OR ("method" = 'online' AND "collected_by" IS NOT NULL)
  ),
  ADD CONSTRAINT "appointment_payments_payout_check" CHECK (
    "payout_id" IS NULL OR ("collected_by" = 'platform' AND "status" IN ('paid', 'refunded', 'refundPending', 'refundFailed'))
  ),
  ADD CONSTRAINT "appointment_payments_clawback_check" CHECK (
    "clawback_payout_id" IS NULL OR ("payout_id" IS NOT NULL AND "status" = 'refunded')
  );

CREATE TABLE "organization_payout_profiles" (
    "organization_id" UUID NOT NULL,
    "online_payments_enabled" BOOLEAN NOT NULL DEFAULT false,
    "payout_account_name" TEXT,
    "payout_account_number" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "organization_payout_profiles_pkey" PRIMARY KEY ("organization_id"),
    CONSTRAINT "organization_payout_profiles_name_check" CHECK ("payout_account_name" IS NULL OR length("payout_account_name") BETWEEN 1 AND 200),
    CONSTRAINT "organization_payout_profiles_number_check" CHECK ("payout_account_number" IS NULL OR length("payout_account_number") BETWEEN 4 AND 64),
    CONSTRAINT "organization_payout_profiles_version_check" CHECK ("version" >= 1)
);

CREATE TABLE "organization_payouts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "period_start" TIMESTAMPTZ(3) NOT NULL,
    "period_end" TIMESTAMPTZ(3) NOT NULL,
    "gross_collected_iqd" INTEGER NOT NULL,
    "clawback_iqd" INTEGER NOT NULL,
    "provider_fee_iqd" INTEGER NOT NULL,
    "commission_iqd" INTEGER NOT NULL,
    "net_payable_iqd" INTEGER NOT NULL,
    "payment_count" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "note" TEXT,
    "settled_at" TIMESTAMPTZ(3) NOT NULL,
    "settled_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_payouts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "organization_payouts_period_check" CHECK ("period_end" > "period_start"),
    CONSTRAINT "organization_payouts_amounts_check" CHECK (
      "gross_collected_iqd" >= 0 AND "clawback_iqd" >= 0 AND "provider_fee_iqd" >= 0 AND "payment_count" >= 0
      AND "net_payable_iqd" = "gross_collected_iqd" - "clawback_iqd" - "provider_fee_iqd" - "commission_iqd"
    ),
    CONSTRAINT "organization_payouts_reference_check" CHECK (length("reference") BETWEEN 1 AND 120)
);

CREATE UNIQUE INDEX "organization_payouts_organization_id_period_start_key" ON "organization_payouts"("organization_id", "period_start");
CREATE INDEX "organization_payouts_period_start_idx" ON "organization_payouts"("period_start");
CREATE INDEX "appointment_payments_organization_id_payout_id_status_idx" ON "appointment_payments"("organization_id", "payout_id", "status");
CREATE INDEX "appointment_payments_paid_at_idx" ON "appointment_payments"("paid_at");

ALTER TABLE "organization_payout_profiles" ADD CONSTRAINT "organization_payout_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organization_payouts" ADD CONSTRAINT "organization_payouts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organization_payouts" ADD CONSTRAINT "organization_payouts_settled_by_id_fkey" FOREIGN KEY ("settled_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment_payments" ADD CONSTRAINT "appointment_payments_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "organization_payouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment_payments" ADD CONSTRAINT "appointment_payments_clawback_payout_id_fkey" FOREIGN KEY ("clawback_payout_id") REFERENCES "organization_payouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
