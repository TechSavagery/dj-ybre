'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useId } from 'react'
import { motion } from 'framer-motion'
import { ChevronDownIcon, XMarkIcon, PlusIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { FadeIn } from '@/components/FadeIn'
import { Container } from '@/components/Container'
import { PageIntro } from '@/components/PageIntro'
import { TRANSITION_TYPES } from '@/lib/transitions'
import { SpotifyPlayOverlayImage } from '@/components/SpotifyPlayOverlayImage'

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const MODE_NAMES = ['Minor', 'Major']

function formatKey(key: number | null | undefined, mode: number | null | undefined): string | null {
  if (key === null || key === undefined) return null
  const keyName = KEY_NAMES[key]
  const modeName = mode !== null && mode !== undefined ? MODE_NAMES[mode] : null
  return `${keyName}${modeName ? ` ${modeName}` : ''}`
}

function formatDuration(ms: number | null | undefined): string | null {
  if (!ms && ms !== 0) return null
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded">
      {children}
    </span>
  )
}

interface Track {
  id: string
  name: string
  artist: string
  artists: Array<{ id: string; name: string }>
  album: string
  albumImage?: string
  previewUrl?: string
  externalUrl: string
  duration: number
}

interface SelectedTrack extends Track {
  position: number
  fromTrackId?: string | null
  // Enriched track details
  releaseYear?: number | null
  bpm?: number | null
  key?: number | null
  mode?: number | null
  danceability?: number | null
  energy?: number | null
  valence?: number | null
  genres?: string[]
  reccoBeatsId?: string | null
}

function TextInput({
  label,
  type = 'text',
  value,
  placeholder,
  ...props
}: React.ComponentPropsWithoutRef<'input'> & { label: string }) {
  let id = useId()
  const hasValue = value && String(value).length > 0
  const showPlaceholder = placeholder && !hasValue

  return (
    <div className="group relative z-0 transition-all focus-within:z-10">
      <input
        type={type}
        id={id}
        value={value}
        {...props}
        placeholder={showPlaceholder ? placeholder : ' '}
        className="peer block w-full border border-neutral-300 bg-transparent px-6 pb-4 pt-12 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5 group-first:rounded-t-2xl group-last:rounded-b-2xl"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-6 top-1/2 -mt-3 origin-left text-base/6 text-neutral-500 transition-all duration-200 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:font-semibold peer-focus:text-neutral-950 peer-[:not(:placeholder-shown)]:-translate-y-4 peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-neutral-950"
      >
        {label}
      </label>
    </div>
  )
}

function TextareaInput({
  label,
  value,
  placeholder,
  ...props
}: React.ComponentPropsWithoutRef<'textarea'> & { label: string }) {
  let id = useId()
  const hasValue = value && String(value).length > 0
  const showPlaceholder = placeholder && !hasValue

  return (
    <div className="group relative z-0 transition-all focus-within:z-10">
      <textarea
        id={id}
        value={value}
        {...props}
        placeholder={showPlaceholder ? placeholder : ' '}
        rows={4}
        className="peer block w-full border border-neutral-300 bg-transparent px-6 pb-4 pt-12 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5 group-first:rounded-t-2xl group-last:rounded-b-2xl resize-none"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-6 top-1/2 -mt-3 origin-left text-base/6 text-neutral-500 transition-all duration-200 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:font-semibold peer-focus:text-neutral-950 peer-[:not(:placeholder-shown)]:-translate-y-4 peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-neutral-950"
      >
        {label}
      </label>
    </div>
  )
}

