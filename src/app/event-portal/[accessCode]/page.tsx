'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Border } from '@/components/Border'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { SpotifyTrackItem, SpotifyTrackPicker } from '@/components/event-portal/SpotifyTrackPicker'

interface PortalEvent {
  id: string
  eventName: string
  eventType: string
  eventDate: string
  eventStartTime?: string | null
  eventEndTime?: string | null
  clientName: string
  status: string
}

interface TemplateField {
  id: string
  key: string
  label: string
  helperText?: string | null
  placeholder?: string | null
  type: string
  required: boolean
  options: string[]
  fieldOrder: number
}

interface TemplatePayload {
  id: string
  name: string
  eventType: string
  description?: string | null
  fields: TemplateField[]
}

interface SubmissionPayload {
  id: string
  submittedAt: string
  updatedAt: string
  answersByKey: Record<string, unknown>
}

function getEmptyFieldValue(type: string) {
  if (type === 'multi_select') return [] as string[]
  if (type === 'checkbox') return false
  if (type === 'spotify_tracks') return [] as SpotifyTrackItem[]
  return ''
}

function normalizeIncomingFieldValue(type: string, value: unknown) {
  if (value === null || value === undefined) {
    return getEmptyFieldValue(type)
  }

  if (type === 'multi_select') {
    return Array.isArray(value) ? value.map(String) : []
  }

  if (type === 'checkbox') {
    return Boolean(value)
  }

  if (type === 'spotify_tracks') {
    return Array.isArray(value) ? value : []
  }

  if (type === 'number') {
    if (typeof value === 'number') return String(value)
    if (typeof value === 'string') return value
    return ''
  }

  return typeof value === 'string' ? value : ''
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

export default function EventPortalClientPage() {
  const params = useParams<{ accessCode: string }>()
  const accessCode = params?.accessCode

  const [eventData, setEventData] = useState<PortalEvent | null>(null)
  const [template, setTemplate] = useState<TemplatePayload | null>(null)
  const [submission, setSubmission] = useState<SubmissionPayload | null>(null)
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const initializeFormValues = useCallback(
    (fields: TemplateField[], answersByKey?: Record<string, unknown> | null) => {
      const nextValues: Record<string, unknown> = {}
      for (const field of fields) {
        nextValues[field.key] = normalizeIncomingFieldValue(
          field.type,
          answersByKey?.[field.key]
        )
      }
      setFormValues(nextValues)
    },
    []
  )

  const loadForm = useCallback(async () => {
    if (!accessCode) return
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`/api/event-portal/client/${accessCode}`)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Unable to load this event form')
      }
      const data = await response.json()
      const loadedTemplate = data.template as TemplatePayload
      const loadedSubmission = (data.submission || null) as SubmissionPayload | null

      setEventData(data.event || null)
      setTemplate(loadedTemplate)
      setSubmission(loadedSubmission)
      initializeFormValues(loadedTemplate?.fields || [], loadedSubmission?.answersByKey || null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load this event form')
    } finally {
      setLoading(false)
    }
  }, [accessCode, initializeFormValues])

  useEffect(() => {
    loadForm()
  }, [loadForm])

  const sortedFields = useMemo(
    () => [...(template?.fields || [])].sort((a, b) => a.fieldOrder - b.fieldOrder),
    [template?.fields]
  )

  const updateField = (fieldKey: string, value: unknown) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldKey]: value,
    }))
  }

  const toggleMultiSelectOption = (fieldKey: string, option: string) => {
    const current = Array.isArray(formValues[fieldKey]) ? (formValues[fieldKey] as string[]) : []
    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option]
    updateField(fieldKey, next)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!accessCode) return
    setSubmitState('saving')
    setMessage('')
    try {
      const response = await fetch(`/api/event-portal/client/${accessCode}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: formValues,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const details = Array.isArray(data?.details) ? data.details.join('\n') : null
        throw new Error(details || data.error || 'Failed to submit form')
      }

      const data = await response.json()
      setSubmitState('success')
      if (data?.submission?.answersByKey && template) {
        initializeFormValues(template.fields, data.submission.answersByKey)
      }
      if (data?.submission) {
        setSubmission(data.submission as SubmissionPayload)
      }
      setMessage(data?.warning || 'Your event form was submitted successfully.')
    } catch (error) {
      setSubmitState('error')
      setMessage(error instanceof Error ? error.message : 'Failed to submit form')
    }
  }

  if (loading) {
    return (
      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <p className="text-center text-neutral-600">Loading event form...</p>
      </Container>
    )
  }

  if (!eventData || !template) {
    return (
      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <p className="text-center text-neutral-600">{message || 'Event form not found.'}</p>
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

      <Container className="mt-12 sm:mt-16 lg:mt-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,_1fr)_320px]">
          <FadeIn>
            <Border className="p-8">
              <h2 className="text-xl font-semibold text-neutral-950">{template.name}</h2>
              <p className="mt-2 text-sm text-neutral-600">
                {template.description ||
                  'Please complete this form so we can plan your event in detail.'}
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {sortedFields.map((field) => {
                  const currentValue = formValues[field.key]
                  const inputType =
                    field.type === 'email'
                      ? 'email'
                      : field.type === 'number'
                      ? 'number'
                      : field.type === 'date'
                      ? 'date'
                      : field.type === 'time'
                      ? 'time'
                      : field.type === 'phone'
                      ? 'tel'
                      : 'text'

                  if (field.type === 'spotify_tracks') {
                    return (
                      <SpotifyTrackPicker
                        key={field.id}
                        label={field.label}
                        helperText={field.helperText}
                        required={field.required}
                        eventType={eventData.eventType}
                        value={
                          Array.isArray(currentValue)
                            ? (currentValue as SpotifyTrackItem[])
                            : []
                        }
                        onChange={(tracks) => updateField(field.key, tracks)}
                      />
                    )
                  }

                  if (field.type === 'long_text') {
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="block text-sm font-semibold text-neutral-950">
                          {field.label}
                          {field.required ? <span className="ml-1 text-red-600">*</span> : null}
                        </label>
                        {field.helperText ? (
                          <p className="text-xs text-neutral-500">{field.helperText}</p>
                        ) : null}
                        <textarea
                          value={typeof currentValue === 'string' ? currentValue : ''}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          placeholder={field.placeholder || ''}
                          rows={4}
                          className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                        />
                      </div>
                    )
                  }

                  if (field.type === 'select') {
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="block text-sm font-semibold text-neutral-950">
                          {field.label}
                          {field.required ? <span className="ml-1 text-red-600">*</span> : null}
                        </label>
                        {field.helperText ? (
                          <p className="text-xs text-neutral-500">{field.helperText}</p>
                        ) : null}
                        <select
                          value={typeof currentValue === 'string' ? currentValue : ''}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                        >
                          <option value="">Select an option</option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  }

                  if (field.type === 'multi_select') {
                    const selected = Array.isArray(currentValue)
                      ? (currentValue as string[])
                      : []
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="block text-sm font-semibold text-neutral-950">
                          {field.label}
                          {field.required ? <span className="ml-1 text-red-600">*</span> : null}
                        </label>
                        {field.helperText ? (
                          <p className="text-xs text-neutral-500">{field.helperText}</p>
                        ) : null}
                        <div className="space-y-2 rounded-xl border border-neutral-200 p-4">
                          {field.options.map((option) => (
                            <label
                              key={option}
                              className="flex items-center gap-3 text-sm text-neutral-700"
                            >
                              <input
                                type="checkbox"
                                checked={selected.includes(option)}
                                onChange={() => toggleMultiSelectOption(field.key, option)}
                                className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  }

                  if (field.type === 'checkbox') {
                    return (
                      <label
                        key={field.id}
                        className="flex items-start gap-3 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(currentValue)}
                          onChange={(e) => updateField(field.key, e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
                        />
                        <span>
                          <span className="font-semibold text-neutral-950">{field.label}</span>
                          {field.required ? <span className="ml-1 text-red-600">*</span> : null}
                          {field.helperText ? (
                            <span className="mt-1 block text-xs text-neutral-500">
                              {field.helperText}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    )
                  }

                  return (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-sm font-semibold text-neutral-950">
                        {field.label}
                        {field.required ? <span className="ml-1 text-red-600">*</span> : null}
                      </label>
                      {field.helperText ? (
                        <p className="text-xs text-neutral-500">{field.helperText}</p>
                      ) : null}
                      <input
                        type={inputType}
                        value={typeof currentValue === 'string' ? currentValue : ''}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                      />
                    </div>
                  )
                })}

                {message ? (
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      submitState === 'success'
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : submitState === 'error'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                    }`}
                  >
                    {message}
                  </div>
                ) : null}

                <Button type="submit" disabled={submitState === 'saving'}>
                  {submitState === 'saving'
                    ? 'Submitting...'
                    : submission
                    ? 'Update event form'
                    : 'Submit event form'}
                </Button>
              </form>
            </Border>
          </FadeIn>

          <FadeIn>
            <div className="space-y-6">
              <Border className="p-6">
                <h3 className="text-lg font-semibold text-neutral-950">Event contact</h3>
                <p className="mt-2 text-sm text-neutral-600">{eventData.clientName}</p>
                <p className="mt-4 text-xs text-neutral-500">
                  Submitted forms are reviewed before your event so we can plan every detail.
                </p>
              </Border>
              {submission ? (
                <Border className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-950">Last saved</h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    {new Date(submission.updatedAt).toLocaleString()}
                  </p>
                </Border>
              ) : null}
            </div>
          </FadeIn>
        </div>
      </Container>
    </>
  )
}

