'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminButton } from '@/components/admin/AdminButton'
import { AdminCard, AdminCardBody, AdminCardHeader } from '@/components/admin/AdminCard'
import { AdminInput, AdminLabel, AdminTextarea, AdminHelp } from '@/components/admin/AdminForm'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminSelectMenu } from '@/components/admin/AdminSelectMenu'

interface TemplateItem {
  id: string
  name: string
  eventTypeId: string
  eventType: string
  isDefault: boolean
}

interface EventTypeItem {
  id: string
  name: string
  slug: string
  isSystem: boolean
  isActive: boolean
  templatesCount: number
  eventsCount: number
}

interface EventItem {
  id: string
  templateId: string
  templateName?: string | null
  eventName: string
  eventType: string
  eventDate: string
  eventStartTime?: string | null
  eventEndTime?: string | null
  venueName?: string | null
  organizerName?: string | null
  organizerEmail?: string | null
  organizerPhone?: string | null
  clientName: string
  clientEmail?: string | null
  notes?: string | null
  status: string
  hasSubmission: boolean
  submittedAt?: string | null
  clientUrl: string
}

const EVENT_STATUS_OPTIONS = ['sent', 'submitted', 'approved', 'complete']

export default function EventPortalManagePage() {
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([])
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState('')

  const [templateId, setTemplateId] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventTypeId, setEventTypeId] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [venueName, setVenueName] = useState('')
  const [organizerName, setOrganizerName] = useState('')
  const [organizerEmail, setOrganizerEmail] = useState('')
  const [organizerPhone, setOrganizerPhone] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [accessPin, setAccessPin] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [createdLink, setCreatedLink] = useState('')
  const [newEventTypeName, setNewEventTypeName] = useState('')
  const [eventTypeSaveState, setEventTypeSaveState] = useState<'idle' | 'saving' | 'error'>('idle')
  const [eventTypeMessage, setEventTypeMessage] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [eventTypesRes, templateRes, eventsRes] = await Promise.all([
        fetch('/api/event-portal/event-types'),
        fetch('/api/event-portal/templates'),
        fetch('/api/event-portal/events?includePast=1'),
      ])
      if (eventTypesRes.ok) {
        const eventTypesData = await eventTypesRes.json()
        const allEventTypes = Array.isArray(eventTypesData?.eventTypes)
          ? eventTypesData.eventTypes
          : []
        setEventTypes(allEventTypes)
        setEventTypeId((prev) => prev || allEventTypes[0]?.id || '')
      }
      if (templateRes.ok) {
        const templateData = await templateRes.json()
        const allTemplates = Array.isArray(templateData?.templates) ? templateData.templates : []
        setTemplates(allTemplates)
        setTemplateId((prev) => prev || allTemplates[0]?.id || '')
        setEventTypeId((prev) => prev || allTemplates[0]?.eventTypeId || '')
      }
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(Array.isArray(eventsData?.events) ? eventsData.events : [])
      }
    } catch (error) {
      console.error('Failed to load event portal data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) || null,
    [templateId, templates]
  )

  useEffect(() => {
    if (selectedTemplate && !eventTypeId) {
      setEventTypeId(selectedTemplate.eventTypeId)
    }
  }, [eventTypeId, selectedTemplate])

  const resolveUrl = (url: string) => (url.startsWith('http') ? url : `${origin}${url}`)

  const copyLink = async (url: string) => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(resolveUrl(url))
      setCopied(url)
      window.setTimeout(() => setCopied(''), 1200)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const createEventType = async () => {
    const trimmed = newEventTypeName.trim()
    if (!trimmed) return
    setEventTypeSaveState('saving')
    setEventTypeMessage('')
    try {
      const response = await fetch('/api/event-portal/event-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create event type')
      }
      const data = await response.json()
      const created = data?.eventType as EventTypeItem | undefined
      setNewEventTypeName('')
      setEventTypeSaveState('idle')
      setEventTypeMessage('Event type created.')
      await fetchData()
      if (created?.id) {
        setEventTypeId(created.id)
      }
      window.setTimeout(() => setEventTypeMessage(''), 1500)
    } catch (error) {
      setEventTypeSaveState('error')
      setEventTypeMessage(error instanceof Error ? error.message : 'Failed to create event type')
    }
  }

  const handleCreateEvent = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('saving')
    setMessage('')
    setCreatedLink('')
    try {
      const response = await fetch('/api/event-portal/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          eventName,
          eventTypeId,
          eventDate,
          eventStartTime: eventStartTime || null,
          eventEndTime: eventEndTime || null,
          venueName: venueName || null,
          organizerName: organizerName || null,
          organizerEmail: organizerEmail || null,
          organizerPhone: organizerPhone || null,
          clientName,
          clientEmail: clientEmail || null,
          accessPin: accessPin || null,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create event')
      }

      const data = await response.json()
      const clientUrl = data?.event?.clientUrl || ''
      setStatus('success')
      setCreatedLink(clientUrl)
      setMessage('Event created and Spotify playlist connected.')
      setEventName('')
      setEventDate('')
      setEventStartTime('')
      setEventEndTime('')
      setVenueName('')
      setOrganizerName('')
      setOrganizerEmail('')
      setOrganizerPhone('')
      setClientName('')
      setClientEmail('')
      setAccessPin('')
      setNotes('')
      await fetchData()
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Failed to create event')
    }
  }

  const deleteEvent = async (id: string) => {
    const ok = window.confirm(
      'Delete this event portal entry? This also removes/unfollows its Spotify playlist.'
    )
    if (!ok) return
    try {
      const response = await fetch(`/api/event-portal/events/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete event')
      }
      await fetchData()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to delete event')
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Manage events"
        description="Create personalized client links and review submissions in one dashboard."
        actions={
          <>
            <AdminButton variant="secondary" href="/event-portal/manage/templates">
              Manage templates
            </AdminButton>
            <AdminButton variant="secondary" href="/event-portal">
              Portal overview
            </AdminButton>
            {copied ? <span className="text-sm text-[var(--admin-muted)]">Link copied.</span> : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,_1fr)_440px]">
        <AdminCard>
          <AdminCardHeader>
            <h2 className="text-base font-bold text-[var(--admin-fg)]">Create new event portal</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Creating an event will also create a Spotify playlist for song requests.
            </p>
          </AdminCardHeader>
          <AdminCardBody>
            <form onSubmit={handleCreateEvent} className="space-y-5">
              <div className="space-y-2">
                <AdminLabel>Template</AdminLabel>
                <AdminSelectMenu
                  value={templateId || null}
                  onChange={(nextId) => {
                    setTemplateId(nextId)
                    const template = templates.find((item) => item.id === nextId)
                    if (template) setEventTypeId(template.eventTypeId)
                  }}
                  options={templates.map((template) => ({
                    value: template.id,
                    label: `${template.name} (${template.eventType})`,
                  }))}
                  placeholder="Select a template"
                  disabled={templates.length === 0}
                />
                {templates.length === 0 ? (
                  <AdminHelp>No templates yet. Create one in Templates first.</AdminHelp>
                ) : null}
              </div>

              <div className="space-y-2">
                <AdminLabel>Event name</AdminLabel>
                <AdminInput
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Sophia + Daniel Wedding"
                  required
                />
              </div>

              <div className="space-y-2">
                <AdminLabel>Event type</AdminLabel>
                <AdminSelectMenu
                  value={eventTypeId || null}
                  onChange={(nextId) => setEventTypeId(nextId)}
                  options={eventTypes.map((eventType) => ({
                    value: eventType.id,
                    label: eventType.name,
                  }))}
                  placeholder="Select an event type"
                  disabled={eventTypes.length === 0}
                />

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,_1fr)_auto]">
                  <AdminInput
                    type="text"
                    value={newEventTypeName}
                    onChange={(e) => setNewEventTypeName(e.target.value)}
                    placeholder="Create new event type"
                  />
                  <AdminButton
                    type="button"
                    onClick={createEventType}
                    disabled={eventTypeSaveState === 'saving' || newEventTypeName.trim().length === 0}
                  >
                    {eventTypeSaveState === 'saving' ? 'Adding...' : 'Add'}
                  </AdminButton>
                </div>

                {eventTypeMessage ? (
                  <p
                    className={`text-xs ${
                      eventTypeSaveState === 'error'
                        ? 'text-[var(--admin-danger)]'
                        : 'text-[var(--admin-muted)]'
                    }`}
                  >
                    {eventTypeMessage}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <AdminLabel>Event date</AdminLabel>
                  <AdminInput
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <AdminLabel>Start time</AdminLabel>
                  <AdminInput
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <AdminLabel>End time</AdminLabel>
                  <AdminInput
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <AdminLabel>Venue name (provided by you)</AdminLabel>
                <AdminInput
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="Venue / location"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <AdminLabel>Organizer / coordinator name</AdminLabel>
                  <AdminInput
                    type="text"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="Coordinator, planner, or main contact"
                  />
                </div>
                <div className="space-y-2">
                  <AdminLabel>Organizer email</AdminLabel>
                  <AdminInput
                    type="email"
                    value={organizerEmail}
                    onChange={(e) => setOrganizerEmail(e.target.value)}
                    placeholder="contact@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <AdminLabel>Organizer phone</AdminLabel>
                <AdminInput
                  type="tel"
                  value={organizerPhone}
                  onChange={(e) => setOrganizerPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <AdminLabel>Client name</AdminLabel>
                  <AdminInput
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Jane Client"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <AdminLabel>Client email</AdminLabel>
                  <AdminInput
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="jane@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <AdminLabel>Portal access code (4–6 digits)</AdminLabel>
                <AdminInput
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={accessPin}
                  onChange={(e) => setAccessPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="e.g., 102526"
                />
                <AdminHelp>
                  Clients must enter this code before viewing/submitting the form. Share it via text or email.
                </AdminHelp>
              </div>

              <div className="space-y-2">
                <AdminLabel>Internal notes (optional)</AdminLabel>
                <AdminTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>

              {message ? (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    status === 'error'
                      ? 'border-[color-mix(in_oklab,var(--admin-danger)_35%,white)] bg-red-50 text-[var(--admin-danger)]'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {message}
                  {createdLink ? (
                    <>
                      {' '}
                      <button
                        type="button"
                        onClick={() => copyLink(createdLink)}
                        className="font-semibold underline underline-offset-2"
                      >
                        {resolveUrl(createdLink)}
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}

              <AdminButton
                type="submit"
                disabled={status === 'saving' || templates.length === 0 || eventTypes.length === 0}
              >
                {status === 'saving' ? 'Creating...' : 'Create event portal'}
              </AdminButton>
            </form>
          </AdminCardBody>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[var(--admin-fg)]">All events</h3>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                {events.length} total
              </p>
            </div>
            {loading ? <span className="text-xs text-[var(--admin-muted)]">Loading...</span> : null}
          </AdminCardHeader>
          <AdminCardBody>
            <div className="space-y-4">
              {!loading && events.length === 0 ? (
                <p className="text-sm text-[var(--admin-muted)]">No events yet.</p>
              ) : null}

              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--admin-fg)]">
                        {event.eventName}
                      </p>
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">
                        {event.eventType} · {event.eventDate}
                        {event.eventStartTime ? ` · ${event.eventStartTime}` : ''}
                        {event.eventEndTime ? ` - ${event.eventEndTime}` : ''}
                      </p>
                      {event.venueName ? (
                        <p className="mt-2 text-xs text-[var(--admin-muted)]">
                          Venue: {event.venueName}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-[var(--admin-muted)]">
                        Client: {event.clientName}
                        {event.clientEmail ? ` · ${event.clientEmail}` : ''}
                      </p>
                    </div>

                    <span className="rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-3 py-1 text-xs font-semibold text-[var(--admin-muted)]">
                      {EVENT_STATUS_OPTIONS.includes(event.status) ? event.status : 'sent'} ·{' '}
                      {event.hasSubmission ? 'Submitted' : 'Waiting'}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminButton variant="secondary" size="sm" type="button" onClick={() => copyLink(event.clientUrl)}>
                      Copy client link
                    </AdminButton>
                    <AdminButton variant="secondary" size="sm" href={event.clientUrl}>
                      Open client form
                    </AdminButton>
                    <AdminButton variant="secondary" size="sm" href={`/event-portal/manage/events/${event.id}`}>
                      View digest
                    </AdminButton>
                    <AdminButton variant="danger" size="sm" type="button" onClick={() => deleteEvent(event.id)}>
                      Delete
                    </AdminButton>
                  </div>
                </div>
              ))}
            </div>
          </AdminCardBody>
        </AdminCard>
      </div>
    </div>
  )
}

