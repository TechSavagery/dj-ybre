'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useId } from 'react'
import { motion } from 'framer-motion'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import Image from 'next/image'
import { Container } from '@/components/Container'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { Border } from '@/components/Border'
import { TRANSITION_TYPES } from '@/lib/transitions'
import Link from 'next/link'

interface TransitionTrack {
  id: string
  name: string
  artist: string
  album?: string
  albumImage?: string
  bpm?: number
  key?: number
  mode?: number
  energy?: number
  position: number
}

interface Transition {
  id: string
  name: string
  type: string[]
  notes?: string
  stemsNotes?: string
  tags: string[]
  createdAt: string
  tracks: TransitionTrack[]
}

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const MODE_NAMES = ['Minor', 'Major']

function formatKey(key: number | null | undefined, mode: number | null | undefined): string {
  if (key === null || key === undefined) return 'N/A'
  const keyName = KEY_NAMES[key]
  const modeName = mode !== null && mode !== undefined ? MODE_NAMES[mode] : ''
  return `${keyName}${modeName ? ` ${modeName}` : ''}`
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

  return (
    <div className="group relative">
      <input
        type={type}
        id={id}
        value={value}
        {...props}
        placeholder={placeholder}
        className="block w-full border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5 rounded-lg"
      />
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-neutral-950 mb-2"
        >
          {label}
        </label>
      )}
    </div>
  )
}

