-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('scheduled', 'checkedIn', 'completed', 'cancelled', 'noShow');

-- CreateEnum
CREATE TYPE "QueueSessionStatus" AS ENUM ('scheduled', 'open', 'paused', 'closing', 'closed');

-- CreateEnum
CREATE TYPE "QueueEntryStatus" AS ENUM ('expected', 'checkedIn', 'ready', 'called', 'inConsultation', 'completed', 'noResponse', 'removed');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('high', 'normal', 'information');

-- CreateEnum
CREATE TYPE "AuditOutcome" AS ENUM ('succeeded', 'denied', 'failed');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "normalized_phone_number" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_profiles" (
    "id" UUID NOT NULL,
    "patient_account_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_relationships" (
    "id" UUID NOT NULL,
    "patient_account_id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "relationship" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "staff_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_memberships" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clinic_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" UUID NOT NULL,
    "staff_account_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "specialty_code" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_schedules" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "public_reference" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "fee_iqd" INTEGER NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'scheduled',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "appointment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_sessions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "operational_date" DATE NOT NULL,
    "status" "QueueSessionStatus" NOT NULL DEFAULT 'scheduled',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "queue_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_entries" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "queue_session_id" UUID NOT NULL,
    "appointment_id" UUID,
    "patient_profile_id" UUID NOT NULL,
    "queue_number" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "QueueEntryStatus" NOT NULL DEFAULT 'expected',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_records" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "clinic_id" UUID,
    "recipient_user_id" UUID NOT NULL,
    "patient_profile_id" UUID,
    "type" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'normal',
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "read_at" TIMESTAMPTZ(3),

    CONSTRAINT "notification_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "family_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "replaced_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_challenges" (
    "id" UUID NOT NULL,
    "normalized_phone_number" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "consumed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "response_code" INTEGER,
    "response_body" JSONB,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "published_at" TIMESTAMPTZ(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "clinic_id" UUID,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID,
    "outcome" "AuditOutcome" NOT NULL,
    "request_id" TEXT NOT NULL,
    "metadata" JSONB,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clinics_organization_id_status_idx" ON "clinics"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "clinics_organization_id_id_key" ON "clinics"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_accounts_user_id_key" ON "patient_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_accounts_normalized_phone_number_key" ON "patient_accounts"("normalized_phone_number");

-- CreateIndex
CREATE INDEX "patient_profiles_patient_account_id_idx" ON "patient_profiles"("patient_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "family_relationships_patient_account_id_patient_profile_id_key" ON "family_relationships"("patient_account_id", "patient_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_accounts_user_id_key" ON "staff_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_accounts_email_key" ON "staff_accounts"("email");

-- CreateIndex
CREATE INDEX "clinic_memberships_user_id_status_idx" ON "clinic_memberships"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_memberships_organization_id_clinic_id_user_id_role_key" ON "clinic_memberships"("organization_id", "clinic_id", "user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_staff_account_id_key" ON "doctors"("staff_account_id");

-- CreateIndex
CREATE INDEX "doctor_schedules_organization_id_clinic_id_doctor_id_starts_idx" ON "doctor_schedules"("organization_id", "clinic_id", "doctor_id", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_public_reference_key" ON "appointments"("public_reference");

-- CreateIndex
CREATE INDEX "appointments_organization_id_clinic_id_starts_at_idx" ON "appointments"("organization_id", "clinic_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointments_organization_id_doctor_id_starts_at_idx" ON "appointments"("organization_id", "doctor_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointments_patient_profile_id_starts_at_idx" ON "appointments"("patient_profile_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointment_events_organization_id_appointment_id_occurred__idx" ON "appointment_events"("organization_id", "appointment_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "queue_sessions_organization_id_clinic_id_doctor_id_operatio_key" ON "queue_sessions"("organization_id", "clinic_id", "doctor_id", "operational_date");

-- CreateIndex
CREATE INDEX "queue_entries_organization_id_queue_session_id_status_posit_idx" ON "queue_entries"("organization_id", "queue_session_id", "status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "queue_entries_queue_session_id_queue_number_key" ON "queue_entries"("queue_session_id", "queue_number");

-- CreateIndex
CREATE UNIQUE INDEX "queue_entries_queue_session_id_appointment_id_key" ON "queue_entries"("queue_session_id", "appointment_id");

-- CreateIndex
CREATE INDEX "notification_records_recipient_user_id_read_at_occurred_at_idx" ON "notification_records"("recipient_user_id", "read_at", "occurred_at");

-- CreateIndex
CREATE INDEX "notification_records_organization_id_clinic_id_occurred_at_idx" ON "notification_records"("organization_id", "clinic_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_sessions_token_hash_key" ON "refresh_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_sessions_user_id_revoked_at_expires_at_idx" ON "refresh_sessions"("user_id", "revoked_at", "expires_at");

-- CreateIndex
CREATE INDEX "otp_challenges_normalized_phone_number_created_at_idx" ON "otp_challenges"("normalized_phone_number", "created_at");

-- CreateIndex
CREATE INDEX "otp_challenges_expires_at_idx" ON "otp_challenges"("expires_at");

-- CreateIndex
CREATE INDEX "idempotency_records_expires_at_idx" ON "idempotency_records"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_actor_id_scope_key_key" ON "idempotency_records"("actor_id", "scope", "key");

-- CreateIndex
CREATE INDEX "outbox_events_published_at_occurred_at_idx" ON "outbox_events"("published_at", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_organization_id_occurred_at_idx" ON "audit_events"("organization_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_actor_user_id_occurred_at_idx" ON "audit_events"("actor_user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_target_type_target_id_occurred_at_idx" ON "audit_events"("target_type", "target_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_accounts" ADD CONSTRAINT "patient_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_patient_account_id_fkey" FOREIGN KEY ("patient_account_id") REFERENCES "patient_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_patient_account_id_fkey" FOREIGN KEY ("patient_account_id") REFERENCES "patient_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_accounts" ADD CONSTRAINT "staff_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_memberships" ADD CONSTRAINT "clinic_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_memberships" ADD CONSTRAINT "clinic_memberships_organization_id_clinic_id_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_memberships" ADD CONSTRAINT "clinic_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_staff_account_id_fkey" FOREIGN KEY ("staff_account_id") REFERENCES "staff_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_organization_id_clinic_id_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organization_id_clinic_id_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_sessions" ADD CONSTRAINT "queue_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_sessions" ADD CONSTRAINT "queue_sessions_organization_id_clinic_id_fkey" FOREIGN KEY ("organization_id", "clinic_id") REFERENCES "clinics"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_sessions" ADD CONSTRAINT "queue_sessions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_queue_session_id_fkey" FOREIGN KEY ("queue_session_id") REFERENCES "queue_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_records" ADD CONSTRAINT "notification_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_records" ADD CONSTRAINT "notification_records_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_records" ADD CONSTRAINT "notification_records_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_records" ADD CONSTRAINT "notification_records_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain safety constraints not expressible in the Prisma schema.
ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_duration_minutes_positive" CHECK ("duration_minutes" > 0),
  ADD CONSTRAINT "appointments_fee_iqd_non_negative" CHECK ("fee_iqd" >= 0),
  ADD CONSTRAINT "appointments_version_positive" CHECK ("version" > 0);

ALTER TABLE "doctor_schedules"
  ADD CONSTRAINT "doctor_schedules_valid_range" CHECK ("ends_at" > "starts_at");

ALTER TABLE "queue_sessions"
  ADD CONSTRAINT "queue_sessions_version_positive" CHECK ("version" > 0);

ALTER TABLE "queue_entries"
  ADD CONSTRAINT "queue_entries_queue_number_positive" CHECK ("queue_number" > 0),
  ADD CONSTRAINT "queue_entries_position_non_negative" CHECK ("position" >= 0),
  ADD CONSTRAINT "queue_entries_version_positive" CHECK ("version" > 0);

CREATE UNIQUE INDEX "queue_entries_single_active_consultation"
  ON "queue_entries" ("queue_session_id")
  WHERE "status" IN ('called', 'inConsultation');
