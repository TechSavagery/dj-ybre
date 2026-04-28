-- CreateEnum
CREATE TYPE "EventPortalFieldType" AS ENUM (
  'short_text',
  'long_text',
  'number',
  'date',
  'time',
  'select',
  'multi_select',
  'checkbox',
  'spotify_tracks',
  'email',
  'phone'
);

-- CreateTable
CREATE TABLE "event_portal_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_portal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_portal_template_fields" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "helperText" TEXT,
    "placeholder" TEXT,
    "type" "EventPortalFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "fieldOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_portal_template_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_portal_events" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TEXT NOT NULL,
    "eventStartTime" TEXT,
    "eventEndTime" TEXT,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "spotifyPlaylistId" TEXT,
    "spotifyPlaylistUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_portal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_portal_submissions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_portal_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_portal_submission_answers" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "valueText" TEXT,
    "valueJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_portal_submission_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_portal_templates_slug_key" ON "event_portal_templates"("slug");

-- CreateIndex
CREATE INDEX "event_portal_templates_eventType_idx" ON "event_portal_templates"("eventType");

-- CreateIndex
CREATE INDEX "event_portal_templates_createdAt_idx" ON "event_portal_templates"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_portal_template_fields_templateId_key_key" ON "event_portal_template_fields"("templateId", "key");

-- CreateIndex
CREATE INDEX "event_portal_template_fields_templateId_fieldOrder_idx" ON "event_portal_template_fields"("templateId", "fieldOrder");

-- CreateIndex
CREATE UNIQUE INDEX "event_portal_events_accessCode_key" ON "event_portal_events"("accessCode");

-- CreateIndex
CREATE INDEX "event_portal_events_eventDate_idx" ON "event_portal_events"("eventDate");

-- CreateIndex
CREATE INDEX "event_portal_events_createdAt_idx" ON "event_portal_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_portal_submissions_eventId_key" ON "event_portal_submissions"("eventId");

-- CreateIndex
CREATE INDEX "event_portal_submissions_submittedAt_idx" ON "event_portal_submissions"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_portal_submission_answers_submissionId_fieldId_key" ON "event_portal_submission_answers"("submissionId", "fieldId");

-- CreateIndex
CREATE INDEX "event_portal_submission_answers_fieldId_idx" ON "event_portal_submission_answers"("fieldId");

-- AddForeignKey
ALTER TABLE "event_portal_template_fields" ADD CONSTRAINT "event_portal_template_fields_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "event_portal_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_portal_events" ADD CONSTRAINT "event_portal_events_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "event_portal_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_portal_submissions" ADD CONSTRAINT "event_portal_submissions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event_portal_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_portal_submission_answers" ADD CONSTRAINT "event_portal_submission_answers_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "event_portal_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_portal_submission_answers" ADD CONSTRAINT "event_portal_submission_answers_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "event_portal_template_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
