import SpotifyWebApi from 'spotify-web-api-node'
import {
  getReccoBeatsAudioFeaturesByTrackIds,
  resolveReccoBeatsIdsFromSpotifyIds,
} from './reccobeats'

// Token cache to store tokens and their expiration times
interface TokenCache {
  accessToken: string
  expiresAt: number // Unix timestamp in milliseconds
  tokenType: 'refresh' | 'client_credentials'
}

let tokenCache: TokenCache | null = null

// Check if a token is expired (with 60 second buffer to refresh before expiration)
function isTokenExpired(token: TokenCache | null): boolean {
  if (!token) return true
  // Refresh 60 seconds before expiration to avoid race conditions
  return Date.now() >= token.expiresAt - 60000
}

// Initialize Spotify API client
export function getSpotifyClient(accessToken?: string) {
  const config: {
    clientId: string
    clientSecret: string
    redirectUri?: string
  } = {
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  }

  // Redirect URI is only needed for OAuth flows, not Client Credentials
  if (process.env.SPOTIFY_REDIRECT_URI) {
    config.redirectUri = process.env.SPOTIFY_REDIRECT_URI
  }

  const client = new SpotifyWebApi(config)

  if (accessToken) {
    client.setAccessToken(accessToken)
  }

  return client
}

// Generate authorization URL for OAuth
export function getAuthorizationUrl(state?: string) {
  if (!process.env.SPOTIFY_REDIRECT_URI) {
    throw new Error('SPOTIFY_REDIRECT_URI is required for OAuth flows')
  }
  
  const client = getSpotifyClient()
  const scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
  ]

  return client.createAuthorizeURL(scopes, state)
}

// Exchange authorization code for access token
export async function getAccessToken(code: string) {
  if (!process.env.SPOTIFY_REDIRECT_URI) {
    throw new Error('SPOTIFY_REDIRECT_URI is required for OAuth flows')
  }
  
  const client = getSpotifyClient()
  const data = await client.authorizationCodeGrant(code)
  return {
    accessToken: data.body.access_token,
    refreshToken: data.body.refresh_token,
    expiresIn: data.body.expires_in,
  }
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string) {
  const client = getSpotifyClient()
  client.setRefreshToken(refreshToken)
  try {
    const data = await client.refreshAccessToken()
    const expiresIn = data.body.expires_in || 3600 // Default to 1 hour if not provided
    
    // Cache the token with expiration time
    tokenCache = {
      accessToken: data.body.access_token,
      expiresAt: Date.now() + (expiresIn * 1000), // Convert seconds to milliseconds
      tokenType: 'refresh',
    }
    
    return {
      accessToken: data.body.access_token,
      expiresIn: expiresIn,
    }
  } catch (error: any) {
    console.error('Error refreshing access token:', {
      status: error?.statusCode,
      message: error?.message,
      body: error?.body,
    })
    // Clear cache on error
    tokenCache = null
    throw new Error(`Failed to refresh access token: ${error?.message || 'Unknown error'}`)
  }
}

// Get client credentials token (for server-to-server requests)
// This doesn't require user authorization and is useful for accessing public Spotify data
export async function getClientCredentialsToken() {
  const client = getSpotifyClient()
  const data = await client.clientCredentialsGrant()
  const expiresIn = data.body.expires_in || 3600 // Default to 1 hour if not provided
  
  // Cache the token with expiration time
  tokenCache = {
    accessToken: data.body.access_token,
    expiresAt: Date.now() + (expiresIn * 1000), // Convert seconds to milliseconds
    tokenType: 'client_credentials',
  }
  
  return {
    accessToken: data.body.access_token,
    expiresIn: expiresIn,
    tokenType: data.body.token_type,
  }
}

// Get access token using refresh token from environment
// This uses the stored refresh token to get a new access token
// Tokens are cached and automatically refreshed when expired
export async function getTokenFromRefreshToken() {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN
  if (!refreshToken) {
    throw new Error('SPOTIFY_REFRESH_TOKEN is not set in environment variables')
  }
  
  // Check if cached token is still valid
  if (tokenCache && tokenCache.tokenType === 'refresh' && !isTokenExpired(tokenCache)) {
    return {
      accessToken: tokenCache.accessToken,
      expiresIn: Math.round((tokenCache.expiresAt - Date.now()) / 1000),
    }
  }
  
  try {
    return await refreshAccessToken(refreshToken)
  } catch (error) {
    console.error('Failed to get token from refresh token:', error)
    throw error
  }
}

// Get a user-scoped access token (no client credentials fallback)
export async function getUserAccessToken(cookieToken?: string | null) {
  if (cookieToken) {
    return cookieToken
  }
  const tokenData = await getTokenFromRefreshToken()
  return tokenData.accessToken
}

