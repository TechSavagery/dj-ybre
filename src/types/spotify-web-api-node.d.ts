declare module 'spotify-web-api-node' {
  interface SpotifyWebApiOptions {
    clientId?: string
    clientSecret?: string
    redirectUri?: string
    accessToken?: string
    refreshToken?: string
  }

  interface AuthorizationCodeGrantResponse {
    body: {
      access_token: string
      refresh_token: string
      expires_in: number
      token_type: string
      scope: string
    }
  }

  interface RefreshAccessTokenResponse {
    body: {
      access_token: string
      expires_in: number
      token_type: string
      scope: string
    }
  }

  interface ClientCredentialsGrantResponse {
    body: {
      access_token: string
      token_type: string
      expires_in: number
    }
  }

  interface SearchResponse {
    body: {
      tracks?: {
        items: any[]
      }
      artists?: {
        items: any[]
      }
    }
  }

  interface AudioFeaturesResponse {
    body: {
      audio_features: Array<any | null>
    }
  }

  interface TrackResponse {
    body: any
  }

  interface ArtistsResponse {
    body: {
      artists: any[]
    }
  }

  interface RecommendationsResponse {
    body: {
      tracks: any[]
    }
  }

  export default class SpotifyWebApi {
    constructor(options?: SpotifyWebApiOptions)
    setAccessToken(token: string): void
    setRefreshToken(token: string): void
    createAuthorizeURL(scopes: string[], state?: string): string
    authorizationCodeGrant(code: string): Promise<AuthorizationCodeGrantResponse>
    refreshAccessToken(): Promise<RefreshAccessTokenResponse>
    clientCredentialsGrant(): Promise<ClientCredentialsGrantResponse>
    search(query: string, types: string[], options?: { limit?: number }): Promise<SearchResponse>
    getAudioFeaturesForTracks(trackIds: string[]): Promise<AudioFeaturesResponse>
    getTrack(trackId: string): Promise<TrackResponse>
    getTracks(trackIds: string[]): Promise<any>
    getArtists(artistIds: string[]): Promise<ArtistsResponse>
    getRecommendations(options: any): Promise<RecommendationsResponse>
  }
}
