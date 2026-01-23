'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Container } from '@/components/Container'
import { PageIntro } from '@/components/PageIntro'
import { FadeIn } from '@/components/FadeIn'
import { Border } from '@/components/Border'
import { Button } from '@/components/Button'
import { SpotifyPlayOverlayImage } from '@/components/SpotifyPlayOverlayImage'

interface RequestList {
  id: string
  name: string
  eventType: string
  eventDate: string
  eventTime?: string | null
  publicUrl: string
  publicDescription?: string | null
}

interface SessionInfo {
  boostsUsed: number
  boostsLimit: number
  boostsRemaining: number
  requestsUsed: number
  requestsLimit: number
  requestsRemaining: number
}

interface TrackResult {
  id: string
  name: string
  artist: string
  album?: string
  albumImage?: string
  previewUrl?: string
  externalUrl?: string
  duration?: number
}

interface SongRequestItem {
  id: string
  spotifyId: string
  name: string
  artist: string
  album?: string
  albumImage?: string
  externalUrl?: string
  previewUrl?: string
  requesterFirstName: string
  requesterLastName: string
  voteCount: number
  createdAt: string
  hasVoted?: boolean
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

function formatRequesterName(firstName: string, lastName: string) {
  const lastInitial = lastName ? `${lastName.charAt(0).toUpperCase()}.` : ''
  return `${firstName} ${lastInitial}`.trim()
}

function isSchoolDanceEventType(eventType: string) {
  const normalized = String(eventType || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
  return normalized === 'schooldance'
}

function sortRequests(items: SongRequestItem[]) {
  return [...items].sort((a, b) => {
    if (b.voteCount !== a.voteCount) {
      return b.voteCount - a.voteCount
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

export default function RequestListPage() {
  const params = useParams<{ id: string }>()
  const listId = params?.id
  const [list, setList] = useState<RequestList | null>(null)
  const [requests, setRequests] = useState<SongRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [origin, setOrigin] = useState('')
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TrackResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<TrackResult | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nameLocked, setNameLocked] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [voteMessage, setVoteMessage] = useState('')
  const searchRef = useRef<HTMLDivElement | null>(null)

  const nameStorageKey = useMemo(() => (listId ? `song_request_name_${listId}` : ''), [listId])
  const nameLockedKey = useMemo(() => (listId ? `song_request_name_locked_${listId}` : ''), [listId])
  const hasName = Boolean(firstName.trim() && lastName.trim())

  const loadList = useCallback(async () => {
    if (!listId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/requests/${listId}`)
      if (!res.ok) {
        setMessage('Unable to load this request list.')
        return
      }
      const data = await res.json()
      setList(data.list || null)
      setRequests(sortRequests(Array.isArray(data.requests) ? data.requests : []))
      setSessionInfo(data.session || null)
    } catch (err) {
      console.error('Failed to load request list:', err)
      setMessage('Unable to load this request list.')
    } finally {
      setLoading(false)
    }
  }, [listId])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  useEffect(() => {
    if (!listId) return
    if (typeof window === 'undefined') return
    try {
      const stored = nameStorageKey ? window.localStorage.getItem(nameStorageKey) : null
      const storedLocked = nameLockedKey ? window.localStorage.getItem(nameLockedKey) : null
      if (stored) {
        const parsed = JSON.parse(stored) as { firstName?: string; lastName?: string }
        if (typeof parsed?.firstName === 'string') setFirstName(parsed.firstName)
        if (typeof parsed?.lastName === 'string') setLastName(parsed.lastName)
      }
      setNameLocked(Boolean(storedLocked))
    } catch {
      // ignore
    }
  }, [listId, nameLockedKey, nameStorageKey])

  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      try {
        const nonExplicit = list?.eventType ? isSchoolDanceEventType(list.eventType) : false
        const url = `/api/spotify/search?q=${encodeURIComponent(query)}&limit=10${
          nonExplicit ? '&nonExplicit=1' : ''
        }`
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        setResults(Array.isArray(data.tracks) ? data.tracks : [])
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [query, list?.eventType])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setResults([])
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const alreadyRequested = useMemo(() => {
    if (!selectedTrack) return false
    return requests.some((request) => request.spotifyId === selectedTrack.id)
  }, [requests, selectedTrack])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage('')
    setSubmitStatus('saving')

    if (sessionInfo && sessionInfo.requestsRemaining <= 0) {
      setMessage('Only 3 requests per person.')
      setSubmitStatus('error')
      return
    }

    if (!firstName.trim() || !lastName.trim()) {
      setMessage('Please enter your first and last name.')
      setSubmitStatus('error')
      return
    }

    if (!selectedTrack) {
      setMessage('Pick a song before submitting.')
      setSubmitStatus('error')
      return
    }

    if (alreadyRequested) {
      setMessage('That song is already on the request list.')
      setSubmitStatus('error')
      return
    }

    try {
      const res = await fetch(`/api/requests/${listId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotifyId: selectedTrack.id,
          requesterFirstName: firstName,
          requesterLastName: lastName,
        }),
      })

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}))
        setMessage(data.error || 'That song is already on the request list.')
        setSubmitStatus('error')
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit request')
      }

      const data = await res.json()
      const newRequest = data.request as SongRequestItem
      setRequests((prev) => sortRequests([...prev, { ...newRequest, hasVoted: false }]))
      setSelectedTrack(null)
      setQuery('')
      if (typeof window !== 'undefined' && nameStorageKey) {
        try {
          window.localStorage.setItem(
            nameStorageKey,
            JSON.stringify({ firstName, lastName })
          )
          if (nameLockedKey) window.localStorage.setItem(nameLockedKey, '1')
        } catch {
          // ignore
        }
      }
      setNameLocked(true)
      setSessionInfo((prev) =>
        prev
          ? {
              ...prev,
              requestsUsed: prev.requestsUsed + 1,
              requestsRemaining: Math.max(0, prev.requestsLimit - (prev.requestsUsed + 1)),
            }
          : prev
      )
      setSubmitStatus('success')
      setMessage('Request received!')
    } catch (err) {
      setSubmitStatus('error')
      setMessage(err instanceof Error ? err.message : 'Failed to submit request')
    }
  }

  const handleVote = async (requestId: string) => {
    setVoteMessage('')
    if (sessionInfo && sessionInfo.boostsRemaining <= 0) {
      setVoteMessage('Only 5 boosts per session.')
      return
    }
    try {
      const res = await fetch(`/api/requests/${listId}/songs/${requestId}/vote`, {
        method: 'POST',
      })
      if (res.status === 409) {
        setVoteMessage('You already boosted that song.')
        setRequests((prev) =>
          prev.map((request) =>
            request.id === requestId ? { ...request, hasVoted: true } : request
          )
        )
        return
      }
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}))
        setVoteMessage(data.error || 'Only 5 boosts per session.')
        return
      }
      if (!res.ok) {
        throw new Error('Failed to boost song')
      }
      const data = await res.json()
      const updated = data.request as SongRequestItem
      setRequests((prev) =>
        sortRequests(
          prev.map((request) =>
            request.id === requestId
              ? { ...request, voteCount: updated.voteCount, hasVoted: true }
              : request
          )
        )
      )
      setSessionInfo((prev) =>
        prev
          ? {
              ...prev,
              boostsUsed: prev.boostsUsed + 1,
              boostsRemaining: Math.max(0, prev.boostsLimit - (prev.boostsUsed + 1)),
            }
          : prev
      )
    } catch (err) {
      console.error('Failed to vote:', err)
      setVoteMessage('Unable to boost that song right now.')
    }
  }

  const shareUrl = useMemo(() => {
    if (!list?.publicUrl) return ''
    return origin ? `${origin}${list.publicUrl}` : list.publicUrl
  }, [list?.publicUrl, origin])

  const handleCopyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setVoteMessage('Link copied!')
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  if (loading) {
    return (
      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <p className="text-center text-neutral-600">Loading request list...</p>
      </Container>
    )
  }

  if (!list) {
    return (
      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <p className="text-center text-neutral-600">{message || 'Request list not found.'}</p>
      </Container>
    )
  }

  return (
    <>
      <PageIntro eyebrow="Song Requests" title={list.name}>
        <p>
          {list.eventType} · {formatDate(list.eventDate)}
          {list.eventTime ? ` · ${formatTime(list.eventTime)}` : ''}
        </p>
      </PageIntro>

      <Container className="mt-12 sm:mt-16 lg:mt-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,_1fr)_360px]">
          <div className="space-y-8">
            <FadeIn>
              <Border className="p-8">
                <h2 className="text-xl font-semibold text-neutral-950">Request a song</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-neutral-600">
                  {list.publicDescription ||
                    'Search Spotify, pick the track, then drop your name to submit.'}
                </p>
                {sessionInfo ? (
                  <p className="mt-2 text-xs text-neutral-500">
                    {sessionInfo.requestsRemaining} request{sessionInfo.requestsRemaining === 1 ? '' : 's'} left ·{' '}
                    {sessionInfo.boostsRemaining} boost{sessionInfo.boostsRemaining === 1 ? '' : 's'} left
                  </p>
                ) : null}

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div ref={searchRef} className="relative space-y-2">
                    <label className="block text-sm font-semibold text-neutral-950">
                      Song search
                    </label>
                    {selectedTrack ? (
                      <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3">
                        <div className="flex items-center gap-3">
                          {selectedTrack.albumImage ? (
                            <SpotifyPlayOverlayImage
                              src={selectedTrack.albumImage}
                              alt={selectedTrack.album || selectedTrack.name}
                              href={selectedTrack.externalUrl}
                              spotifyUri={`spotify:track:${selectedTrack.id}`}
                              size={48}
                              className="h-12 w-12 rounded"
                            />
                          ) : null}
                          <div>
                            <p className="text-sm font-semibold text-neutral-950">
                              {selectedTrack.name}
                            </p>
                            <p className="text-xs text-neutral-600">{selectedTrack.artist}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedTrack(null)}
                          className="text-xs font-semibold text-neutral-500 hover:text-neutral-950"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search by song or artist"
                          className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                        />
                        {isSearching ? (
                          <p className="text-xs text-neutral-500">Searching...</p>
                        ) : null}
                        {results.length > 0 ? (
                          <div className="absolute z-10 mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-lg">
                            {results.map((track) => (
                              <button
                                type="button"
                                key={track.id}
                                onClick={() => {
                                  setSelectedTrack(track)
                                  setResults([])
                                  setQuery('')
                                }}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50"
                              >
                                {track.albumImage ? (
                                  <SpotifyPlayOverlayImage
                                    src={track.albumImage}
                                    alt={track.album || track.name}
                                    href={track.externalUrl}
                                    mode="popup"
                                    spotifyUri={`spotify:track:${track.id}`}
                                    size={40}
                                    className="h-10 w-10 rounded"
                                  />
                                ) : null}
                                <div className="flex-1 min-w-0">
                                  <p className="truncate text-sm font-semibold text-neutral-950">
                                    {track.name}
                                  </p>
                                  <p className="truncate text-xs text-neutral-600">
                                    {track.artist}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>

                  {alreadyRequested ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      That song is already on the request list. Try another one!
                    </div>
                  ) : null}

                  {nameLocked && hasName ? (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                      Requesting as{' '}
                      <span className="font-semibold text-neutral-950">
                        {formatRequesterName(firstName, lastName)}
                      </span>
                      .{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setNameLocked(false)
                          if (typeof window !== 'undefined' && nameLockedKey) {
                            try {
                              window.localStorage.removeItem(nameLockedKey)
                            } catch {
                              // ignore
                            }
                          }
                        }}
                        className="font-semibold text-neutral-700 underline hover:text-neutral-950"
                      >
                        Change name
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-neutral-950">
                          First name
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-neutral-950">
                          Last name
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                        />
                      </div>
                    </div>
                  )}

                  {message ? (
                    <div
                      className={`rounded-lg border px-4 py-3 text-sm ${
                        submitStatus === 'success'
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : submitStatus === 'error'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                      }`}
                    >
                      {message}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={
                      submitStatus === 'saving' || (sessionInfo ? sessionInfo.requestsRemaining <= 0 : false)
                    }
                  >
                    {submitStatus === 'saving' ? 'Submitting...' : 'Submit request'}
                  </Button>
                </form>
              </Border>
            </FadeIn>

            <FadeIn>
              <Border className="p-8">
                <h2 className="text-xl font-semibold text-neutral-950">
                  Requested songs
                </h2>
                <p className="mt-2 text-sm text-neutral-600">
                  If you see your song here, hit the Boost button to push it to the top.
                </p>
                {voteMessage ? (
                  <p className="mt-3 text-sm text-neutral-600">{voteMessage}</p>
                ) : null}
                <div className="mt-6 space-y-3">
                  {requests.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      No requests yet. Be the first!
                    </p>
                  ) : (
                    requests.map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {request.albumImage ? (
                            <SpotifyPlayOverlayImage
                              src={request.albumImage}
                              alt={request.album || request.name}
                              href={request.externalUrl}
                              spotifyUri={`spotify:track:${request.spotifyId}`}
                              size={56}
                              className="h-14 w-14 rounded"
                            />
                          ) : null}
                          <div>
                            <p className="text-sm font-semibold text-neutral-950">
                              {request.name}
                            </p>
                            <p className="text-xs text-neutral-600">{request.artist}</p>
                            <p className="text-xs text-neutral-400">
                              Requested by {formatRequesterName(request.requesterFirstName, request.requesterLastName)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-neutral-950">
                              {request.voteCount}
                            </p>
                            <p className="text-xs text-neutral-500">boosts</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleVote(request.id)}
                            disabled={Boolean(request.hasVoted) || (sessionInfo ? sessionInfo.boostsRemaining <= 0 : false)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                              request.hasVoted || (sessionInfo ? sessionInfo.boostsRemaining <= 0 : false)
                                ? 'cursor-not-allowed bg-neutral-100 text-neutral-400'
                                : 'bg-neutral-950 text-white hover:bg-neutral-800'
                            }`}
                          >
                            {request.hasVoted ? 'Boosted' : sessionInfo && sessionInfo.boostsRemaining <= 0 ? 'No boosts left' : 'Boost'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Border>
            </FadeIn>
          </div>

          <FadeIn>
            <div className="space-y-6">
              <Border className="p-6">
                <h3 className="text-lg font-semibold text-neutral-950">Share</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Copy this link to share with guests.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600 break-all">
                    {shareUrl || list.publicUrl}
                  </div>
                  <Button onClick={handleCopyLink} className="w-full justify-center">
                    Copy link
                  </Button>
                </div>
              </Border>
            </div>
          </FadeIn>
        </div>
      </Container>
    </>
  )
}
