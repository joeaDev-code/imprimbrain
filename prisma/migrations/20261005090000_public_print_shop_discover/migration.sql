-- Public print-shop discovery/profile fields. All new public exposure is opt-in.
ALTER TABLE "Organization"
  ADD COLUMN "whatsappEncrypted" TEXT,
  ADD COLUMN "whatsappBlindIndex" TEXT,
  ADD COLUMN "publicProfileEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "publicDescription" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "neighborhood" TEXT,
  ADD COLUMN "latitude" DECIMAL(9,6),
  ADD COLUMN "longitude" DECIMAL(9,6),
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Africa/Abidjan';

CREATE TABLE "OrganizationOpeningHour" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "openMinute" INTEGER,
  "closeMinute" INTEGER,
  "closed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationOpeningHour_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationOpeningHour_organizationId_dayOfWeek_key"
  ON "OrganizationOpeningHour"("organizationId", "dayOfWeek");
CREATE INDEX "OrganizationOpeningHour_organizationId_dayOfWeek_idx"
  ON "OrganizationOpeningHour"("organizationId", "dayOfWeek");
CREATE INDEX "Organization_status_publicProfileEnabled_idx"
  ON "Organization"("status", "publicProfileEnabled");
CREATE INDEX "Organization_city_publicProfileEnabled_idx"
  ON "Organization"("city", "publicProfileEnabled");

ALTER TABLE "OrganizationOpeningHour"
  ADD CONSTRAINT "OrganizationOpeningHour_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationOpeningHour"
  ADD CONSTRAINT "OrganizationOpeningHour_dayOfWeek_check" CHECK ("dayOfWeek" BETWEEN 0 AND 6),
  ADD CONSTRAINT "OrganizationOpeningHour_time_check" CHECK (
    ("closed" = true AND "openMinute" IS NULL AND "closeMinute" IS NULL)
    OR
    ("closed" = false AND "openMinute" IS NOT NULL AND "closeMinute" IS NOT NULL AND "openMinute" BETWEEN 0 AND 1439 AND "closeMinute" BETWEEN 1 AND 1440 AND "closeMinute" > "openMinute")
  );

ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_coordinates_pair_check" CHECK (("latitude" IS NULL AND "longitude" IS NULL) OR ("latitude" IS NOT NULL AND "longitude" IS NOT NULL)),
  ADD CONSTRAINT "Organization_latitude_check" CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90),
  ADD CONSTRAINT "Organization_longitude_check" CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180);
