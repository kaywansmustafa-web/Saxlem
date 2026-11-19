CREATE TABLE "push_devices" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "device_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_devices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "push_devices_platform_check" CHECK ("platform" IN ('android', 'ios')),
    CONSTRAINT "push_devices_locale_check" CHECK ("locale" IN ('en', 'ar', 'ku')),
    CONSTRAINT "push_devices_token_check" CHECK (length("token") BETWEEN 20 AND 4096)
);

CREATE UNIQUE INDEX "push_devices_token_key" ON "push_devices"("token");
CREATE INDEX "push_devices_user_id_idx" ON "push_devices"("user_id");
ALTER TABLE "push_devices" ADD CONSTRAINT "push_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "push_dispatch_cursor" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "last_sequence" BIGINT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_dispatch_cursor_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "push_dispatch_cursor_single_row" CHECK ("id" = 1)
);
