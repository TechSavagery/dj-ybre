'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Container } from '@/components/Container'
import { PageIntro } from '@/components/PageIntro'
import { FadeIn } from '@/components/FadeIn'
import { Border } from '@/components/Border'
import { Button } from '@/components/Button'

interface RequestList {
  id: string
  name: string
  eventType: string
  eventDate: string
  eventTime?: string | null
  publicUrl: string
  publicDescription?: string | null
}

interface SongRequestItem {
  id: string
  spotifyId: string
  name: string
  artist: string
  requesterFirstName: string
  requesterLastName: string
  voteCount: number
  createdAt: string
}

export default function RequestsManageListPage() {
  const params = useParams<{ id: string }>()
  const listId = params?.id

  const [list, setList] = useState<RequestList | null>(null)
  const [requests, setRequests] = useState<SongRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [publicDescriptionDraft, setPublicDescriptionDraft] = useState('')
  const [publicDescriptionStatus, setPublicDescriptionStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle')

  const load = useCallback(async () => {
    if (!listId) return
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`/api/requests/${listId}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Unable to load request list')
      }
      const data = await res.json()
      setList(data.list || null)
      setRequests(Array.isArray(data.requests) ? data.requests : [])
      setPublicDescriptionDraft(data?.list?.publicDescription || '')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to load request list')
    } finally {
      setLoading(false)
    }
  }, [listId])

  useEffect(() => {
    load()
  }, [load])

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }, [requests])

  const deleteSong = async (songId: string) => {
    const ok = window.confirm('Delete this song request? This will also remove it from Spotify.')
    if (!ok) return
    try {
      const res = await fetch(`/api/requests/${listId}/songs/${songId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete song')
      }
      setRequests((prev) => prev.filter((r) => r.id !== songId))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete song')
    }
  }

  const deleteList = async () => {
    const ok = window.confirm(
      'Delete this entire request list? This will delete the list in the database and remove/unfollow the Spotify playlist.'
    )
    if (!ok) return
    try {
      const res = await fetch(`/api/requests/${listId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete request list')
      }
      window.location.href = '/requests/manage'
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete request list')
    }
  }

  const savePublicDescription = async () => {
    if (!listId) return
    setPublicDescriptionStatus('saving')
    try {
      const res = await fetch(`/api/requests/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicDescription: publicDescriptionDraft || null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update public description')
      }
      const data = await res.json()
      setList(data.list || null)
      setPublicDescriptionDraft(data?.list?.publicDescription || '')
      setPublicDescriptionStatus('success')
      window.setTimeout(() => setPublicDescriptionStatus('idle'), 1200)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to update public description')
      setPublicDescriptionStatus('error')
      window.setTimeout(() => setPublicDescriptionStatus('idle'), 1200)
    }
  }

  if (loading) {
    return (
      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <p className="text-center text-neutral-600">Loading...</p>
      </Container>
    )
  }

  if (!list) {
    return (
      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <p className="text-center text-neutral-600">{message || 'Not found.'}</p>
        <div className="mt-8 flex justify-center">
          <Button href="/requests/manage">Back to manage</Button>
        </div>
      </Container>
    )
  }

  return (
    <>
      <PageIntro eyebrow="Manage" title={list.name}>
        <p>
          {list.eventType} · {list.eventDate}
          {list.eventTime ? ` · ${list.eventTime}` : ''}
        </p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="mb-10 flex flex-wrap gap-3">
          <Button href="/requests/manage">Back to manage</Button>
          <Button href={list.publicUrl}>Open public page</Button>
          <button
            type="button"
            onClick={deleteList}
            className="inline-flex rounded-full border border-red-200 bg-white px-4 py-1.5 text-sm font-semibold text-red-700 transition hover:text-red-900"
          >
            <span className="relative top-px">Delete list</span>
          </button>
        </div>

        <FadeIn>
          <Border className="mb-10 p-8">
            <h2 className="text-xl font-semibold text-neutral-950">Public page message</h2>
            <p className="mt-2 text-sm text-neutral-600">
              This replaces the helper text shown above the public request form.
            </p>
            <div className="mt-5 space-y-3">
              <textarea
                value={publicDescriptionDraft}
                onChange={(e) => setPublicDescriptionDraft(e.target.value)}
                placeholder="Search Spotify, pick the track, then drop your name to submit."
                rows={4}
                className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={savePublicDescription}
                  disabled={publicDescriptionStatus === 'saving'}
                >
                  {publicDescriptionStatus === 'saving' ? 'Saving...' : 'Save message'}
                </Button>
                {publicDescriptionStatus === 'success' ? (
                  <span className="text-sm text-green-700">Saved.</span>
                ) : null}
              </div>
            </div>
          </Border>
        </FadeIn>

        <FadeIn>
          <Border className="p-8">
            <h2 className="text-xl font-semibold text-neutral-950">Requested songs</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Delete a song request here and it will also be removed from the Spotify playlist.
            </p>

            {message ? <p className="mt-4 text-sm text-neutral-600">{message}</p> : null}

            <div className="mt-6 space-y-3">
              {sortedRequests.length === 0 ? (
                <p className="text-sm text-neutral-500">No requested songs yet.</p>
              ) : (
                sortedRequests.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">{r.name}</p>
                      <p className="text-xs text-neutral-600">{r.artist}</p>
                      <p className="text-xs text-neutral-400">
                        Requested by {r.requesterFirstName} {r.requesterLastName?.charAt(0).toUpperCase()}.
                        {' · '}
                        {r.voteCount} boost{r.voteCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => deleteSong(r.id)}
                        className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:text-red-900"
                      >
                        Delete song
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Border>
        </FadeIn>
      </Container>
    </>
  )
}

