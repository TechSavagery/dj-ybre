import { db } from '@/lib/db'
import {
  DEFAULT_EVENT_PORTAL_TEMPLATES,
  normalizeTemplateFields,
  slugify,
} from '@/lib/eventPortal'

const prisma = db as any

export async function buildUniqueTemplateSlug(
  templateName: string,
  excludeTemplateId?: string
) {
  const baseSlug = slugify(templateName) || 'event-template'
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const existing = await prisma.eventPortalTemplate.findFirst({
      where: excludeTemplateId
        ? { slug: candidate, NOT: { id: excludeTemplateId } }
        : { slug: candidate },
      select: { id: true },
    })
    if (!existing) {
      return candidate
    }
    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

export async function ensureEventPortalDefaults() {
  const existingCount = await prisma.eventPortalTemplate.count()
  if (existingCount > 0) return

  for (const defaultTemplate of DEFAULT_EVENT_PORTAL_TEMPLATES) {
    const normalized = normalizeTemplateFields(defaultTemplate.fields)
    if (normalized.errors.length > 0) continue

    const slug = await buildUniqueTemplateSlug(defaultTemplate.name)
    await prisma.eventPortalTemplate.create({
      data: {
        name: defaultTemplate.name,
        slug,
        eventType: defaultTemplate.eventType,
        description: defaultTemplate.description,
        isDefault: true,
        fields: {
          create: normalized.fields.map((field) => ({
            key: field.key,
            label: field.label,
            helperText: field.helperText,
            placeholder: field.placeholder,
            type: field.type,
            required: field.required,
            options: field.options,
            fieldOrder: field.fieldOrder,
          })),
        },
      },
    })
  }
}

export function mapTemplateWithFields(template: any) {
  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    eventType: template.eventType,
    description: template.description ?? null,
    isDefault: Boolean(template.isDefault),
    isArchived: Boolean(template.isArchived),
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    fields: Array.isArray(template.fields)
      ? template.fields
          .slice()
          .sort((a: any, b: any) => a.fieldOrder - b.fieldOrder)
          .map((field: any) => ({
            id: field.id,
            key: field.key,
            label: field.label,
            helperText: field.helperText ?? null,
            placeholder: field.placeholder ?? null,
            type: field.type,
            required: Boolean(field.required),
            options: Array.isArray(field.options) ? field.options : [],
            fieldOrder: field.fieldOrder,
          }))
      : [],
  }
}

export function mapEventSummary(event: any) {
  return {
    id: event.id,
    templateId: event.templateId,
    templateName: event.template?.name ?? null,
    eventName: event.eventName,
    eventType: event.eventType,
    eventDate: event.eventDate,
    eventStartTime: event.eventStartTime ?? null,
    eventEndTime: event.eventEndTime ?? null,
    clientName: event.clientName,
    clientEmail: event.clientEmail ?? null,
    notes: event.notes ?? null,
    status: event.status,
    spotifyPlaylistId: event.spotifyPlaylistId ?? null,
    spotifyPlaylistUrl: event.spotifyPlaylistUrl ?? null,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    submittedAt: event.submission?.submittedAt ?? null,
    hasSubmission: Boolean(event.submission),
    clientUrl: `/event-portal/${event.accessCode}`,
  }
}

export function extractSpotifyTrackIdsFromAnswers(answers: any[]) {
  const ids = new Set<string>()
  for (const answer of answers) {
    if (answer?.field?.type !== 'spotify_tracks') continue
    if (!Array.isArray(answer?.valueJson)) continue
    for (const item of answer.valueJson) {
      if (!item || typeof item !== 'object') continue
      const id = typeof item.id === 'string' ? item.id.trim() : ''
      if (!id) continue
      ids.add(id)
    }
  }
  return Array.from(ids)
}

