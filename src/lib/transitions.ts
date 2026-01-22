import { getSpotifyClient, getTracks, getAudioFeatures } from './spotify'
import { db } from './db'
import type { Prisma } from '@prisma/client'

/**
 * These Spotify API endpoints are PUBLIC and should work with client credentials:
 * - getTrack() - Public track information
 * - getAudioFeatures() - Public audio analysis
 * - getArtists() - Public artist information
 * 
 * If you're getting 403 errors, it might mean:
 * 1. The refresh token is invalid/expired
 * 2. The token doesn't have the right scopes
 * 3. Client credentials should be used instead for these public endpoints
 */

/**
 * Fetch complete track metadata from Spotify including audio features
 */
export async function fetchTrackMetadata(
  spotifyId: string,
  accessToken: string
): Promise<{
  name: string
  artist: string
  artists: Array<{ id: string; name: string }>
  album: string | null
  albumImage: string | null
  duration: number
  previewUrl: string | null
  externalUrl: string
  bpm: number | null
  key: number | null
  mode: number | null
  timeSignature: number | null
  energy: number | null
  danceability: number | null
  valence: number | null
  audioFeatures: any
  genres: string[]
  releaseDate: string | null
  popularity: number | null
}> {
  const client = getSpotifyClient(accessToken)

  // Get track details
  let trackData
  try {
    const track = await client.getTrack(spotifyId)
    trackData = track.body
  } catch (error: any) {
    console.error(`Error getting track ${spotifyId}:`, {
      status: error?.statusCode,
      message: error?.message,
      body: error?.body,
    })
    throw new Error(`Failed to get track from Spotify: ${error?.message || 'Unknown error'}`)
  }

  // Get audio features
  let audioFeatures = null
  try {
    const features = await getAudioFeatures([spotifyId], accessToken)
    audioFeatures = features?.[0] || null
  } catch (error: any) {
    console.error(`Error getting audio features for ${spotifyId}:`, {
      status: error?.statusCode,
      message: error?.message,
      body: error?.body,
    })
    // Don't throw - audio features are optional, continue without them
    console.warn('Continuing without audio features')
  }

  // Get artist details for genres
  let artistsData = null
  try {
    const artistIds = trackData.artists.map((a: any) => a.id)
    if (artistIds.length > 0) {
      artistsData = await client.getArtists(artistIds)
    }
  } catch (error: any) {
    console.error(`Error getting artists for track ${spotifyId}:`, {
      status: error?.statusCode,
      message: error?.message,
      body: error?.body,
    })
    // Don't throw - genres are optional, continue without them
    console.warn('Continuing without artist genres')
  }
  const allGenres: string[] = []
  if (artistsData?.body?.artists) {
    artistsData.body.artists.forEach((artist: any) => {
      if (artist.genres) {
        allGenres.push(...artist.genres)
      }
    })
  }
  // Remove duplicates
  const uniqueGenres = Array.from(new Set(allGenres))

  return {
    name: trackData.name,
    artist: trackData.artists[0]?.name || 'Unknown',
    artists: trackData.artists.map((a: any) => ({ id: a.id, name: a.name })),
    album: trackData.album?.name || null,
    albumImage: trackData.album?.images?.[0]?.url || null,
    duration: trackData.duration_ms,
    previewUrl: trackData.preview_url || null,
    externalUrl: trackData.external_urls.spotify,
    bpm: audioFeatures?.tempo || null,
    key: audioFeatures?.key ?? null,
    mode: audioFeatures?.mode ?? null,
    timeSignature: audioFeatures?.time_signature ?? null,
    energy: audioFeatures?.energy ?? null,
    danceability: audioFeatures?.danceability ?? null,
    valence: audioFeatures?.valence ?? null,
    audioFeatures: audioFeatures,
    genres: uniqueGenres,
    releaseDate: trackData.album?.release_date || null,
    popularity: trackData.popularity ?? null,
  }
}

/**
 * Generate default transition name from tracks
 */
export function generateTransitionName(tracks: Array<{ name: string; artist: string }>): string {
  if (tracks.length === 0) return 'Untitled Transition'
  if (tracks.length === 1) return `${tracks[0].name}`
  if (tracks.length === 2) {
    return `${tracks[0].name} → ${tracks[1].name}`
  }
  // For 3+ tracks, show first and last
  return `${tracks[0].name} → ... → ${tracks[tracks.length - 1].name}`
}

/**
 * Validate transition data
 */
export function validateTransitionData(data: {
  tracks: Array<{ spotifyId: string; position: number; fromTrackId?: string | null }>
  type: string | string[]
}) {
  const errors: string[] = []

  // Handle both single string and array for backward compatibility
  const types = Array.isArray(data.type) ? data.type : [data.type].filter(Boolean)
  
  if (types.length === 0 || types.every(t => !t || t.trim().length === 0)) {
    errors.push('At least one transition type is required')
  }

  // Validate each type is a valid transition type
  const invalidTypes = types.filter(t => t && !TRANSITION_TYPES.includes(t as TransitionType))
  if (invalidTypes.length > 0) {
    errors.push(`Invalid transition types: ${invalidTypes.join(', ')}`)
  }

  if (!data.tracks || data.tracks.length < 2) {
    errors.push('At least 2 tracks are required')
  }

  if (data.tracks.length > 4) {
    errors.push('Maximum 4 tracks allowed')
  }

  // Validate positions are unique and sequential
  const positions = data.tracks.map((t) => t.position).sort()
  const expectedPositions = Array.from({ length: data.tracks.length }, (_, i) => i + 1)
  if (JSON.stringify(positions) !== JSON.stringify(expectedPositions)) {
    errors.push('Track positions must be sequential starting from 1')
  }

  // Validate fromTrackId relationships
  for (const track of data.tracks) {
    if (track.position === 1 && track.fromTrackId) {
      errors.push('First track cannot have a fromTrackId')
    }
    if (track.position > 1 && !track.fromTrackId) {
      errors.push(`Track at position ${track.position} must have a fromTrackId`)
    }
    // Validate fromTrackId references a valid track
    if (track.fromTrackId) {
      const fromTrack = data.tracks.find((t) => t.spotifyId === track.fromTrackId)
      if (!fromTrack) {
        errors.push(`Track at position ${track.position} references invalid fromTrackId (${track.fromTrackId})`)
      } else if (fromTrack.position >= track.position) {
        errors.push(`Track at position ${track.position} cannot transition from track at position ${fromTrack.position} (must be earlier)`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Transition types enum
 */
export const TRANSITION_TYPES = [
  'beat_match',
  'word_play',
  'key_change',
  'drop_swap',
  'mashup',
  'backspin',
  'echo_out',
  'filter_sweep',
  'loop_swap',
  'phrase_match',
  'other',
] as const

export type TransitionType = typeof TRANSITION_TYPES[number]

