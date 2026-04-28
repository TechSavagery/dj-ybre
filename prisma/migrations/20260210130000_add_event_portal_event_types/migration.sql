-- CreateTable
CREATE TABLE "event_portal_event_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_portal_event_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_portal_event_types_name_key" ON "event_portal_event_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "event_portal_event_types_slug_key" ON "event_portal_event_types"("slug");

-- CreateIndex
CREATE INDEX "event_portal_event_types_isActive_idx" ON "event_portal_event_types"("isActive");

-- CreateIndex
CREATE INDEX "event_portal_event_types_createdAt_idx" ON "event_portal_event_types"("createdAt");

-- Seed top DJ event types
INSERT INTO "event_portal_event_types"
  ("id", "name", "slug", "isSystem", "isActive", "createdAt", "updatedAt")
VALUES
  ('evt_type_wedding', 'Wedding', 'wedding', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('evt_type_school_dance', 'School Dance', 'school-dance', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('evt_type_corporate_event', 'Corporate Event', 'corporate-event', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('evt_type_birthday_party', 'Birthday Party', 'birthday-party', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('evt_type_bar_club', 'Bar / Club', 'bar-club', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('evt_type_quinceanera', 'Quinceanera', 'quinceanera', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('evt_type_sweet_16', 'Sweet 16', 'sweet-16', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('evt_type_private_party', 'Private Party', 'private-party', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- AlterTable
ALTER TABLE "event_portal_templates" ADD COLUMN "eventTypeId" TEXT;
ALTER TABLE "event_portal_events" ADD COLUMN "eventTypeId" TEXT;

-- Backfill event types for existing template/event string values not in defaults
INSERT INTO "event_portal_event_types"
  ("id", "name", "slug", "isSystem", "isActive", "createdAt", "updatedAt")
SELECT DISTINCT
  'evt_custom_' || substring(md5(lower(trim(src.event_type))) from 1 for 20) AS "id",
  trim(src.event_type) AS "name",
  (
    regexp_replace(
      regexp_replace(lower(trim(src.event_type)), '[^a-z0-9]+', '-', 'g'),
      '(^-+|-+$)',
      '',
      'g'
    ) || '-custom-' || substring(md5(lower(trim(src.event_type))) from 1 for 6)
  ) AS "slug",
  false AS "isSystem",
  true AS "isActive",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT "eventType" AS event_type FROM "event_portal_templates"
  UNION
  SELECT "eventType" AS event_type FROM "event_portal_events"
) AS src
WHERE trim(COALESCE(src.event_type, '')) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM "event_portal_event_types" et
    WHERE lower(et."name") = lower(trim(src.event_type))
  );

-- Backfill foreign keys
UPDATE "event_portal_templates" t
SET "eventTypeId" = et."id"
FROM "event_portal_event_types" et
WHERE lower(trim(t."eventType")) = lower(et."name")
  AND t."eventTypeId" IS NULL;

UPDATE "event_portal_events" e
SET "eventTypeId" = et."id"
FROM "event_portal_event_types" et
WHERE lower(trim(e."eventType")) = lower(et."name")
  AND e."eventTypeId" IS NULL;

-- Fallback to Wedding when source value is empty/null
UPDATE "event_portal_templates"
SET "eventTypeId" = 'evt_type_wedding'
WHERE "eventTypeId" IS NULL;

UPDATE "event_portal_events"
SET "eventTypeId" = 'evt_type_wedding'
WHERE "eventTypeId" IS NULL;

-- Enforce relational event type usage
ALTER TABLE "event_portal_templates" ALTER COLUMN "eventTypeId" SET NOT NULL;
ALTER TABLE "event_portal_events" ALTER COLUMN "eventTypeId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "event_portal_templates_eventTypeId_idx" ON "event_portal_templates"("eventTypeId");
CREATE INDEX "event_portal_events_eventTypeId_idx" ON "event_portal_events"("eventTypeId");

-- AddForeignKey
ALTER TABLE "event_portal_templates"
  ADD CONSTRAINT "event_portal_templates_eventTypeId_fkey"
  FOREIGN KEY ("eventTypeId")
  REFERENCES "event_portal_event_types"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "event_portal_events"
  ADD CONSTRAINT "event_portal_events_eventTypeId_fkey"
  FOREIGN KEY ("eventTypeId")
  REFERENCES "event_portal_event_types"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old free-form columns
ALTER TABLE "event_portal_templates" DROP COLUMN "eventType";
ALTER TABLE "event_portal_events" DROP COLUMN "eventType";
