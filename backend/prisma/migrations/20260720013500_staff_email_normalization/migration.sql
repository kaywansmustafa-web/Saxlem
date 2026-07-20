UPDATE "staff_accounts"
SET "email" = lower(trim("email"));

ALTER TABLE "staff_accounts"
ADD CONSTRAINT "staff_email_normalized_check"
CHECK ("email" = lower(trim("email")) AND char_length("email") <= 254);
