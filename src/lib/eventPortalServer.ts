import { db } from '@/lib/db'
import {
  DEFAULT_EVENT_PORTAL_EVENT_TYPES,
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

export async function buildUniqueEventTypeSlug(
  eventTypeName: string,
  excludeEventTypeId?: string
) {
  const baseSlug = slugify(eventTypeName) || 'event-type'
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const existing = await prisma.eventPortalEventType.findFirst({
      where: excludeEventTypeId
        ? { slug: candidate, NOT: { id: excludeEventTypeId } }
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
  for (const eventType of DEFAULT_EVENT_PORTAL_EVENT_TYPES) {
    await prisma.eventPortalEventType.upsert({
      where: { slug: eventType.slug },
      update: {
        name: eventType.name,
        isSystem: true,
        isActive: true,
      },
      create: {
        name: eventType.name,
        slug: eventType.slug,
        isSystem: true,
        isActive: true,
      },
    })
  }

  const existingCount = await prisma.eventPortalTemplate.count()
  if (existingCount > 0) return

  const eventTypes = await prisma.eventPortalEventType.findMany({
    where: {
      slug: {
        in: DEFAULT_EVENT_PORTAL_EVENT_TYPES.map((eventType) => eventType.slug),
      },
    },
  })
  const eventTypeBySlug = new Map<string, any>(
    eventTypes.map((eventType: any) => [eventType.slug, eventType])
  )

  for (const defaultTemplate of DEFAULT_EVENT_PORTAL_TEMPLATES) {
    const normalized = normalizeTemplateFields(defaultTemplate.fields)
    if (normalized.errors.length > 0) continue
    const eventType = eventTypeBySlug.get(defaultTemplate.eventTypeSlug)
    if (!eventType) continue

    const slug = await buildUniqueTemplateSlug(defaultTemplate.name)
    await prisma.eventPortalTemplate.create({
      data: {
        name: defaultTemplate.name,
        slug,
        eventTypeId: eventType.id,
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
  const eventType = template.eventType || null
  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    eventTypeId: template.eventTypeId,
    eventType: eventType?.name ?? null,
    eventTypeSlug: eventType?.slug ?? null,
    eventTypeDetails: eventType
      ? {
          id: eventType.id,
          name: eventType.name,
          slug: eventType.slug,
          isSystem: Boolean(eventType.isSystem),
          isActive: Boolean(eventType.isActive),
        }
      : null,
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
  const eventType = event.eventType || null
  return {
    id: event.id,
    templateId: event.templateId,
    eventTypeId: event.eventTypeId,
    templateName: event.template?.name ?? null,
    eventName: event.eventName,
    eventType: eventType?.name ?? null,
    eventTypeSlug: eventType?.slug ?? null,
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

