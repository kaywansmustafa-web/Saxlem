-- Where a clinic is and how to reach it, so patients can find and call it.
ALTER TABLE "clinics"
  ADD COLUMN "address" TEXT,
  ADD COLUMN "area" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD COLUMN "phone_number" TEXT;

ALTER TABLE "clinics"
  ADD CONSTRAINT "clinics_address_length" CHECK ("address" IS NULL OR char_length("address") BETWEEN 1 AND 300),
  ADD CONSTRAINT "clinics_area_length" CHECK ("area" IS NULL OR char_length("area") BETWEEN 1 AND 120),
  ADD CONSTRAINT "clinics_city_length" CHECK ("city" IS NULL OR char_length("city") BETWEEN 1 AND 80),
  ADD CONSTRAINT "clinics_coordinates_together" CHECK (("latitude" IS NULL) = ("longitude" IS NULL)),
  ADD CONSTRAINT "clinics_latitude_range" CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90),
  ADD CONSTRAINT "clinics_longitude_range" CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180),
  ADD CONSTRAINT "clinics_phone_number_format" CHECK ("phone_number" IS NULL OR "phone_number" ~ '^\+?[0-9]{7,15}$');
