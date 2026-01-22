'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { HeartIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Track {
  id: string
  name: string
  artist: string
  album?: string
  albumImage?: string
  previewUrl?: string
}

interface Artist {
  id: string
  name: string
  image?: string
  genres?: string[]
}

interface InspirationSearchProps {
  onTracksChange: (tracks: Track[]) => void
  onArtistsChange: (artists: Artist[]) => void
}

export function InspirationSearch({
  onTracksChange,
  onArtistsChange,
}: InspirationSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ tracks: Track[]; artists: Artist[] }>({
    tracks: [],
    artists: [],
  })
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([])
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(false)

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ tracks: [], artists: [] })
      return
    }

    const timeoutId = setTimeout(() => {
      searchSpotify(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const searchSpotify = async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      )
      if (response.ok) {
        const data = await response.json()
        setResults({
          tracks: data.tracks || [],
          artists: data.artists || [],
        })
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTrack = (track: Track) => {
    if (!selectedTracks.find((t) => t.id === track.id)) {
      const newTracks = [...selectedTracks, track]
      setSelectedTracks(newTracks)
      onTracksChange(newTracks)
    }
  }

  const removeTrack = (trackId: string) => {
    const newTracks = selectedTracks.filter((t) => t.id !== trackId)
    setSelectedTracks(newTracks)
    onTracksChange(newTracks)
  }

  const addArtist = (artist: Artist) => {
    if (!selectedArtists.find((a) => a.id === artist.id)) {
      const newArtists = [...selectedArtists, artist]
      setSelectedArtists(newArtists)
      onArtistsChange(newArtists)
    }
  }

  const removeArtist = (artistId: string) => {
    const newArtists = selectedArtists.filter((a) => a.id !== artistId)
    setSelectedArtists(newArtists)
    onArtistsChange(newArtists)
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Search for Artists or Songs
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search..."
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
        />
        {loading && (
          <p className="mt-2 text-sm text-neutral-500">Searching...</p>
        )}
      </div>

      {/* Search Results */}
      {query && results.tracks.length === 0 && results.artists.length === 0 && !loading && (
        <p className="text-sm text-neutral-500">No results found</p>
      )}

      {results.tracks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Tracks</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {results.tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded cursor-pointer"
                onClick={() => addTrack(track)}
              >
                {track.albumImage && (
                  <Image
                    src={track.albumImage}
                    alt={track.album || track.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded"
                    unoptimized
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-950 truncate">
                    {track.name}
                  </p>
                  <p className="text-xs text-neutral-600 truncate">
                    {track.artist}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addTrack(track)
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-950"
                >
                  <HeartIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.artists.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Artists</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {results.artists.map((artist) => (
              <div
                key={artist.id}
                className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded cursor-pointer"
                onClick={() => addArtist(artist)}
              >
                {artist.image && (
                  <Image
                    src={artist.image}
                    alt={artist.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full"
                    unoptimized
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-950 truncate">
                    {artist.name}
                  </p>
                  {artist.genres && artist.genres.length > 0 && (
                    <p className="text-xs text-neutral-600 truncate">
                      {artist.genres.slice(0, 2).join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addArtist(artist)
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-950"
                >
                  <HeartIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Items */}
      {(selectedTracks.length > 0 || selectedArtists.length > 0) && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">
            Selected Inspiration
          </h3>
          <div className="space-y-2">
            {selectedTracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-2 bg-neutral-50 rounded"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-950 truncate">
                    {track.name}
                  </p>
                  <p className="text-xs text-neutral-600 truncate">
                    {track.artist}
                  </p>
                </div>
                <button
                  onClick={() => removeTrack(track.id)}
                  className="p-1 text-neutral-400 hover:text-red-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
            {selectedArtists.map((artist) => (
              <div
                key={artist.id}
                className="flex items-center gap-3 p-2 bg-neutral-50 rounded"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-950 truncate">
                    {artist.name}
                  </p>
                  <p className="text-xs text-neutral-600">Artist</p>
                </div>
                <button
                  onClick={() => removeArtist(artist.id)}
                  className="p-1 text-neutral-400 hover:text-red-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}













