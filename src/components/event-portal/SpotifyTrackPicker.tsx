'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { SpotifyPlayOverlayImage } from '@/components/SpotifyPlayOverlayImage'
import { isSchoolDanceEventType } from '@/lib/eventPortal'

export interface SpotifyTrackItem {
  id: string
  name: string
  artist: string
  album?: string | null
  albumImage?: string | null
  previewUrl?: string | null
  externalUrl?: string | null
  duration?: number | null
}

interface SpotifyTrackPickerProps {
  label: string
  helperText?: string | null
  required?: boolean
  eventType?: string
  value: SpotifyTrackItem[]
  onChange: (tracks: SpotifyTrackItem[]) => void
}

export function SpotifyTrackPicker({
  label,
  helperText,
  required = false,
  eventType,
  value,
  onChange,
}: SpotifyTrackPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SpotifyTrackItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState('')
  const searchRef = useRef<HTMLDivElement | null>(null)

  const selectedIds = useMemo(
    () => new Set(value.map((track) => track.id)),
    [value]
  )

  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setResults([])
      return
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true)
      try {
        const nonExplicit = eventType ? isSchoolDanceEventType(eventType) : false
        const endpoint = `/api/spotify/search?q=${encodeURIComponent(query)}&limit=12${
          nonExplicit ? '&nonExplicit=1' : ''
        }`
        const response = await fetch(endpoint)
        if (!response.ok) return
        const data = await response.json()
        setResults(Array.isArray(data?.tracks) ? data.tracks : [])
      } catch (error) {
        console.error('Spotify search failed:', error)
      } finally {
        setIsSearching(false)
      }
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [eventType, query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addTrack = (track: SpotifyTrackItem) => {
    if (selectedIds.has(track.id)) {
      setMessage('That song is already selected.')
      return
    }
    setMessage('')
    onChange([...value, track])
    setQuery('')
    setResults([])
  }

  const removeTrack = (trackId: string) => {
    onChange(value.filter((track) => track.id !== trackId))
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-neutral-950">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </label>
      {helperText ? <p className="text-xs text-neutral-500">{helperText}</p> : null}

      <div ref={searchRef} className="relative">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Spotify by song or artist"
          className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
        />
        {isSearching ? (
          <p className="mt-2 text-xs text-neutral-500">Searching...</p>
        ) : null}

        {results.length > 0 ? (
          <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
            {results.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => addTrack(track)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50"
              >
                {track.albumImage ? (
                  <SpotifyPlayOverlayImage
                    src={track.albumImage}
                    alt={track.album || track.name}
                    href={track.externalUrl || undefined}
                    spotifyUri={`spotify:track:${track.id}`}
                    mode="popup"
                    size={40}
                    className="h-10 w-10 rounded"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-950">
                    {track.name}
                  </p>
                  <p className="truncate text-xs text-neutral-600">{track.artist}</p>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {message ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {message}
        </p>
      ) : null}

      <div className="space-y-2">
        {value.length === 0 ? (
          <p className="text-sm text-neutral-500">No songs selected yet.</p>
        ) : (
          value.map((track) => (
            <div
              key={track.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                {track.albumImage ? (
                  <SpotifyPlayOverlayImage
                    src={track.albumImage}
                    alt={track.album || track.name}
                    href={track.externalUrl || undefined}
                    spotifyUri={`spotify:track:${track.id}`}
                    mode="popup"
                    size={40}
                    className="h-10 w-10 rounded"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-950">
                    {track.name}
                  </p>
                  <p className="truncate text-xs text-neutral-600">{track.artist}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeTrack(track.id)}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 hover:text-neutral-950"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