function MultiSelectFilter({
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

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5 rounded-lg flex items-center justify-between"
      >
        <span className={value.length > 0 ? 'text-neutral-950' : 'text-neutral-500'}>
          {value.length > 0 ? `${value.length} selected` : label}
        </span>
        <ChevronDownIcon
          className={`size-5 flex-shrink-0 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="absolute z-10 mt-1 w-full rounded-xl bg-white p-2 text-sm/6 font-semibold text-neutral-950 shadow-lg outline-1 outline-neutral-900/5 max-h-60 overflow-y-auto"
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

function TransitionCard({ transition }: { transition: Transition }) {
  const avgBpm = transition.tracks
    .map((t) => t.bpm)
    .filter((bpm): bpm is number => bpm !== null && bpm !== undefined)
    .reduce((acc, bpm, _, arr) => acc + bpm / arr.length, 0) || null

  const firstTrack = transition.tracks[0]
  const key = firstTrack?.key
  const mode = firstTrack?.mode

  return (
    <Link href={`/transitions/${transition.id}`}>
      <Border className="p-6 hover:bg-neutral-50 transition cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl font-semibold text-neutral-950 mb-2">
              {transition.name}
            </h3>
            
            {/* Tracks */}
            <div className="space-y-2 mb-4">
              {transition.tracks.map((track, idx) => (
                <div key={track.id} className="flex items-center gap-3">
                  {track.albumImage && (
                    <Image
                      src={track.albumImage}
                      alt={track.album || track.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                      unoptimized
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-950 truncate">
                      {track.name}
                    </div>
                    <div className="text-xs text-neutral-600 truncate">
                      {track.artist}
                    </div>
                  </div>
                  {idx < transition.tracks.length - 1 && (
                    <span className="text-neutral-400 text-xs">→</span>
                  )}
                </div>
              ))}
            </div>

            {/* Types */}
            <div className="flex flex-wrap gap-2 mb-3">
              {transition.type.map((type) => (
                <span
                  key={type}
                  className="px-2 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded"
                >
                  {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
              ))}
            </div>

            {/* Tags */}
            {transition.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {transition.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs text-neutral-600 bg-neutral-50 rounded"
                  >
                    #{tag}
                  </span>
                ))}
                {transition.tags.length > 3 && (
                  <span className="px-2 py-0.5 text-xs text-neutral-500">
                    +{transition.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-xs text-neutral-600 mt-4">
              {avgBpm && (
                <span>
                  <strong className="text-neutral-950">BPM:</strong> {Math.round(avgBpm)}
                </span>
              )}
              {key !== null && key !== undefined && (
                <span>
                  <strong className="text-neutral-950">Key:</strong> {formatKey(key, mode)}
                </span>
              )}
              {firstTrack?.energy !== null && firstTrack?.energy !== undefined && (
                <span>
                  <strong className="text-neutral-950">Energy:</strong> {Math.round(firstTrack.energy * 100)}%
                </span>
              )}
              <span>
                <strong className="text-neutral-950">Tracks:</strong> {transition.tracks.length}
              </span>
            </div>

            {/* Notes preview */}
            {transition.notes && (
              <p className="text-sm text-neutral-600 mt-3 line-clamp-2">
                {transition.notes}
              </p>
            )}
          </div>
        </div>
      </Border>
    </Link>
  )
}

export default function BrowseTransitionsPage() {
  const [transitions, setTransitions] = useState<Transition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [minBpm, setMinBpm] = useState('')
  const [maxBpm, setMaxBpm] = useState('')
  const [minEnergy, setMinEnergy] = useState('')
  const [maxEnergy, setMaxEnergy] = useState('')
  const [trackCount, setTrackCount] = useState('')
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  })

  const transitionTypeOptions = TRANSITION_TYPES.map((type) => ({
    value: type,
    label: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  }))

  const fetchTransitions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      selectedTypes.forEach((type) => params.append('types', type))
      selectedTags.forEach((tag) => params.append('tags', tag))
      if (minBpm) params.set('minBpm', minBpm)
      if (maxBpm) params.set('maxBpm', maxBpm)
      if (minEnergy) params.set('minEnergy', minEnergy)
      if (maxEnergy) params.set('maxEnergy', maxEnergy)
      if (trackCount) params.set('trackCount', trackCount)
      params.set('limit', '50')
      params.set('offset', '0')

      const response = await fetch(`/api/transitions?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTransitions(data.transitions || [])
        setPagination(data.pagination || {
          total: 0,
          limit: 50,
          offset: 0,
          hasMore: false,
        })
      }
    } catch (error) {
      console.error('Error fetching transitions:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedTypes, selectedTags, minBpm, maxBpm, minEnergy, maxEnergy, trackCount])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTransitions()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [fetchTransitions])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTypes([])
    setSelectedTags([])
    setMinBpm('')
    setMaxBpm('')
    setMinEnergy('')
    setMaxEnergy('')
    setTrackCount('')
  }

  const hasActiveFilters = 
    searchQuery || 
    selectedTypes.length > 0 || 
    selectedTags.length > 0 || 
    minBpm || 
    maxBpm || 
    minEnergy || 
    maxEnergy || 
    trackCount

  // Get unique tags from transitions
  const allTags = Array.from(
    new Set(transitions.flatMap((t) => t.tags))
  ).map((tag) => ({ value: tag, label: tag }))

  return (
    <>
      <PageIntro eyebrow="DJ Transitions" title="Browse Transitions">
        <p>Search and filter your transition library for inspiration.</p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <FadeIn>
              <div className="sticky top-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-neutral-950">
                    Filters
                  </h2>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-neutral-600 hover:text-neutral-950"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Search */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-950 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Track name, artist, notes..."
                      className="w-full border border-neutral-300 bg-transparent pl-10 pr-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5 rounded-lg"
                    />
                  </div>
                </div>

                {/* Transition Types */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-950 mb-2">
                    Transition Types
                  </label>
                  <MultiSelectFilter
                    label="Select types"
                    options={transitionTypeOptions}
                    value={selectedTypes}
                    onChange={setSelectedTypes}
                  />
                </div>

                {/* Tags */}
                {allTags.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-neutral-950 mb-2">
                      Tags
                    </label>
                    <MultiSelectFilter
                      label="Select tags"
                      options={allTags}
                      value={selectedTags}
                      onChange={setSelectedTags}
                    />
                  </div>
                )}

                {/* BPM Range */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-950 mb-2">
                    BPM Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <TextInput
                      label=""
                      type="number"
                      value={minBpm}
                      onChange={(e) => setMinBpm(e.target.value)}
                      placeholder="Min"
                    />
                    <TextInput
                      label=""
                      type="number"
                      value={maxBpm}
                      onChange={(e) => setMaxBpm(e.target.value)}
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Energy Range */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-950 mb-2">
                    Energy (0-100)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <TextInput
                      label=""
                      type="number"
                      min="0"
                      max="100"
                      value={minEnergy}
                      onChange={(e) => setMinEnergy(e.target.value)}
                      placeholder="Min"
                    />
                    <TextInput
                      label=""
                      type="number"
                      min="0"
                      max="100"
                      value={maxEnergy}
                      onChange={(e) => setMaxEnergy(e.target.value)}
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Track Count */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-950 mb-2">
                    Track Count
                  </label>
                  <TextInput
                    label=""
                    type="number"
                    min="2"
                    max="4"
                    value={trackCount}
                    onChange={(e) => setTrackCount(e.target.value)}
                    placeholder="2, 3, or 4"
                  />
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <FadeIn>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-semibold text-neutral-950">
                  {loading ? 'Loading...' : `${pagination.total} transition${pagination.total !== 1 ? 's' : ''} found`}
                </h2>
                <Link
                  href="/transitions"
                  className="text-sm font-semibold text-neutral-950 hover:text-neutral-700"
                >
                  + Create New
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-12 text-neutral-600">
                  Loading transitions...
                </div>
              ) : transitions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-600 mb-4">No transitions found</p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm font-semibold text-neutral-950 hover:text-neutral-700"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <FadeInStagger className="space-y-6">
                  {transitions.map((transition) => (
                    <FadeIn key={transition.id}>
                      <TransitionCard transition={transition} />
                    </FadeIn>
                  ))}
                </FadeInStagger>
              )}
            </FadeIn>
          </div>
        </div>
      </Container>
    </>
  )
}
