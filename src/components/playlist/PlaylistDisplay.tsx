'use client'

import { useState, useEffect } from 'react'
import { TrackItem } from './TrackItem'

interface Track {
  id: string
  spotifyId: string
  name: string
  artist: string
  album?: string
  duration: number
  previewUrl?: string
  imageUrl?: string
  externalUrl?: string
  isHearted: boolean
  isRemoved: boolean
  order?: number
  audioFeatures?: any
  genres?: string[]
}

interface PlaylistDisplayProps {
  sessionId: string
  tracks: Track[]
  targetDuration: number
  onTracksChange: (tracks: Track[]) => void
}

export function PlaylistDisplay({
  sessionId,
  tracks,
  targetDuration,
  onTracksChange,
}: PlaylistDisplayProps) {
  const [localTracks, setLocalTracks] = useState<Track[]>(tracks)

  useEffect(() => {
    setLocalTracks(tracks)
  }, [tracks])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const totalDuration = localTracks
    .filter((t) => !t.isRemoved)
    .reduce((sum, t) => sum + t.duration, 0) / 1000

  const activeTracks = localTracks.filter((t) => !t.isRemoved)
  const removedTracks = localTracks.filter((t) => t.isRemoved)

  const updateTrack = async (trackId: string, action: string) => {
    // Optimistic update
    const updatedTracks = localTracks.map((t) => {
      if (t.id === trackId) {
        if (action === 'heart') {
          return { ...t, isHearted: true, isRemoved: false }
        } else if (action === 'unheart') {
          return { ...t, isHearted: false }
        } else if (action === 'remove') {
          return { ...t, isRemoved: true, isHearted: false }
        } else if (action === 'restore') {
          return { ...t, isRemoved: false }
        }
      }
      return t
    })
    setLocalTracks(updatedTracks)
    onTracksChange(updatedTracks)

    // Update server
    try {
      await fetch(`/api/playlist/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, action }),
      })
    } catch (error) {
      console.error('Failed to update track:', error)
      // Revert on error
      setLocalTracks(localTracks)
      onTracksChange(localTracks)
    }
  }

  const handleHeart = (trackId: string) => {
    const track = localTracks.find((t) => t.id === trackId)
    if (track?.isHearted) {
      updateTrack(trackId, 'unheart')
    } else {
      updateTrack(trackId, 'heart')
    }
  }

  const handleRemove = (trackId: string) => {
    updateTrack(trackId, 'remove')
  }

  const handleRestore = (trackId: string) => {
    updateTrack(trackId, 'restore')
  }

  return (
    <div className="space-y-6">
      {/* Duration Summary */}
      <div className="bg-neutral-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600">Current Duration</p>
            <p className="text-2xl font-semibold text-neutral-950">
              {formatDuration(totalDuration)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-600">Target Duration</p>
            <p className="text-2xl font-semibold text-neutral-950">
              {formatDuration(targetDuration)}
            </p>
          </div>
        </div>
        <div className="mt-2">
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-950 transition-all"
              style={{
                width: `${Math.min((totalDuration / targetDuration) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Active Tracks */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-950 mb-4">
          Playlist ({activeTracks.length} tracks)
        </h3>
        <div className="space-y-2">
          {activeTracks.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">
              No tracks in playlist
            </p>
          ) : (
            activeTracks
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((track) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  onHeart={handleHeart}
                  onRemove={handleRemove}
                />
              ))
          )}
        </div>
      </div>

      {/* Removed Tracks */}
      {removedTracks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-950 mb-4">
            Removed ({removedTracks.length})
          </h3>
          <div className="space-y-2">
            {removedTracks.map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                onHeart={handleHeart}
                onRemove={handleRemove}
                onRestore={handleRestore}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}













