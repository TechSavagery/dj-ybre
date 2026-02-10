export const EVENT_PORTAL_FIELD_TYPES = [
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
  'phone',
] as const

export type EventPortalFieldType = (typeof EVENT_PORTAL_FIELD_TYPES)[number]

export interface EventPortalTemplateFieldInput {
  key?: string
  label: string
  helperText?: string | null
  placeholder?: string | null
  type: EventPortalFieldType
  required?: boolean
  options?: string[] | null
}

export interface EventPortalNormalizedField {
  key: string
  label: string
  helperText: string | null
  placeholder: string | null
  type: EventPortalFieldType
  required: boolean
  options: string[] | null
  fieldOrder: number
}

export interface EventPortalFieldDefinition {
  id: string
  key: string
  label: string
  type: string
  required: boolean
  options?: unknown
}

export interface EventPortalNormalizedAnswer {
  fieldId: string
  key: string
  valueText: string | null
  valueJson: unknown | null
}

export interface EventPortalSpotifyTrack {
  id: string
  name: string
  artist: string
  album?: string | null
  albumImage?: string | null
  previewUrl?: string | null
  externalUrl?: string | null
  duration?: number | null
}

const FIELD_TYPE_SET = new Set<string>(EVENT_PORTAL_FIELD_TYPES)
const SELECT_TYPES = new Set<EventPortalFieldType>(['select', 'multi_select'])

export const EVENT_PORTAL_COMPONENT_LIBRARY: Array<{
  type: EventPortalFieldType
  title: string
  description: string
  defaultLabel: string
  defaultPlaceholder?: string
  supportsOptions: boolean
  defaultOptions?: string[]
}> = [
  {
    type: 'short_text',
    title: 'Short text',
    description: 'Single-line text input for names and simple prompts.',
    defaultLabel: 'Question',
    defaultPlaceholder: 'Type your answer',
    supportsOptions: false,
  },
  {
    type: 'long_text',
    title: 'Long text',
    description: 'Paragraph input for notes, announcements, or details.',
    defaultLabel: 'Details',
    defaultPlaceholder: 'Share more details',
    supportsOptions: false,
  },
  {
    type: 'number',
    title: 'Number',
    description: 'Numeric answer such as guest count or timeline count.',
    defaultLabel: 'Number value',
    defaultPlaceholder: '0',
    supportsOptions: false,
  },
  {
    type: 'date',
    title: 'Date',
    description: 'Date picker for important event milestones.',
    defaultLabel: 'Date',
    supportsOptions: false,
  },
  {
    type: 'time',
    title: 'Time',
    description: 'Time picker for ceremony, introductions, or sets.',
    defaultLabel: 'Time',
    supportsOptions: false,
  },
  {
    type: 'select',
    title: 'Single select',
    description: 'Dropdown with one option selected.',
    defaultLabel: 'Choose one',
    supportsOptions: true,
    defaultOptions: ['Option 1', 'Option 2', 'Option 3'],
  },
  {
    type: 'multi_select',
    title: 'Multi select',
    description: 'Allow multiple options to be selected.',
    defaultLabel: 'Choose all that apply',
    supportsOptions: true,
    defaultOptions: ['Option 1', 'Option 2', 'Option 3'],
  },
  {
    type: 'checkbox',
    title: 'Checkbox',
    description: 'Simple yes/no acknowledgement field.',
    defaultLabel: 'I confirm this is correct',
    supportsOptions: false,
  },
  {
    type: 'spotify_tracks',
    title: 'Spotify track picker',
    description: 'Search Spotify and submit one or more song requests.',
    defaultLabel: 'Song requests',
    supportsOptions: false,
  },
  {
    type: 'email',
    title: 'Email',
    description: 'Email input with basic format validation.',
    defaultLabel: 'Email address',
    defaultPlaceholder: 'name@example.com',
    supportsOptions: false,
  },
  {
    type: 'phone',
    title: 'Phone',
    description: 'Phone number style text input.',
    defaultLabel: 'Phone number',
    defaultPlaceholder: '(555) 555-5555',
    supportsOptions: false,
  },
]

