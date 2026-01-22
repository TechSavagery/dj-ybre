const RECCOBEATS_BASE_URL = 'https://api.reccobeats.com/v1'

export type ReccoBeatsAudioFeatures = {
  // Documented by ReccoBeats as 0..1 floats unless noted
  tempo?: number | null // BPM
  danceability?: number | null
  energy?: number | null
  valence?: number | null
  acousticness?: number | null
  speechiness?: number | null
  loudness?: number | null // dB
  instrumentalness?: number | null
  liveness?: number | null
}

export type ReccoBeatsTrack = {
  id: string // ReccoBeats ID (UUID)
  // Many endpoints accept Spotify IDs as "ids" as well; when you pass Spotify IDs,
  // ReccoBeats will return the track record if it can map it.
  // Some responses include provider IDs—keep this flexible.
  [key: string]: any
}

function tryExtractSpotifyId(track: any): string | null {
  const candidates = [
    track?.spotifyId,
    track?.spotify_id,
    track?.href, // often "https://open.spotify.com/track/<id>"
    track?.external_ids?.spotify,
    track?.externalIds?.spotify,
    track?.provider_ids?.spotify,
    track?.providerIds?.spotify,
    track?.ids?.spotify,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) {
      // Extract track id from Spotify URL if needed
      const m =
        c.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/) ||
        c.match(/spotify:track:([A-Za-z0-9]+)/)
      if (m?.[1]) return m[1]
      return c
    }
  }
  return null
}

function getApiToken(): string | null {
  // ReccoBeats docs indicate no auth required, but allow optional token if provided.
  return process.env.RECCOBEATS_API_KEY || process.env.RECCOBEATS_TOKEN || null
}

export function isReccoBeatsConfigured(): boolean {
  // No auth required per ReccoBeats docs; always "configured".
  return true
}

async function reccoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getApiToken()

  const res = await fetch(`${RECCOBEATS_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/json',
    },
    // ReccoBeats is a 3rd-party API; never cache in Next route handlers by default.
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`ReccoBeats API error ${res.status}: ${text || res.statusText}`)
  }

  return (await res.json()) as T
}

/**
 * Resolve one or more track IDs via ReccoBeats.
 * Docs indicate `/v1/track?ids=...` accepts both ReccoBeats IDs and Spotify IDs.
 */
export async function getReccoBeatsTracksByIds(ids: string[]): Promise<ReccoBeatsTrack[]> {
  if (ids.length === 0) return []
  const qs = new URLSearchParams()
  qs.set('ids', ids.join(','))

  // Response shape varies; normalize to an array.
  const data = await reccoFetch<any>(`/track?${qs.toString()}`)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.tracks)) return data.tracks
  if (Array.isArray(data?.content)) return data.content
  return []
}

/**
 * Map Spotify track IDs -> ReccoBeats track IDs (best-effort).
 * ReccoBeats `/v1/track?ids=...` accepts Spotify IDs, but response shapes vary.
 */
export async function resolveReccoBeatsIdsFromSpotifyIds(
  spotifyIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (spotifyIds.length === 0) return map

  const tracks = await getReccoBeatsTracksByIds(spotifyIds)

  // Best case: response includes spotify id fields
  for (const t of tracks) {
    const sid = tryExtractSpotifyId(t)
    if (sid && typeof t?.id === 'string') {
      map.set(sid, t.id)
    }
  }

  // Fallback: if lengths match, assume order corresponds to request order
  if (map.size === 0 && tracks.length === spotifyIds.length) {
    for (let i = 0; i < spotifyIds.length; i++) {
      const t = tracks[i]
      if (t?.id) map.set(spotifyIds[i], t.id)
    }
  }

  return map
}

/**
 * Bulk audio-features endpoint (ReccoBeats IDs).
 * If the API returns a wrapped response, we normalize to an array.
 */
export async function getReccoBeatsAudioFeaturesByTrackIds(
  reccoTrackIds: string[]
): Promise<Array<{ id?: string; trackId?: string; track_id?: string } & ReccoBeatsAudioFeatures>> {
  if (reccoTrackIds.length === 0) return []
  const qs = new URLSearchParams()
  qs.set('ids', reccoTrackIds.join(','))
  const data = await reccoFetch<any>(`/audio-features?${qs.toString()}`)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.audioFeatures)) return data.audioFeatures
  if (Array.isArray(data?.content)) return data.content
  return []
}

export async function getReccoBeatsTrackAudioFeatures(
  reccoTrackId: string
): Promise<ReccoBeatsAudioFeatures | null> {
  if (!reccoTrackId) return null
  const data = await reccoFetch<any>(`/track/${encodeURIComponent(reccoTrackId)}/audio-features`)
  // Some docs wrap the object; normalize
  const features = data?.data ?? data
  return features && typeof features === 'object' ? (features as ReccoBeatsAudioFeatures) : null
}

