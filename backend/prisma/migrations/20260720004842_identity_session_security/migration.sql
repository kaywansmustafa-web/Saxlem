/*
  Warnings:

  - Added the required column `platform` to the `refresh_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IdentityRole" AS ENUM ('patient', 'receptionist', 'doctor', 'clinicManager', 'platformAdministrator');

-- CreateEnum
CREATE TYPE "AuthenticationEventType" AS ENUM ('otpRequested', 'otpVerified', 'loginSucceeded', 'loginFailed', 'logout', 'logoutAll', 'refresh', 'refreshReuseDetected', 'lockout');

-- AlterTable
ALTER TABLE "otp_challenges" ADD COLUMN     "last_sent_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "locked_at" TIMESTAMPTZ(3),
ADD COLUMN     "resend_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "refresh_sessions" ADD COLUMN     "ip_hash" TEXT,
ADD COLUMN     "last_used_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "platform" TEXT NOT NULL,
ADD COLUMN     "user_agent" TEXT;

-- CreateTable
CREATE TABLE "identity_role_assignments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID,
    "clinic_id" UUID,
    "role" "IdentityRole" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_families" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authentication_events" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "type" "AuthenticationEventType" NOT NULL,
    "subject_hash" TEXT,
    "session_family_id" UUID,
    "metadata" JSONB,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authentication_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "identity_role_assignments_organization_id_clinic_id_role_idx" ON "identity_role_assignments"("organization_id", "clinic_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "identity_role_assignments_user_id_organization_id_clinic_id_key" ON "identity_role_assignments"("user_id", "organization_id", "clinic_id", "role");

-- CreateIndex
CREATE INDEX "session_families_user_id_revoked_at_idx" ON "session_families"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "authentication_events_user_id_occurred_at_idx" ON "authentication_events"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "authentication_events_type_occurred_at_idx" ON "authentication_events"("type", "occurred_at");

-- CreateIndex
CREATE INDEX "otp_challenges_normalized_phone_number_consumed_at_locked_a_idx" ON "otp_challenges"("normalized_phone_number", "consumed_at", "locked_at");

-- AddForeignKey
ALTER TABLE "identity_role_assignments" ADD CONSTRAINT "identity_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "session_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_families" ADD CONSTRAINT "session_families_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authentication_events" ADD CONSTRAINT "authentication_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