// Get access token - tries cookie first, then falls back to refresh token from env
// This is useful for API endpoints that need Spotify authentication
// Automatically refreshes tokens when they expire
// For public endpoints (tracks, audio features, artists), prefers client credentials
export async function getAccessTokenForApi(
  cookieToken?: string | null,
  preferClientCredentials = false
): Promise<string> {
  // First, try to use the cookie token if provided (user OAuth token)
  // Cookie tokens are managed by the user's session, so we don't cache them
  if (cookieToken) {
    return cookieToken
  }
  
  // For public endpoints, prefer client credentials (more reliable for public data)
  if (preferClientCredentials) {
    // Check if we have a valid cached client credentials token
    if (tokenCache && tokenCache.tokenType === 'client_credentials' && !isTokenExpired(tokenCache)) {
      console.log(`Using cached client credentials token (expires in ${Math.round((tokenCache.expiresAt - Date.now()) / 1000)}s)`)
      return tokenCache.accessToken
    }
    
    try {
      const clientToken = await getClientCredentialsToken()
      console.log(`Got new access token from client credentials (expires in ${clientToken.expiresIn}s)`)
      return clientToken.accessToken
    } catch (clientError) {
      console.error('Client credentials failed, trying refresh token:', clientError)
      // Fall back to refresh token if client credentials fails
    }
  }
  
  // Check if we have a valid cached token
  if (tokenCache && !isTokenExpired(tokenCache)) {
    console.log(
      `Using cached ${tokenCache.tokenType} token (expires in ${Math.round(
        (tokenCache.expiresAt - Date.now()) / 1000
      )}s)`
    )
    return tokenCache.accessToken
  }
  
  // Token expired or doesn't exist, get a new one
  if (tokenCache) {
    console.log(`Cached ${tokenCache.tokenType} token expired, refreshing...`)
  }
  
  // Try refresh token from environment first
  try {
    const tokenData = await getTokenFromRefreshToken()
    console.log(`Got new access token from refresh token (expires in ${tokenData.expiresIn}s)`)
    return tokenData.accessToken
  } catch (error) {
    // If refresh token fails, try client credentials as last resort
    console.warn('Refresh token failed, trying client credentials:', error)
    try {
      const clientToken = await getClientCredentialsToken()
      console.log(`Got new access token from client credentials (expires in ${clientToken.expiresIn}s)`)
      return clientToken.accessToken
    } catch (clientError) {
      // Clear cache on error
      tokenCache = null
      throw new Error(`Failed to get access token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Search for tracks and artists
export async function searchSpotify(
  query: string,
  accessToken: string,
  options: number | { limit?: number; nonExplicit?: boolean } = 10
) {
  const limit = typeof options === 'number' ? options : (options.limit ?? 10)
  const nonExplicit = typeof options === 'number' ? false : Boolean(options.nonExplicit)

  const client = getSpotifyClient(accessToken)

  // If we need non-explicit tracks, fetch more candidates so we can filter down
  // to clean versions while still returning up to `limit` results.
  const searchLimit = nonExplicit ? Math.min(Math.max(limit * 4, limit), 50) : limit
  const results = await client.search(query, ['track', 'artist'], { limit: searchLimit })

  const rawTracks = results.body.tracks?.items || []
  const rawArtists = results.body.artists?.items || []

  const tracks = nonExplicit
    ? rawTracks.filter((t: any) => t && t.explicit === false).slice(0, limit)
    : rawTracks.slice(0, limit)

  return {
    tracks,
    artists: rawArtists,
  }
}

// Get track audio features
// NOTE: Spotify audio-features/audio-analysis endpoints are no longer called.
// We use ReccoBeats for tempo/energy/danceability/valence and return a Spotify-shaped subset.
export async function getAudioFeatures(trackIds: string[], _accessToken: string) {
  if (trackIds.length === 0) return []

  try {
    const reccoIdMap = await resolveReccoBeatsIdsFromSpotifyIds(trackIds)
    const reccoIds = trackIds
      .map((sid) => reccoIdMap.get(sid))
      .filter((v): v is string => Boolean(v))

    const reccoFeatures = await getReccoBeatsAudioFeaturesByTrackIds(reccoIds)

    const byReccoId = new Map<string, any>()
    for (const f of reccoFeatures) {
      const id = (f as any)?.id || (f as any)?.trackId || (f as any)?.track_id
      if (typeof id === 'string') byReccoId.set(id, f)
    }

    return trackIds.map((spotifyId) => {
      const reccoId = reccoIdMap.get(spotifyId) || null
      const f = reccoId ? byReccoId.get(reccoId) : null

      return {
        id: spotifyId,
        tempo: f?.tempo ?? null,
        energy: f?.energy ?? null,
        danceability: f?.danceability ?? null,
        valence: f?.valence ?? null,
        acousticness: f?.acousticness ?? null,
        instrumentalness: f?.instrumentalness ?? null,
        loudness: f?.loudness ?? null,
        speechiness: f?.speechiness ?? null,
        liveness: f?.liveness ?? null,
        // ReccoBeats audio-features does not provide key/mode/time signature.
        key: null,
        mode: null,
        time_signature: null,
        // keep extras for downstream optional use
        _reccoBeatsId: reccoId,
        _reccoBeats: f ?? null,
      }
    })
  } catch (fallbackError) {
    console.error('ReccoBeats audio features lookup failed:', fallbackError)
    return trackIds.map((id) => ({
      id,
      tempo: null,
      energy: null,
      danceability: null,
      valence: null,
      acousticness: null,
      instrumentalness: null,
      loudness: null,
      speechiness: null,
      liveness: null,
      key: null,
      mode: null,
      time_signature: null,
      _reccoBeatsId: null,
      _reccoBeats: null,
    }))
  }
}

// Get recommendations based on seed tracks/artists
export async function getRecommendations(
  accessToken: string,
  options: {
    seedTracks?: string[]
    seedArtists?: string[]
    seedGenres?: string[]
    limit?: number
    minEnergy?: number
    maxEnergy?: number
    minTempo?: number
    maxTempo?: number
  }
) {
  const client = getSpotifyClient(accessToken)
  const recommendations = await client.getRecommendations({
    seed_tracks: options.seedTracks?.slice(0, 5),
    seed_artists: options.seedArtists?.slice(0, 5),
    seed_genres: options.seedGenres?.slice(0, 5),
    limit: options.limit || 20,
    min_energy: options.minEnergy,
    max_energy: options.maxEnergy,
    min_tempo: options.minTempo,
    max_tempo: options.maxTempo,
  })
  
  return recommendations.body.tracks
}

// Get track details
export async function getTrack(trackId: string, accessToken: string) {
  const client = getSpotifyClient(accessToken)
  const track = await client.getTrack(trackId)
  return track.body
}

// Get multiple tracks
export async function getTracks(trackIds: string[], accessToken: string) {
  const client = getSpotifyClient(accessToken)
  const tracks = await client.getTracks(trackIds)
  return tracks.body.tracks
}

// Get multiple artists (useful for genres)
export async function getArtists(artistIds: string[], accessToken: string) {
  const client = getSpotifyClient(accessToken)
  const artists = await client.getArtists(artistIds)
  return artists.body.artists
}

export async function createSpotifyPlaylist(
  accessToken: string,
  name: string,
  description?: string,
  isPublic = false
) {
  // NOTE: We intentionally use direct HTTP calls for playlist operations.
  // `spotify-web-api-node` has been observed to crash Next route handlers in dev
  // (superagent callback errors). Plain fetch is more reliable here.
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }

  const meRes = await fetch('https://api.spotify.com/v1/me', { headers })
  if (!meRes.ok) {
    const text = await meRes.text().catch(() => '')
    throw new Error(`Spotify getMe failed: ${meRes.status} ${text}`)
  }
  const me = (await meRes.json()) as { id: string }

  const createRes = await fetch(
    `https://api.spotify.com/v1/users/${encodeURIComponent(me.id)}/playlists`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name,
        public: isPublic,
        collaborative: false,
        description,
      }),
    }
  )

  if (createRes.status !== 201) {
    const text = await createRes.text().catch(() => '')
    throw new Error(`Spotify createPlaylist failed: ${createRes.status} ${text}`)
  }

  return (await createRes.json()) as any
}

export async function addTracksToSpotifyPlaylist(
  accessToken: string,
  playlistId: string,
  trackIds: string[]
) {
  const uris = trackIds
    .map((id) => (id.startsWith('spotify:track:') ? id : `spotify:track:${id}`))
    .filter(Boolean)

  if (uris.length === 0) return

  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/tracks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris }),
    }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Spotify addTracks failed: ${res.status} ${text}`)
  }
}

export async function removeTracksFromSpotifyPlaylist(
  accessToken: string,
  playlistId: string,
  trackIds: string[]
) {
  const uris = trackIds
    .map((id) => (id.startsWith('spotify:track:') ? id : `spotify:track:${id}`))
    .filter(Boolean)

  if (uris.length === 0) return

  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/tracks`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tracks: uris.map((uri) => ({ uri })),
      }),
    }
  )

  // Spotify returns 200 OK with a snapshot_id on success.
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Spotify removeTracks failed: ${res.status} ${text}`)
  }
}

// Spotify "deleting" a playlist is effectively unfollowing it.
export async function unfollowSpotifyPlaylist(accessToken: string, playlistId: string) {
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/followers`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  // Spotify returns 200 OK on success.
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Spotify unfollow playlist failed: ${res.status} ${text}`)
  }
}













