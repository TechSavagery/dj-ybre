'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Border } from '@/components/Border'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { SpotifyPlayOverlayImage } from '@/components/SpotifyPlayOverlayImage'

interface EventSummary {
  id: string
  eventName: string
  eventType: string
  eventDate: string
  eventStartTime?: string | null
  eventEndTime?: string | null
  clientName: string
  clientEmail?: string | null
  notes?: string | null
  status: string
  clientUrl: string
}

interface TemplateField {
  id: string
  key: string
  label: string
  type: string
  required: boolean
  helperText?: string | null
  fieldOrder: number
}

interface TemplatePayload {
  id: string
  name: string
  fields: TemplateField[]
}

interface SubmissionPayload {
  id: string
  submittedAt: string
  updatedAt: string
  answersByKey: Record<string, unknown>
}

function formatDate(dateString?: string) {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) return dateString
  return new Date(year, month - 1, day).toLocaleDateString()
}

function formatTime(timeString?: string | null) {
  if (!timeString) return ''
  const [hour, minute] = timeString.split(':').map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return timeString
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function EventPortalManageEventDetailsPage() {
  const params = useParams<{ id: string }>()
  const eventId = params?.id

  const [eventData, setEventData] = useState<EventSummary | null>(null)
  const [template, setTemplate] = useState<TemplatePayload | null>(null)
  const [submission, setSubmission] = useState<SubmissionPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [origin, setOrigin] = useState('')
  const [statusDraft, setStatusDraft] = useState('sent')
  const [statusSaving, setStatusSaving] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const load = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`/api/event-portal/events/${eventId}`)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Unable to load event')
      }
      const data = await response.json()
      setEventData(data.event || null)
      setTemplate(data.template || null)
      setSubmission(data.submission || null)
      setStatusDraft((data?.event?.status as string) || 'sent')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load event')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    load()
  }, [load])

  const sortedFields = useMemo(
    () => [...(template?.fields || [])].sort((a, b) => a.fieldOrder - b.fieldOrder),
    [template?.fields]
  )

  const copyClientLink = async () => {
    if (!eventData?.clientUrl) return
    const url = eventData.clientUrl.startsWith('http')
      ? eventData.clientUrl
      : `${origin}${eventData.clientUrl}`
    try {
      await navigator.clipboard.writeText(url)
      setMessage('Client link copied.')
      window.setTimeout(() => setMessage(''), 1200)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const saveStatus = async () => {
    if (!eventId || !eventData) return
    setStatusSaving(true)
    try {
      const response = await fetch(`/api/event-portal/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusDraft }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update status')
      }
      const data = await response.json()
      setEventData((prev) => (prev ? { ...prev, status: data?.event?.status || statusDraft } : prev))
      setMessage('Status updated.')
      window.setTimeout(() => setMessage(''), 1200)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update status')
    } finally {
      setStatusSaving(false)
    }
  }

  const renderAnswerValue = (field: TemplateField, value: unknown) => {
    if (field.type === 'checkbox') {
      return (
        <p className="text-sm text-neutral-700">{value ? 'Yes' : 'No'}</p>
      )
    }

    if (field.type === 'multi_select') {
      const values = Array.isArray(value) ? value : []
      return (
        <p className="text-sm text-neutral-700">
          {values.length > 0 ? values.join(', ') : 'No selection provided.'}
        </p>
      )
    }

    if (field.type === 'spotify_tracks') {
      const tracks = Array.isArray(value) ? value : []
      if (tracks.length === 0) {
        return <p className="text-sm text-neutral-500">No songs submitted.</p>
      }
      return (
        <div className="space-y-2">
          {tracks.map((track: any) => (
            <div
              key={track.id || `${field.key}-${track.name}`}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2"
            >
              {track.albumImage ? (
                <SpotifyPlayOverlayImage
                  src={track.albumImage}
                  alt={track.album || track.name}
                  href={track.externalUrl || undefined}
                  spotifyUri={track.id ? `spotify:track:${track.id}` : undefined}
                  mode="popup"
                  size={40}
                  className="h-10 w-10 rounded"
                />
              ) : null}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-950">{track.name}</p>
                <p className="truncate text-xs text-neutral-600">{track.artist}</p>
              </div>
            </div>
          ))}
        </div>
      )
    }

    const text = value === null || value === undefined ? '' : String(value)
    return (
      <p className="whitespace-pre-line text-sm text-neutral-700">
        {text || 'No response provided.'}
      </p>
    )
  }

  if (loading) {
    return (
      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <p className="text-center text-neutral-600">Loading event digest...</p>
      </Container>
    )
  }

  if (!eventData || !template) {
    return (
      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <p className="text-center text-neutral-600">{message || 'Event not found.'}</p>
        <div className="mt-8 flex justify-center">
          <Button href="/event-portal/manage">Back to manage</Button>
        </div>
      </Container>
    )
  }

  return (
    <>
      <PageIntro eyebrow="Event Portal" title={eventData.eventName}>
        <p>
          {eventData.eventType} · {formatDate(eventData.eventDate)}
          {eventData.eventStartTime ? ` · ${formatTime(eventData.eventStartTime)}` : ''}
          {eventData.eventEndTime ? ` - ${formatTime(eventData.eventEndTime)}` : ''}
        </p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="mb-10 flex flex-wrap gap-3">
          <Button href="/event-portal/manage">Back to manage</Button>
          <Button href={eventData.clientUrl}>Open client form</Button>
          <Button onClick={copyClientLink}>Copy client link</Button>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,_1fr)_340px]">
          <FadeIn>
            <Border className="p-8">
              <h2 className="text-xl font-semibold text-neutral-950">Submission digest</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Template: {template.name}
                {submission ? (
                  <> · Submitted {new Date(submission.updatedAt).toLocaleString()}</>
                ) : (
                  <> · Waiting for client submission</>
                )}
              </p>

              <div className="mt-8 space-y-6">
                {sortedFields.map((field) => {
                  const value = submission?.answersByKey?.[field.key]
                  return (
                    <div key={field.id} className="rounded-xl border border-neutral-200 p-4">
                      <p className="text-sm font-semibold text-neutral-950">{field.label}</p>
                      {field.helperText ? (
                        <p className="mt-1 text-xs text-neutral-500">{field.helperText}</p>
                      ) : null}
                      <div className="mt-3">{renderAnswerValue(field, value)}</div>
                    </div>
                  )
                })}
              </div>
            </Border>
          </FadeIn>

          <FadeIn>
            <div className="space-y-6">
              <Border className="p-6">
                <h3 className="text-lg font-semibold text-neutral-950">Client</h3>
                <p className="mt-2 text-sm text-neutral-700">{eventData.clientName}</p>
                {eventData.clientEmail ? (
                  <p className="text-sm text-neutral-600">{eventData.clientEmail}</p>
                ) : null}
                {eventData.notes ? (
                  <p className="mt-3 whitespace-pre-line text-sm text-neutral-600">
                    {eventData.notes}
                  </p>
                ) : null}
              </Border>

              <Border className="p-6">
                <h3 className="text-lg font-semibold text-neutral-950">Status</h3>
                <div className="mt-3 space-y-3">
                  <select
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-sm text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                  >
                    <option value="sent">Sent to client</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Reviewed/approved</option>
                    <option value="complete">Complete</option>
                  </select>
                  <Button onClick={saveStatus} disabled={statusSaving}>
                    {statusSaving ? 'Saving...' : 'Save status'}
                  </Button>
                  {message ? <p className="text-xs text-neutral-500">{message}</p> : null}
                </div>
              </Border>
            </div>
          </FadeIn>
        </div>
      </Container>
    </>
  )
}

