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
export async function searchSpotify(query: string, accessToken: string, limit = 10) {
  const client = getSpotifyClient(accessToken)
  const results = await client.search(query, ['track', 'artist'], { limit })
  
  return {
    tracks: results.body.tracks?.items || [],
    artists: results.body.artists?.items || [],
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
  const client = getSpotifyClient(accessToken)
  const me = await client.getMe()
  const playlist = await client.createPlaylist(me.body.id, name, {
    public: isPublic,
    description,
  })
  return playlist.body
}

export async function addTracksToSpotifyPlaylist(
  accessToken: string,
  playlistId: string,
  trackIds: string[]
) {
  const client = getSpotifyClient(accessToken)
  const uris = trackIds
    .map((id) => (id.startsWith('spotify:track:') ? id : `spotify:track:${id}`))
    .filter(Boolean)

  if (uris.length === 0) return
  await client.addTracksToPlaylist(playlistId, uris)
}













