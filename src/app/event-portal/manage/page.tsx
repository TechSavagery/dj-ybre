'use client'

import { useEffect, useMemo, useState } from 'react'
import { Border } from '@/components/Border'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'

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
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
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
          clientName,
          clientEmail: clientEmail || null,
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
      setClientName('')
      setClientEmail('')
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
    <>
      <PageIntro eyebrow="Event Portal" title="Manage events">
        <p>Create personalized client links and review submissions in one dashboard.</p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="mb-10 flex flex-wrap items-center gap-3">
          <Button href="/event-portal/manage/templates">Manage templates</Button>
          <Button href="/event-portal">Portal overview</Button>
          {copied ? <span className="text-sm text-neutral-600">Link copied.</span> : null}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,_1fr)_440px]">
          <FadeIn>
            <Border className="p-8">
              <h2 className="text-xl font-semibold text-neutral-950">Create new event portal</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Creating an event will also create a Spotify playlist for song requests.
              </p>

              <form onSubmit={handleCreateEvent} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-neutral-950">
                    Template
                  </label>
                  <select
                    value={templateId}
                    onChange={(e) => {
                      const nextId = e.target.value
                      setTemplateId(nextId)
                      const template = templates.find((item) => item.id === nextId)
                      if (template) setEventTypeId(template.eventTypeId)
                    }}
                    required
                    className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.eventType})
                      </option>
                    ))}
                  </select>
                  {templates.length === 0 ? (
                    <p className="text-xs text-neutral-500">
                      No templates yet. Create one in Templates first.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-neutral-950">Event name</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Sophia + Daniel Wedding"
                    required
                    className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-neutral-950">Event type</label>
                  <select
                    value={eventTypeId}
                    onChange={(e) => setEventTypeId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                  >
                    {eventTypes.map((eventType) => (
                      <option key={eventType.id} value={eventType.id}>
                        {eventType.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newEventTypeName}
                      onChange={(e) => setNewEventTypeName(e.target.value)}
                      placeholder="Create new event type"
                      className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-2 text-sm text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                    />
                    <Button
                      type="button"
                      onClick={createEventType}
                      disabled={eventTypeSaveState === 'saving' || newEventTypeName.trim().length === 0}
                    >
                      {eventTypeSaveState === 'saving' ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                  {eventTypeMessage ? (
                    <p
                      className={`text-xs ${
                        eventTypeSaveState === 'error' ? 'text-red-700' : 'text-neutral-500'
                      }`}
                    >
                      {eventTypeMessage}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-neutral-950">
                      Event date
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-neutral-950">
                      Start time
                    </label>
                    <input
                      type="time"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-neutral-950">End time</label>
                    <input
                      type="time"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-neutral-950">
                      Client name
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Jane Client"
                      required
                      className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-neutral-950">
                      Client email
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="jane@email.com"
                      className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-neutral-950">
                    Internal notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                  />
                </div>

                {message ? (
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      status === 'error'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-green-200 bg-green-50 text-green-700'
                    }`}
                  >
                    {message}
                    {createdLink ? (
                      <>
                        {' '}
                        <button
                          type="button"
                          onClick={() => copyLink(createdLink)}
                          className="font-semibold underline"
                        >
                          {resolveUrl(createdLink)}
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={status === 'saving' || templates.length === 0 || eventTypes.length === 0}
                >
                  {status === 'saving' ? 'Creating...' : 'Create event portal'}
                </Button>
              </form>
            </Border>
          </FadeIn>

          <FadeIn>
            <Border className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-950">All events</h3>
                {loading ? <span className="text-xs text-neutral-500">Loading...</span> : null}
              </div>

              <div className="mt-4 space-y-4">
                {!loading && events.length === 0 ? (
                  <p className="text-sm text-neutral-600">No events yet.</p>
                ) : null}

                {events.map((event) => (
                  <div key={event.id} className="rounded-xl border border-neutral-200 p-4">
                    <p className="text-sm font-semibold text-neutral-950">{event.eventName}</p>
                    <p className="text-xs text-neutral-500">
                      {event.eventType} · {event.eventDate}
                      {event.eventStartTime ? ` · ${event.eventStartTime}` : ''}
                      {event.eventEndTime ? ` - ${event.eventEndTime}` : ''}
                    </p>
                    <p className="mt-2 text-xs text-neutral-500">
                      Client: {event.clientName}
                      {event.clientEmail ? ` · ${event.clientEmail}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Status: {EVENT_STATUS_OPTIONS.includes(event.status) ? event.status : 'sent'} ·{' '}
                      {event.hasSubmission ? 'Submitted' : 'Waiting on client'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => copyLink(event.clientUrl)}
                        className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-600 hover:text-neutral-950"
                      >
                        Copy client link
                      </button>
                      <a
                        href={event.clientUrl}
                        className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-600 hover:text-neutral-950"
                      >
                        Open client form
                      </a>
                      <a
                        href={`/event-portal/manage/events/${event.id}`}
                        className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-600 hover:text-neutral-950"
                      >
                        View digest
                      </a>
                      <button
                        type="button"
                        onClick={() => deleteEvent(event.id)}
                        className="rounded-full border border-red-200 px-3 py-1 text-red-700 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Border>
          </FadeIn>
        </div>
      </Container>
    </>
  )
}

