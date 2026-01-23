'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { Container } from '@/components/Container'
import { PageIntro } from '@/components/PageIntro'
import { FadeIn } from '@/components/FadeIn'
import { Button } from '@/components/Button'
import { Border } from '@/components/Border'

interface RequestList {
  id: string
  name: string
  eventType: string
  eventDate: string
  eventTime?: string | null
  eventEndTime?: string | null
  createdAt: string
  requestsCount: number
  publicUrl: string
}

const EVENT_TYPE_SUGGESTIONS = [
  'School Dance',
  'Wedding',
  'Bar/Club',
  'Corporate',
  'Birthday',
  'Festival',
  'Other',
]

function TextInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  list,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  list?: string
}) {
  const id = useId()
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-neutral-950">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        list={list}
        className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
      />
    </div>
  )
}

export default function RequestsManagePage() {
  const [lists, setLists] = useState<RequestList[]>([])
  const [loading, setLoading] = useState(true)
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  const [name, setName] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [publicDescription, setPublicDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [createdUrl, setCreatedUrl] = useState('')

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/requests?includePast=1')
      if (!res.ok) return
      const data = await res.json()
      setLists(Array.isArray(data.lists) ? data.lists : [])
    } catch (err) {
      console.error('Failed to load request lists:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLists()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const allLists = useMemo(() => lists, [lists])

  const copyLink = async (url: string) => {
    if (!url) return
    const resolvedUrl = url.startsWith('http') ? url : `${origin}${url}`
    try {
      await navigator.clipboard.writeText(resolvedUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('saving')
    setError('')
    setCreatedUrl('')

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          eventType,
          eventDate,
          eventTime: eventTime || null,
          eventEndTime: eventEndTime || null,
          publicDescription: publicDescription || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create request list')
      }

      const data = await res.json()
      const publicUrl = data?.list?.publicUrl || ''
      setStatus('success')
      setCreatedUrl(publicUrl)
      setName('')
      setEventType('')
      setEventDate('')
      setEventTime('')
      setEventEndTime('')
      setPublicDescription('')
      fetchLists()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to create request list')
    }
  }

  const deleteList = async (id: string) => {
    const ok = window.confirm(
      'Delete this request list? This will delete the list in the database and remove/unfollow the Spotify playlist.'
    )
    if (!ok) return

    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete request list')
      }
      await fetchLists()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete request list')
    }
  }

  return (
    <>
      <PageIntro eyebrow="Song Requests" title="Manage request lists">
        <p>Create lists, delete lists, and manage songs.</p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="mb-10">
          <Button href="/requests" className="inline-flex">
            View upcoming lists
          </Button>
          {copied ? <span className="ml-4 text-sm text-neutral-600">Link copied.</span> : null}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,_1fr)_420px]">
          <FadeIn>
            <Border className="p-8">
              <h2 className="font-display text-xl font-semibold text-neutral-950">
                Create a new request list
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                This will also create a Spotify playlist and keep it in sync.
              </p>

              <form onSubmit={handleCreate} className="mt-6 space-y-6">
                <TextInput
                  label="Event name"
                  value={name}
                  onChange={setName}
                  placeholder="Winter Formal 2026"
                  required
                />
                <TextInput
                  label="Event type"
                  value={eventType}
                  onChange={setEventType}
                  placeholder="School Dance"
                  required
                  list="event-types"
                />
                <datalist id="event-types">
                  {EVENT_TYPE_SUGGESTIONS.map((type) => (
                    <option value={type} key={type} />
                  ))}
                </datalist>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <TextInput
                    label="Event date"
                    type="date"
                    value={eventDate}
                    onChange={setEventDate}
                    required
                  />
                  <TextInput
                    label="Start time"
                    type="time"
                    value={eventTime}
                    onChange={setEventTime}
                    placeholder="Optional"
                  />
                  <TextInput
                    label="End time"
                    type="time"
                    value={eventEndTime}
                    onChange={setEventEndTime}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-neutral-950">
                    Public description (optional)
                  </label>
                  <textarea
                    value={publicDescription}
                    onChange={(e) => setPublicDescription(e.target.value)}
                    placeholder="Search Spotify, pick the track, then drop your name to submit."
                    rows={3}
                    className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                  />
                  <p className="text-xs text-neutral-500">
                    This replaces the helper text shown on the public request page.
                  </p>
                </div>

                {status === 'error' && error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                {status === 'success' && createdUrl ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    Created! Share{' '}
                    <button
                      type="button"
                      onClick={() => copyLink(createdUrl)}
                      className="font-semibold text-green-800 underline"
                    >
                      {origin ? `${origin}${createdUrl}` : createdUrl}
                    </button>
                  </div>
                ) : null}

                <Button type="submit" disabled={status === 'saving'}>
                  {status === 'saving' ? 'Creating...' : 'Create request list'}
                </Button>
              </form>
            </Border>
          </FadeIn>

          <FadeIn>
            <Border className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-950">All lists</h3>
                {loading ? <span className="text-xs text-neutral-500">Loading...</span> : null}
              </div>

              <div className="mt-4 space-y-4">
                {allLists.length === 0 && !loading ? (
                  <p className="text-sm text-neutral-600">No request lists yet.</p>
                ) : null}

                {allLists.map((list) => (
                  <div key={list.id} className="rounded-xl border border-neutral-200 p-4">
                    <p className="text-sm font-semibold text-neutral-950">{list.name}</p>
                    <p className="text-xs text-neutral-500">
                      {list.eventType} · {list.eventDate}
                      {list.eventTime ? ` · ${list.eventTime}` : ''}
                      {list.eventEndTime ? ` - ${list.eventEndTime}` : ''}
                    </p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {list.requestsCount} request{list.requestsCount === 1 ? '' : 's'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => copyLink(list.publicUrl)}
                        className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-600 hover:text-neutral-950"
                      >
                        Copy link
                      </button>
                      <a
                        href={list.publicUrl}
                        className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-600 hover:text-neutral-950"
                      >
                        Open
                      </a>
                      <a
                        href={`/requests/manage/${list.id}`}
                        className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-600 hover:text-neutral-950"
                      >
                        Manage songs
                      </a>
                      <button
                        type="button"
                        onClick={() => deleteList(list.id)}
                        className="rounded-full border border-red-200 px-3 py-1 text-red-700 hover:text-red-900"
                      >
                        Delete list
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