export const DEFAULT_EVENT_PORTAL_TEMPLATES: Array<{
  name: string
  eventType: string
  description: string
  fields: EventPortalTemplateFieldInput[]
}> = [
  {
    name: 'Wedding Planning Form',
    eventType: 'Wedding',
    description:
      'Collect first dance, parent dance songs, timeline, and key reception details.',
    fields: [
      { key: 'couple_names', label: 'Couple names', type: 'short_text', required: true },
      { key: 'planner_name', label: 'Planner/coordinator name', type: 'short_text' },
      { key: 'venue_name', label: 'Venue name', type: 'short_text', required: true },
      { key: 'cocktail_start_time', label: 'Cocktail hour start', type: 'time' },
      { key: 'grand_entrance_song', label: 'Grand entrance song', type: 'spotify_tracks' },
      { key: 'first_dance_song', label: 'First dance song', type: 'spotify_tracks', required: true },
      { key: 'father_daughter_song', label: 'Father/Daughter dance song', type: 'spotify_tracks' },
      { key: 'mother_son_song', label: 'Mother/Son dance song', type: 'spotify_tracks' },
      { key: 'must_play_songs', label: 'Must-play songs', type: 'spotify_tracks' },
      { key: 'do_not_play', label: 'Do-not-play songs / artists', type: 'long_text' },
      { key: 'special_announcements', label: 'Special announcements', type: 'long_text' },
      { key: 'additional_notes', label: 'Additional notes for DJ/MC', type: 'long_text' },
    ],
  },
  {
    name: 'School Dance Form',
    eventType: 'School Dance',
    description:
      'Capture start/end time, announcements, and student-friendly song requests.',
    fields: [
      { key: 'school_name', label: 'School name', type: 'short_text', required: true },
      { key: 'dance_name', label: 'Dance name (Prom, Winter Formal, etc.)', type: 'short_text' },
      { key: 'start_time', label: 'Start time', type: 'time', required: true },
      { key: 'end_time', label: 'End time', type: 'time' },
      { key: 'announcements', label: 'Announcements to be made', type: 'long_text' },
      {
        key: 'music_styles',
        label: 'Preferred music styles',
        type: 'multi_select',
        options: ['Top 40', 'Hip-Hop', 'Dance', 'Latin', 'Throwbacks', 'Clean Edits Only'],
      },
      { key: 'student_song_requests', label: 'Student song requests', type: 'spotify_tracks' },
      { key: 'special_instructions', label: 'Special event instructions', type: 'long_text' },
    ],
  },
  {
    name: 'Corporate Event Form',
    eventType: 'Corporate',
    description:
      'Collect run-of-show details, introduction notes, and music direction for company events.',
    fields: [
      { key: 'company_name', label: 'Company name', type: 'short_text', required: true },
      { key: 'event_host', label: 'Event host / main contact', type: 'short_text', required: true },
      { key: 'host_email', label: 'Host email', type: 'email' },
      { key: 'program_start_time', label: 'Program start time', type: 'time', required: true },
      { key: 'walkup_songs', label: 'Walk-up songs', type: 'spotify_tracks' },
      { key: 'awards_announcements', label: 'Awards / announcements', type: 'long_text' },
      { key: 'brand_guidelines', label: 'Brand tone + style notes', type: 'long_text' },
      { key: 'do_not_play_corporate', label: 'Do-not-play songs', type: 'long_text' },
    ],
  },
  {
    name: 'Bar / Club Gig Form',
    eventType: 'Bar/Club',
    description:
      'Collect audience vibe, set times, must-play tracks, and venue requests.',
    fields: [
      { key: 'venue_name', label: 'Venue name', type: 'short_text', required: true },
      { key: 'promoter_contact', label: 'Promoter/contact name', type: 'short_text' },
      { key: 'set_start_time', label: 'Set start time', type: 'time' },
      { key: 'set_end_time', label: 'Set end time', type: 'time' },
      {
        key: 'crowd_vibe',
        label: 'Crowd vibe',
        type: 'select',
        options: ['Open format', 'Hip-Hop', 'EDM', 'Latin', 'Throwback mix'],
      },
      { key: 'must_play_club', label: 'Must-play requests', type: 'spotify_tracks' },
      { key: 'do_not_play_club', label: 'Do-not-play list', type: 'long_text' },
      { key: 'mc_notes', label: 'MC / announcement notes', type: 'long_text' },
    ],
  },
]

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function toFieldKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
}

function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function parseOptions(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const option of input) {
    const value = toTrimmedString(option)
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(value)
  }
  return normalized
}

export function normalizeTemplateFields(input: unknown): {
  fields: EventPortalNormalizedField[]
  errors: string[]
} {
  if (!Array.isArray(input)) {
    return { fields: [], errors: ['fields must be an array'] }
  }

  const errors: string[] = []
  const usedKeys = new Set<string>()
  const fields: EventPortalNormalizedField[] = []

  for (let i = 0; i < input.length; i += 1) {
    const raw = input[i]
    if (!raw || typeof raw !== 'object') {
      errors.push(`Field ${i + 1} is invalid`)
      continue
    }

    const data = raw as Record<string, unknown>
    const type = toTrimmedString(data.type)
    const label = toTrimmedString(data.label)
    if (!label) {
      errors.push(`Field ${i + 1}: label is required`)
      continue
    }
    if (!FIELD_TYPE_SET.has(type)) {
      errors.push(`Field "${label}": unsupported type "${type}"`)
      continue
    }

    const typedField = type as EventPortalFieldType
    const customKey = toFieldKey(toTrimmedString(data.key))
    const generatedKey = toFieldKey(label) || `field_${i + 1}`
    let finalKey = customKey || generatedKey
    let suffix = 2
    while (usedKeys.has(finalKey)) {
      finalKey = `${generatedKey}_${suffix}`
      suffix += 1
    }
    usedKeys.add(finalKey)

    const options = SELECT_TYPES.has(typedField) ? parseOptions(data.options) : []
    if (SELECT_TYPES.has(typedField) && options.length === 0) {
      errors.push(`Field "${label}" requires at least one option`)
      continue
    }

    fields.push({
      key: finalKey,
      label,
      helperText: toTrimmedString(data.helperText) || null,
      placeholder: toTrimmedString(data.placeholder) || null,
      type: typedField,
      required: Boolean(data.required),
      options: options.length > 0 ? options : null,
      fieldOrder: fields.length,
    })
  }

  if (fields.length === 0) {
    errors.push('At least one valid field is required')
  }

  return { fields, errors }
}

function coerceBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
  }
  return false
}

function normalizeSpotifyTrack(value: unknown): EventPortalSpotifyTrack | null {
  if (!value || typeof value !== 'object') return null
  const data = value as Record<string, unknown>
  const id = toTrimmedString(data.id)
  const name = toTrimmedString(data.name)
  const artist = toTrimmedString(data.artist)
  if (!id || !name || !artist) return null

  const durationRaw = data.duration
  const duration =
    typeof durationRaw === 'number'
      ? durationRaw
      : typeof durationRaw === 'string' && durationRaw.trim() !== ''
      ? Number(durationRaw)
      : null

  return {
    id,
    name,
    artist,
    album: toTrimmedString(data.album) || null,
    albumImage: toTrimmedString(data.albumImage) || null,
    previewUrl: toTrimmedString(data.previewUrl) || null,
    externalUrl: toTrimmedString(data.externalUrl) || null,
    duration: Number.isFinite(duration ?? NaN) ? Number(duration) : null,
  }
}

function parseExistingOptions(input: unknown): string[] {
  return parseOptions(input)
}

export function normalizeSubmissionAnswers(
  fields: EventPortalFieldDefinition[],
  rawAnswers: unknown
): {
  answers: EventPortalNormalizedAnswer[]
  errors: string[]
  spotifyTrackIds: string[]
} {
  const payload =
    rawAnswers && typeof rawAnswers === 'object' ? (rawAnswers as Record<string, unknown>) : {}
  const errors: string[] = []
  const answers: EventPortalNormalizedAnswer[] = []
  const spotifyTrackIds: string[] = []

  for (const field of fields) {
    const type = String(field.type) as EventPortalFieldType
    const rawValue = payload[field.key]
    const optionValues = parseExistingOptions(field.options)

    let valueText: string | null = null
    let valueJson: unknown | null = null
    let hasValue = false

    if (
      type === 'short_text' ||
      type === 'long_text' ||
      type === 'email' ||
      type === 'phone' ||
      type === 'date' ||
      type === 'time' ||
      type === 'select' ||
      type === 'number'
    ) {
      const text = toTrimmedString(rawValue)
      if (type === 'number' && text) {
        const numberValue = Number(text)
        if (!Number.isFinite(numberValue)) {
          errors.push(`"${field.label}" must be a valid number`)
        }
      }
      if (type === 'email' && text) {
        const validEmail = /\S+@\S+\.\S+/.test(text)
        if (!validEmail) {
          errors.push(`"${field.label}" must be a valid email address`)
        }
      }
      if (type === 'select' && text && optionValues.length > 0 && !optionValues.includes(text)) {
        errors.push(`"${field.label}" contains an invalid option`)
      }
      valueText = text || null
      hasValue = Boolean(text)
    } else if (type === 'multi_select') {
      const source = Array.isArray(rawValue)
        ? rawValue
        : typeof rawValue === 'string'
        ? rawValue.split(',')
        : []
      const normalized = Array.from(
        new Set(
          source
            .map((item) => toTrimmedString(item))
            .filter(Boolean)
            .filter((item) => (optionValues.length > 0 ? optionValues.includes(item) : true))
        )
      )
      valueJson = normalized
      hasValue = normalized.length > 0
    } else if (type === 'checkbox') {
      const checked = coerceBoolean(rawValue)
      valueJson = checked
      hasValue = checked
    } else if (type === 'spotify_tracks') {
      const source = Array.isArray(rawValue) ? rawValue : []
      const seen = new Set<string>()
      const normalized: EventPortalSpotifyTrack[] = []
      for (const item of source) {
        const track = normalizeSpotifyTrack(item)
        if (!track || seen.has(track.id)) continue
        seen.add(track.id)
        normalized.push(track)
        spotifyTrackIds.push(track.id)
      }
      valueJson = normalized
      hasValue = normalized.length > 0
    } else {
      errors.push(`"${field.label}" has an unsupported field type`)
      continue
    }

    if (field.required && !hasValue) {
      errors.push(`"${field.label}" is required`)
    }

    answers.push({
      fieldId: field.id,
      key: field.key,
      valueText,
      valueJson,
    })
  }

  return {
    answers,
    errors,
    spotifyTrackIds: Array.from(new Set(spotifyTrackIds)),
  }
}

export function isSchoolDanceEventType(eventType: string) {
  const normalized = String(eventType || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
  return normalized === 'schooldance'
}

