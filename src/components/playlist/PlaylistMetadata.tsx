'use client'

import { useEffect, useState } from 'react'

interface Track {
  name: string
  artist: string
  duration: number
  audioFeatures?: {
    bpm?: number
    energy?: number
    valence?: number
  }
  genres?: string[]
}

interface PlaylistMetadataProps {
  session: {
    id: string
    eventType: string
    playlistDuration: number
    graduationYear1?: number
    graduationYear2?: number
    hometown1?: string
    hometown2?: string
    college1?: string
    college2?: string
    lastConcert1?: string
    lastConcert2?: string
    lastConcert3?: string
    eventDescription?: string
  }
  tracks: Track[]
}

export function PlaylistMetadata({ session, tracks }: PlaylistMetadataProps) {
  const [description, setDescription] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const generateDescription = async () => {
      try {
        const context = {
          eventType: session.eventType,
          playlistDuration: session.playlistDuration,
          graduationYear1: session.graduationYear1,
          graduationYear2: session.graduationYear2,
          hometown1: session.hometown1,
          hometown2: session.hometown2,
          college1: session.college1,
          college2: session.college2,
          lastConcert1: session.lastConcert1,
          lastConcert2: session.lastConcert2,
          lastConcert3: session.lastConcert3,
          eventDescription: session.eventDescription,
        }
        const response = await fetch('/api/generate-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(context),
        })
        if (response.ok) {
          const data = await response.json()
          setDescription(data.description)
        } else {
          throw new Error('Failed to generate description')
        }
      } catch (error) {
        console.error('Failed to generate description:', error)
        setDescription('A carefully curated playlist for your special event.')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      generateDescription()
    }
  }, [session])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0) / 1000

  // Genre breakdown
  const genreCounts = new Map<string, number>()
  tracks.forEach((track) => {
    if (track.genres) {
      track.genres.forEach((genre) => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1)
      })
    }
  })
  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Artist breakdown
  const artistCounts = new Map<string, number>()
  tracks.forEach((track) => {
    artistCounts.set(track.artist, (artistCounts.get(track.artist) || 0) + 1)
  })
  const topArtists = Array.from(artistCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // BPM range
  const bpms = tracks
    .map((t) => t.audioFeatures?.bpm)
    .filter((bpm): bpm is number => bpm !== undefined && bpm > 0)
  const minBpm = bpms.length > 0 ? Math.min(...bpms) : 0
  const maxBpm = bpms.length > 0 ? Math.max(...bpms) : 0
  const avgBpm =
    bpms.length > 0
      ? Math.round(bpms.reduce((sum, bpm) => sum + bpm, 0) / bpms.length)
      : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-950 mb-4">
          Playlist Details
        </h2>
        {loading ? (
          <p className="text-neutral-500">Generating description...</p>
        ) : (
          <p className="text-neutral-700 leading-relaxed">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Duration */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-neutral-600 mb-2">
            Total Duration
          </h3>
          <p className="text-2xl font-semibold text-neutral-950">
            {formatDuration(totalDuration)}
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            {tracks.length} tracks
          </p>
        </div>

        {/* BPM Range */}
        {avgBpm > 0 && (
          <div className="bg-neutral-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              BPM Range
            </h3>
            <p className="text-2xl font-semibold text-neutral-950">
              {minBpm === maxBpm ? (
                `${avgBpm} BPM`
              ) : (
                <>
                  {minBpm} - {maxBpm} BPM
                  <span className="text-base text-neutral-600 ml-2">
                    (avg: {avgBpm})
                  </span>
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Genre Breakdown */}
      {topGenres.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-950 mb-3">
            Genre Breakdown
          </h3>
          <div className="space-y-2">
            {topGenres.map(([genre, count]) => {
              const percentage = (count / tracks.length) * 100
              return (
                <div key={genre}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-950">
                      {genre}
                    </span>
                    <span className="text-sm text-neutral-600">
                      {count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-950 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Artist Breakdown */}
      {topArtists.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-950 mb-3">
            Top Artists
          </h3>
          <div className="space-y-2">
            {topArtists.map(([artist, count]) => {
              const percentage = (count / tracks.length) * 100
              return (
                <div key={artist}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-950">
                      {artist}
                    </span>
                    <span className="text-sm text-neutral-600">
                      {count} {count === 1 ? 'track' : 'tracks'} (
                      {Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-950 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