function PackagePopover({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
}) {
  let id = useId()
  const hasValue = value && value !== ''
  const selectedOption = options.find((opt) => opt.value === value)
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="group relative z-0 transition-all focus-within:z-10" ref={popoverRef}>
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="peer block w-full border border-neutral-300 bg-transparent px-6 pb-4 pt-12 pr-10 text-base/6 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5 group-first:rounded-t-2xl group-last:rounded-b-2xl text-left flex items-center justify-between"
      >
        <span className={hasValue ? 'text-neutral-950' : 'text-neutral-500'}>
          {selectedOption?.label || `Select ${label}`}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`size-5 flex-shrink-0 text-neutral-500 absolute right-6 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-6 origin-left text-base/6 transition-all duration-200 ${
          hasValue || isOpen
            ? '-translate-y-4 scale-75 font-semibold text-neutral-950 top-3'
            : 'top-1/2 -mt-3 text-neutral-500'
        }`}
      >
        {label}
      </label>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="absolute z-10 mt-1 w-full rounded-xl bg-white p-2 text-sm/6 font-semibold text-neutral-950 shadow-lg outline-1 outline-neutral-900/5"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left transition ${
                value === option.value
                  ? 'bg-neutral-950 text-white'
                  : 'hover:bg-neutral-100 text-neutral-950'
              }`}
            >
              {option.label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  )
}

function MultiSelectPopover({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ value: string; label: string }>
  value: string[]
  onChange: (value: string[]) => void
}) {
  let id = useId()
  const hasValue = value && value.length > 0
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const displayText = hasValue
    ? `${value.length} type${value.length > 1 ? 's' : ''} selected`
    : `Select ${label}`

  return (
    <div className="group relative z-0 transition-all focus-within:z-10" ref={popoverRef}>
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="peer block w-full border border-neutral-300 bg-transparent px-6 pb-4 pt-12 pr-10 text-base/6 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5 group-first:rounded-t-2xl group-last:rounded-b-2xl text-left flex items-center justify-between"
      >
        <span className={hasValue ? 'text-neutral-950' : 'text-neutral-500'}>
          {displayText}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`size-5 flex-shrink-0 text-neutral-500 absolute right-6 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-6 origin-left text-base/6 transition-all duration-200 ${
          hasValue || isOpen
            ? '-translate-y-4 scale-75 font-semibold text-neutral-950 top-3'
            : 'top-1/2 -mt-3 text-neutral-500'
        }`}
      >
        {label}
      </label>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="absolute z-10 mt-1 w-full rounded-xl bg-white p-2 text-sm/6 font-semibold text-neutral-950 shadow-lg outline-1 outline-neutral-900/5 max-h-80 overflow-y-auto"
        >
          {options.map((option) => {
            const isSelected = value.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                className={`block w-full rounded-lg px-3 py-2 text-left transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-neutral-950 text-white'
                    : 'hover:bg-neutral-100 text-neutral-950'
                }`}
              >
                <span className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                  isSelected ? 'border-white bg-white' : 'border-neutral-300'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-neutral-950" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                {option.label}
              </button>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}

function TrackSearchInput({
  label,
  onTrackSelect,
  selectedTracks,
  position,
  detailsLoadingByTrackId,
}: {
  label: string
  onTrackSelect: (track: Track, position: number) => void
  selectedTracks: SelectedTrack[]
  position: number
  detailsLoadingByTrackId: Record<string, boolean>
}) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Track[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement | null>(null)

  // Debounce search
  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.tracks || [])
          setIsOpen(true)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedTrack = selectedTracks.find((t) => t.position === position)
  const isDetailsLoading = Boolean(selectedTrack?.id && detailsLoadingByTrackId[selectedTrack.id])

  const supportingArtists =
    selectedTrack?.artists && selectedTrack.artists.length > 1
      ? selectedTrack.artists.slice(1).map((a) => a.name)
      : []

  const durationLabel = formatDuration(selectedTrack?.duration)
  const bpmLabel =
    selectedTrack?.bpm !== null && selectedTrack?.bpm !== undefined
      ? `${Math.round(selectedTrack.bpm)} BPM`
      : null
  const keyLabel = formatKey(selectedTrack?.key, selectedTrack?.mode)
  const danceLabel =
    selectedTrack?.danceability !== null && selectedTrack?.danceability !== undefined
      ? `Dance ${Math.round(selectedTrack.danceability * 100)}%`
      : null
  const energyLabel =
    selectedTrack?.energy !== null && selectedTrack?.energy !== undefined
      ? `Energy ${Math.round(selectedTrack.energy * 100)}%`
      : null
  const moodLabel =
    selectedTrack?.valence !== null && selectedTrack?.valence !== undefined
      ? `Mood ${Math.round(selectedTrack.valence * 100)}%`
      : null
  const genreList = selectedTrack?.genres?.filter(Boolean) || []
  const showGenres = genreList.slice(0, 2)
  const moreGenresCount = Math.max(0, genreList.length - showGenres.length)

  return (
    <div className="group relative z-0 transition-all focus-within:z-10" ref={searchRef}>
      {selectedTrack ? (
        <div className="border border-neutral-300 bg-transparent px-6 pb-4 pt-12 text-base/6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedTrack.albumImage && (
                <SpotifyPlayOverlayImage
                  src={selectedTrack.albumImage}
                  alt={selectedTrack.album}
                  href={selectedTrack.externalUrl}
                  mode="popup"
                  spotifyUri={`spotify:track:${selectedTrack.id}`}
                  size={48}
                  className="w-12 h-12 rounded flex-shrink-0"
                />
              )}
              <div>
                <div className="font-semibold text-neutral-950">{selectedTrack.name}</div>
                <div className="text-sm text-neutral-600">{selectedTrack.artist}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {isDetailsLoading ? <Pill>Loading details…</Pill> : null}
                  {!isDetailsLoading ? (
                    selectedTrack.releaseYear !== null && selectedTrack.releaseYear !== undefined ? (
                      <Pill>{selectedTrack.releaseYear}</Pill>
                    ) : (
                      <Pill>Year —</Pill>
                    )
                  ) : null}
                  {!isDetailsLoading && durationLabel ? <Pill>{durationLabel}</Pill> : null}
                  {!isDetailsLoading ? <Pill>{bpmLabel ?? 'BPM —'}</Pill> : null}
                  {keyLabel ? <Pill>{keyLabel}</Pill> : null}
                  {danceLabel ? <Pill>{danceLabel}</Pill> : null}
                  {energyLabel ? <Pill>{energyLabel}</Pill> : null}
                  {moodLabel ? <Pill>{moodLabel}</Pill> : null}
                  {supportingArtists.length > 0 ? (
                    <Pill>
                      feat. {supportingArtists.slice(0, 2).join(', ')}
                      {supportingArtists.length > 2 ? ` +${supportingArtists.length - 2}` : ''}
                    </Pill>
                  ) : null}
                  {showGenres.map((g) => (
                    <Pill key={g}>{g}</Pill>
                  ))}
                  {moreGenresCount > 0 ? <Pill>+{moreGenresCount} genres</Pill> : null}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onTrackSelect({} as Track, position) // Clear this position
              }}
              className="p-2 hover:bg-neutral-100 rounded-full transition"
            >
              <XMarkIcon className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <input
            type="text"
            id={id}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder=" "
            className="peer block w-full border border-neutral-300 bg-transparent px-6 pb-4 pt-12 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5 group-first:rounded-t-2xl group-last:rounded-b-2xl"
          />
          <label
            htmlFor={id}
            className="pointer-events-none absolute left-6 top-1/2 -mt-3 origin-left text-base/6 text-neutral-500 transition-all duration-200 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:font-semibold peer-focus:text-neutral-950 peer-[:not(:placeholder-shown)]:-translate-y-4 peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-neutral-950"
          >
            {label}
          </label>
          {isSearching && (
            <div className="absolute right-6 top-1/2 -mt-3 text-neutral-500 text-sm">
              Searching...
            </div>
          )}
          {isOpen && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute z-10 mt-1 w-full rounded-xl bg-white p-2 text-sm/6 font-semibold text-neutral-950 shadow-lg outline-1 outline-neutral-900/5 max-h-80 overflow-y-auto"
            >
              {results.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => {
                    onTrackSelect(track, position)
                    setQuery('')
                    setIsOpen(false)
                  }}
                  className="block w-full rounded-lg px-3 py-3 text-left transition hover:bg-neutral-100 text-neutral-950"
                >
                  <div className="flex items-center gap-3">
                    {track.albumImage && (
                      <SpotifyPlayOverlayImage
                        src={track.albumImage}
                        alt={track.album}
                        href={track.externalUrl}
                        mode="popup"
                        spotifyUri={`spotify:track:${track.id}`}
                        size={40}
                        className="w-10 h-10 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{track.name}</div>
                      <div className="text-xs text-neutral-600 truncate">{track.artist}</div>
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

export default function TransitionsPage() {
  const [selectedTracks, setSelectedTracks] = useState<SelectedTrack[]>([])
  const [trackSlots, setTrackSlots] = useState(2)
  const [transitionTypes, setTransitionTypes] = useState<string[]>([])
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [stemsNotes, setStemsNotes] = useState('')
  const [tags, setTags] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [detailsLoadingByTrackId, setDetailsLoadingByTrackId] = useState<Record<string, boolean>>({})

  const enrichTrackDetails = useCallback(async (trackId: string) => {
    setDetailsLoadingByTrackId((prev) => ({ ...prev, [trackId]: true }))
    try {
      const res = await fetch(`/api/spotify/track/${encodeURIComponent(trackId)}`)
      if (!res.ok) return
      const data = await res.json()

      setSelectedTracks((prev) =>
        prev.map((t) =>
          t.id === trackId
            ? {
                ...t,
                releaseYear: data.releaseYear ?? null,
                bpm: data.bpm ?? null,
                key: data.key ?? null,
                mode: data.mode ?? null,
                danceability: data.danceability ?? null,
                energy: data.energy ?? null,
                valence: data.valence ?? null,
                genres: Array.isArray(data.genres) ? data.genres : [],
                reccoBeatsId: data.reccoBeatsId ?? null,
              }
            : t
        )
      )
    } catch (err) {
      console.error('Failed to enrich track details:', err)
    } finally {
      setDetailsLoadingByTrackId((prev) => ({ ...prev, [trackId]: false }))
    }
  }, [])

  const handleTrackSelect = useCallback((track: Track, position: number) => {
    if (!track.id) {
      // Remove track
      setSelectedTracks((prev) => {
        const filtered = prev.filter((t) => t.position !== position)
        // Reorder positions and update fromTrackId relationships
        return filtered.map((t, idx) => ({
          ...t,
          position: idx + 1,
          fromTrackId: idx === 0 ? undefined : filtered[idx - 1]?.id || null,
        }))
      })
      return
    }

    setSelectedTracks((prev) => {
      const existing = prev.find((t) => t.position === position)
      if (existing) {
        // Replace existing track
        return prev.map((t) =>
          t.position === position
            ? {
                ...track,
                position,
                fromTrackId: position === 1 ? undefined : prev.find((p) => p.position === position - 1)?.id || null,
              }
            : t
        )
      } else {
        // Add new track - find the previous track for fromTrackId
        const prevTrack = prev.find((p) => p.position === position - 1)
        const newTrack: SelectedTrack = {
          ...track,
          position,
          fromTrackId: position === 1 ? undefined : prevTrack?.id || null,
        }
        return [...prev, newTrack].sort((a, b) => a.position - b.position)
      }
    })
    // Enrich selected track with audio features/genres for pills UI
    enrichTrackDetails(track.id)
  }, [enrichTrackDetails])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedTracks.length < 2) {
      setErrorMessage('Please select at least 2 tracks')
      setSubmitStatus('error')
      return
    }

    if (transitionTypes.length === 0) {
      setErrorMessage('Please select at least one transition type')
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/transitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracks: selectedTracks.map((t) => ({
            spotifyId: t.id,
            position: t.position,
            fromTrackId: t.fromTrackId || null,
          })),
          type: transitionTypes,
          name: name || undefined,
          notes: notes || undefined,
          stemsNotes: stemsNotes || undefined,
          tags: tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create transition')
      }

      setSubmitStatus('success')
      // Reset form
      setSelectedTracks([])
      setTrackSlots(2)
      setTransitionTypes([])
      setName('')
      setNotes('')
      setStemsNotes('')
      setTags('')
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create transition')
    } finally {
      setIsSubmitting(false)
    }
  }

  const transitionTypeOptions = TRANSITION_TYPES.map((type) => ({
    value: type,
    label: type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
  }))

  return (
    <>
      <PageIntro eyebrow="DJ Transitions" title="Create a Transition">
        <p>Catalog your DJ transitions with track metadata from Spotify.</p>
        <div className="mt-4">
          <Link
            href="/transitions/browse"
            className="text-sm font-semibold text-neutral-950 hover:text-neutral-700"
          >
            Browse all transitions →
          </Link>
        </div>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn>
          {submitStatus === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-neutral-300 bg-white/50 p-10 text-center"
            >
              <h2 className="font-display text-2xl font-semibold text-neutral-950">
                Transition Created!
              </h2>
              <p className="mt-4 text-base/6 text-neutral-600">
                Your transition has been successfully added to the database.
              </p>
              <Button
                onClick={() => setSubmitStatus('idle')}
                className="mt-6"
              >
                Create Another
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="font-display text-base font-semibold text-neutral-950">
                Transition Details
              </h2>
              <div className="isolate mt-6 -space-y-px rounded-2xl bg-white/50">
                {/* Track Selection */}
                {Array.from({ length: trackSlots }, (_, i) => i + 1).map((position) => (
                  <TrackSearchInput
                    key={position}
                    label={`Track ${position}${position === 1 ? ' (First Track)' : ''}`}
                    onTrackSelect={(track, pos) => handleTrackSelect(track, pos)}
                    selectedTracks={selectedTracks}
                    position={position}
                    detailsLoadingByTrackId={detailsLoadingByTrackId}
                  />
                ))}

                <div className="px-6 py-4 border border-neutral-300 bg-transparent group-first:rounded-t-2xl group-last:rounded-b-2xl">
                  <Button
                    type="button"
                    onClick={() => setTrackSlots((prev) => Math.min(4, prev + 1))}
                    disabled={trackSlots >= 4}
                    className="w-full justify-center"
                  >
                    <span className="inline-flex items-center gap-2">
                      <PlusIcon className="w-5 h-5" aria-hidden="true" />
                      {trackSlots >= 4 ? 'Maximum 4 tracks' : 'Add track'}
                    </span>
                  </Button>
                </div>

                <MultiSelectPopover
                  label="Transition Types"
                  value={transitionTypes}
                  onChange={setTransitionTypes}
                  options={transitionTypeOptions}
                />

                <TextInput
                  label="Transition Name (Optional)"
                  name="name"
                  value={name}
                  placeholder="Auto-generated if not provided"
                  onChange={(e) => setName(e.target.value)}
                />

                <TextareaInput
                  label="Notes"
                  name="notes"
                  value={notes}
                  placeholder="Tutorial/notes about the transition"
                  onChange={(e) => setNotes(e.target.value)}
                />

                <TextareaInput
                  label="Stems Notes (Optional)"
                  name="stemsNotes"
                  value={stemsNotes}
                  placeholder="Notes about stems used (vocals, instrumental, etc.)"
                  onChange={(e) => setStemsNotes(e.target.value)}
                />

                <TextInput
                  label="Tags (Optional)"
                  name="tags"
                  value={tags}
                  placeholder="Comma-separated tags (e.g., house, progressive, smooth)"
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              {submitStatus === 'error' && errorMessage && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              )}

              <Button type="submit" className="mt-10" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Transition'}
              </Button>
            </form>
          )}
        </FadeIn>
      </Container>
    </>
  )
}
