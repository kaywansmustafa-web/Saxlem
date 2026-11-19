-- App catalog managed from the Owner Portal (founder request 2026-11-19):
-- specialty names in Arabic and Badini, icon, order and Home visibility;
-- the "What's bothering you?" tiles, each linked to any number of
-- specialties; and platform settings the app and server read at run time.

ALTER TABLE "specialties"
  ADD COLUMN "name_ar" TEXT,
  ADD COLUMN "name_ku" TEXT,
  ADD COLUMN "icon" TEXT NOT NULL DEFAULT 'hospital',
  ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN "show_on_home" BOOLEAN NOT NULL DEFAULT true,
  ADD CONSTRAINT "specialties_name_ar_check" CHECK ("name_ar" IS NULL OR char_length(btrim("name_ar")) BETWEEN 1 AND 120),
  ADD CONSTRAINT "specialties_name_ku_check" CHECK ("name_ku" IS NULL OR char_length(btrim("name_ku")) BETWEEN 1 AND 120),
  ADD CONSTRAINT "specialties_icon_check" CHECK ("icon" ~ '^[a-z][a-z-]{1,31}$'),
  ADD CONSTRAINT "specialties_sort_order_check" CHECK ("sort_order" BETWEEN 0 AND 10000);

-- Icons for the specialties that already exist, by code.
UPDATE "specialties" SET "icon" = CASE
  WHEN "code" ~ 'pediat|paediat' THEN 'child'
  WHEN "code" ~ 'dent' THEN 'tooth'
  WHEN "code" ~ 'derma|skin' THEN 'skin'
  WHEN "code" ~ 'cardi' THEN 'heart'
  WHEN "code" ~ 'ophthal|eye' THEN 'eye'
  WHEN "code" ~ 'gyn|obstet' THEN 'pregnancy'
  WHEN "code" ~ 'ortho|rheum' THEN 'bones'
  WHEN "code" ~ '^ent$|^ent-|-ent$|otolaryng' THEN 'ear'
  WHEN "code" ~ 'neuro' THEN 'brain'
  WHEN "code" ~ 'gastro|digest' THEN 'stomach'
  WHEN "code" ~ 'pulmo|chest|respir' THEN 'lungs'
  WHEN "code" ~ 'nephro|urolog' THEN 'kidney'
  WHEN "code" ~ 'psych' THEN 'mind'
  WHEN "code" ~ 'general|family|internal' THEN 'general'
  ELSE 'hospital' END;

CREATE INDEX "specialties_status_sort_idx" ON "specialties"("status", "sort_order");

CREATE TABLE "home_concerns" (
  "id" UUID NOT NULL,
  "label_en" TEXT NOT NULL,
  "label_ar" TEXT NOT NULL,
  "label_ku" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "tone" TEXT NOT NULL DEFAULT 'blue',
  "sort_order" INTEGER NOT NULL DEFAULT 100,
  "status" "RecordStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "home_concerns_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "home_concerns_label_en_check" CHECK (char_length(btrim("label_en")) BETWEEN 1 AND 60),
  CONSTRAINT "home_concerns_label_ar_check" CHECK (char_length(btrim("label_ar")) BETWEEN 1 AND 60),
  CONSTRAINT "home_concerns_label_ku_check" CHECK (char_length(btrim("label_ku")) BETWEEN 1 AND 60),
  CONSTRAINT "home_concerns_icon_check" CHECK ("icon" ~ '^[a-z][a-z-]{1,31}$'),
  CONSTRAINT "home_concerns_tone_check" CHECK ("tone" IN ('blue', 'rose', 'amber', 'aqua', 'lilac')),
  CONSTRAINT "home_concerns_sort_order_check" CHECK ("sort_order" BETWEEN 0 AND 10000)
);
CREATE INDEX "home_concerns_status_sort_idx" ON "home_concerns"("status", "sort_order");

CREATE TABLE "home_concern_specialties" (
  "concern_id" UUID NOT NULL,
  "specialty_id" UUID NOT NULL,
  CONSTRAINT "home_concern_specialties_pkey" PRIMARY KEY ("concern_id", "specialty_id")
);
CREATE INDEX "home_concern_specialties_specialty_idx" ON "home_concern_specialties"("specialty_id");
ALTER TABLE "home_concern_specialties" ADD CONSTRAINT "home_concern_specialties_concern_fkey"
  FOREIGN KEY ("concern_id") REFERENCES "home_concerns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "home_concern_specialties" ADD CONSTRAINT "home_concern_specialties_specialty_fkey"
  FOREIGN KEY ("specialty_id") REFERENCES "specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "platform_settings" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_by" UUID,
  CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key"),
  CONSTRAINT "platform_settings_key_check" CHECK ("key" ~ '^[a-z][a-zA-Z]{1,31}\.[a-z][a-zA-Z0-9]{1,47}$')
);
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_fkey"
  FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- The eleven tiles the app had built in, with the reviewed Arabic and Badini
-- wording, linked to the specialties that exist now by the same code rules.
WITH seed("n", "label_en", "label_ar", "label_ku", "icon", "tone", "pattern") AS (
  VALUES
    (1, 'Fever or cold', 'حمى أو زكام', 'تا یان سەرمابوون', 'fever', 'rose', 'general|family|internal'),
    (2, 'My child is sick', 'طفلي مريض', 'زارۆکێ من نەخۆشە', 'child', 'amber', 'pediat|paediat'),
    (3, 'Tooth pain', 'ألم الأسنان', 'ئێشانا ددانان', 'tooth', 'aqua', 'dent'),
    (4, 'Skin', 'الجلد', 'پێست', 'skin', 'lilac', 'derma|skin'),
    (5, 'Heart and blood pressure', 'القلب والضغط', 'دل و پەستانا خوێنێ', 'heart', 'blue', 'cardi'),
    (6, 'Eyes', 'العيون', 'چاڤ', 'eye', 'rose', 'ophthal|eye'),
    (7, 'Pregnancy and women''s health', 'الحمل وصحة المرأة', 'دووگیانی و ساخلەمیا ئافرەتان', 'pregnancy', 'amber', 'gyn|obstet'),
    (8, 'Bones and joints', 'العظام والمفاصل', 'هەستی و جومگە', 'bones', 'aqua', 'ortho|rheum'),
    (9, 'Ear, nose, throat', 'الأذن والأنف والحنجرة', 'گوه، لووت و قورگ', 'ear', 'lilac', '^ent$|^ent-|-ent$|otolaryng'),
    (10, 'Headache and nerves', 'الصداع والأعصاب', 'سەرئێشان و نەخۆشیێن دەماران', 'brain', 'blue', 'neuro'),
    (11, 'Stomach', 'المعدة', 'گەدە', 'stomach', 'rose', 'gastro|digest')
), inserted AS (
  INSERT INTO "home_concerns" ("id", "label_en", "label_ar", "label_ku", "icon", "tone", "sort_order", "updated_at")
  SELECT gen_random_uuid(), "label_en", "label_ar", "label_ku", "icon", "tone", "n" * 10, CURRENT_TIMESTAMP FROM seed
  RETURNING "id", "label_en"
)
INSERT INTO "home_concern_specialties" ("concern_id", "specialty_id")
SELECT inserted."id", s."id"
FROM inserted
JOIN seed ON seed."label_en" = inserted."label_en"
JOIN "specialties" s ON s."code" ~ seed."pattern";
