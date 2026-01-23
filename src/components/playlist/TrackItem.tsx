'use client'

import { HeartIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { SpotifyPlayOverlayImage } from '@/components/SpotifyPlayOverlayImage'

interface TrackItemProps {
  track: {
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
  }
  onHeart: (trackId: string) => void
  onRemove: (trackId: string) => void
  onRestore?: (trackId: string) => void
}

export function TrackItem({
  track,
  onHeart,
  onRemove,
  onRestore,
}: TrackItemProps) {
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (track.isRemoved) {
    return (
      <div className="flex items-center gap-4 p-3 bg-neutral-100 rounded-lg opacity-60">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-600 line-through">
            {track.name}
          </p>
          <p className="text-xs text-neutral-500">{track.artist}</p>
        </div>
        {onRestore && (
          <button
            onClick={() => onRestore(track.id)}
            className="px-3 py-1 text-xs text-neutral-600 hover:text-neutral-950"
          >
            Restore
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
      {track.order !== undefined && (
        <div className="w-8 text-sm text-neutral-500 font-mono">
          {track.order + 1}
        </div>
      )}
      {track.imageUrl && (
        <SpotifyPlayOverlayImage
          src={track.imageUrl}
          alt={track.album || track.name}
          href={track.externalUrl}
          spotifyUri={track.spotifyId ? `spotify:track:${track.spotifyId}` : undefined}
          size={48}
          className="w-12 h-12 rounded"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-950 truncate">
          {track.name}
        </p>
        <p className="text-xs text-neutral-600 truncate">{track.artist}</p>
        {track.album && (
          <p className="text-xs text-neutral-500 truncate">{track.album}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-500">
          {formatDuration(track.duration)}
        </span>
        <button
          onClick={() => onHeart(track.id)}
          className={`p-2 rounded transition-colors ${
            track.isHearted
              ? 'text-red-600 hover:text-red-700'
              : 'text-neutral-400 hover:text-neutral-950'
          }`}
        >
          {track.isHearted ? (
            <HeartIconSolid className="w-5 h-5" />
          ) : (
            <HeartIcon className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={() => onRemove(track.id)}
          className="p-2 text-neutral-400 hover:text-red-600 rounded transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        {track.externalUrl && (
          <a
            href={track.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-neutral-400 hover:text-neutral-950 rounded transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </a>
        )}
      </div>
    </div>
  )
}













