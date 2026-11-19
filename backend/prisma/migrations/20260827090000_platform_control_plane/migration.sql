CREATE TYPE "DocumentCategory" AS ENUM (
  'organization', 'clinic', 'doctor', 'license', 'billing',
  'statement', 'legal', 'report', 'platform'
);

CREATE TYPE "DocumentStatus" AS ENUM ('pendingUpload', 'available', 'deleted');

CREATE TABLE "staff_activation_tokens" (
  "id" UUID NOT NULL,
  "staff_account_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "consumed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "staff_activation_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "staff_activation_tokens_token_hash_key" ON "staff_activation_tokens"("token_hash");
CREATE INDEX "staff_activation_tokens_staff_account_id_consumed_at_expire_idx" ON "staff_activation_tokens"("staff_account_id", "consumed_at", "expires_at");
ALTER TABLE "staff_activation_tokens" ADD CONSTRAINT "staff_activation_tokens_staff_account_id_fkey"
  FOREIGN KEY ("staff_account_id") REFERENCES "staff_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
REVOKE ALL ON TABLE "staff_activation_tokens" FROM PUBLIC;

CREATE TABLE "document_records" (
  "id" UUID NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" UUID NOT NULL,
  "organization_id" UUID,
  "clinic_id" UUID,
  "category" "DocumentCategory" NOT NULL,
  "filename" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "content_type" TEXT NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "status" "DocumentStatus" NOT NULL DEFAULT 'pendingUpload',
  "uploaded_by_user_id" UUID NOT NULL,
  "uploaded_at" TIMESTAMPTZ(3),
  "expires_at" TIMESTAMPTZ(3),
  "deleted_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "document_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "document_records_size_check" CHECK ("size_bytes" BETWEEN 0 AND 26214400),
  CONSTRAINT "document_records_filename_check" CHECK (length("filename") BETWEEN 1 AND 255),
  CONSTRAINT "document_records_entity_type_check" CHECK ("entity_type" ~ '^[a-z][a-zA-Z]{1,39}$')
);

CREATE UNIQUE INDEX "document_records_storage_key_key" ON "document_records"("storage_key");
CREATE INDEX "document_records_category_status_created_at_idx" ON "document_records"("category", "status", "created_at");
CREATE INDEX "document_records_organization_id_clinic_id_status_created_a_idx" ON "document_records"("organization_id", "clinic_id", "status", "created_at");
CREATE INDEX "document_records_entity_type_entity_id_status_idx" ON "document_records"("entity_type", "entity_id", "status");

ALTER TABLE "document_records" ADD CONSTRAINT "document_records_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document_records" ADD CONSTRAINT "document_records_clinic_id_fkey"
  FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document_records" ADD CONSTRAINT "document_records_uploaded_by_user_id_fkey"
  FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

REVOKE ALL ON TABLE "document_records" FROM PUBLIC;
