-- Appointment payments: pay at the clinic counter or pay online in the app.
-- Online money is paid into the clinic organization's own merchant account.
-- Saxlem stores only the payment request and its status, never patient funds.

CREATE TYPE "PaymentMethod" AS ENUM ('counter', 'online');
CREATE TYPE "PaymentProvider" AS ENUM ('fib', 'simulated');
CREATE TYPE "PaymentStatus" AS ENUM ('dueAtCounter', 'pending', 'paid', 'expired', 'cancelled', 'refundPending', 'refunded', 'refundFailed', 'void');

CREATE TABLE "organization_payment_accounts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "environment" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret_ciphertext" TEXT NOT NULL,
    "online_enabled" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "organization_payment_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "organization_payment_accounts_environment_check" CHECK (
      ("provider" = 'fib' AND "environment" IN ('stage', 'prod'))
      OR ("provider" = 'simulated' AND "environment" = 'simulated')
    ),
    CONSTRAINT "organization_payment_accounts_client_id_check" CHECK (length("client_id") BETWEEN 1 AND 200),
    CONSTRAINT "organization_payment_accounts_secret_check" CHECK ("client_secret_ciphertext" LIKE 'v1.%'),
    CONSTRAINT "organization_payment_accounts_version_check" CHECK ("version" >= 1)
);

CREATE TABLE "appointment_payments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "provider" "PaymentProvider",
    "status" "PaymentStatus" NOT NULL,
    "amount_iqd" INTEGER NOT NULL,
    "provider_payment_id" TEXT,
    "readable_code" TEXT,
    "qr_code" TEXT,
    "personal_app_link" TEXT,
    "business_app_link" TEXT,
    "valid_until" TIMESTAMPTZ(3),
    "paid_at" TIMESTAMPTZ(3),
    "recorded_by_user_id" UUID,
    "refunded_at" TIMESTAMPTZ(3),
    "failure_reason" TEXT,
    "callback_token" TEXT NOT NULL,
    "last_checked_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "appointment_payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "appointment_payments_amount_check" CHECK ("amount_iqd" > 0),
    CONSTRAINT "appointment_payments_version_check" CHECK ("version" >= 1),
    CONSTRAINT "appointment_payments_method_shape_check" CHECK (
      ("method" = 'counter' AND "provider" IS NULL AND "provider_payment_id" IS NULL
        AND "status" IN ('dueAtCounter', 'paid', 'void'))
      OR ("method" = 'online' AND "provider" IS NOT NULL
        AND "status" IN ('pending', 'paid', 'expired', 'cancelled', 'refundPending', 'refunded', 'refundFailed'))
    ),
    CONSTRAINT "appointment_payments_paid_at_check" CHECK (
      "status" NOT IN ('paid', 'refundPending', 'refunded', 'refundFailed') OR "paid_at" IS NOT NULL
    ),
    CONSTRAINT "appointment_payments_counter_recorder_check" CHECK (
      NOT ("method" = 'counter' AND "status" = 'paid') OR "recorded_by_user_id" IS NOT NULL
    ),
    CONSTRAINT "appointment_payments_callback_token_check" CHECK (length("callback_token") >= 32)
);

CREATE UNIQUE INDEX "organization_payment_accounts_organization_id_key" ON "organization_payment_accounts"("organization_id");
CREATE UNIQUE INDEX "appointment_payments_appointment_id_key" ON "appointment_payments"("appointment_id");
CREATE UNIQUE INDEX "appointment_payments_provider_payment_id_key" ON "appointment_payments"("provider_payment_id");
CREATE UNIQUE INDEX "appointment_payments_callback_token_key" ON "appointment_payments"("callback_token");
CREATE UNIQUE INDEX "appointment_payments_organization_id_clinic_id_appointment__key" ON "appointment_payments"("organization_id", "clinic_id", "appointment_id");
CREATE INDEX "appointment_payments_status_last_checked_at_idx" ON "appointment_payments"("status", "last_checked_at");
CREATE INDEX "appointment_payments_organization_id_clinic_id_created_at_idx" ON "appointment_payments"("organization_id", "clinic_id", "created_at");

ALTER TABLE "organization_payment_accounts" ADD CONSTRAINT "organization_payment_accounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment_payments" ADD CONSTRAINT "appointment_payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment_payments" ADD CONSTRAINT "appointment_payments_organization_id_clinic_id_appointment_fkey" FOREIGN KEY ("organization_id", "clinic_id", "appointment_id") REFERENCES "appointments"("organization_id", "clinic_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment_payments" ADD CONSTRAINT "appointment_payments_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
