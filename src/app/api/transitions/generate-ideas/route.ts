import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  TransitionIdeaGenerationError,
  generateTransitionIdeas,
  type SpotifyTrackContext,
} from '@/lib/openai'
import { getAccessTokenForApi, searchSpotify } from '@/lib/spotify'

function mapSpotifyTrack(track: any): SpotifyTrackContext {
  return {
    name: track.name,
    artist: track.artists?.[0]?.name || 'Unknown',
    album: track.album?.name,
    duration: track.duration_ms,
    externalUrl: track.external_urls?.spotify,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    let spotifyTracks: SpotifyTrackContext[] = []

    try {
      const cookieStore = await cookies()
      const cookieToken = cookieStore.get('spotify_access_token')?.value
      const accessToken = await getAccessTokenForApi(cookieToken, true)
      const results = await searchSpotify(prompt, accessToken, { limit: 8 })
      spotifyTracks = results.tracks.map(mapSpotifyTrack)
    } catch (spotifyError) {
      console.warn('Transition idea Spotify context unavailable:', spotifyError)
    }

    let ideas
    try {
      ideas = await generateTransitionIdeas({
        prompt,
        spotifyTracks,
      })
    } catch (error) {
      if (error instanceof TransitionIdeaGenerationError) {
        return NextResponse.json(
          { error: error.message },
          { status: 502 }
        )
      }

      throw error
    }

    return NextResponse.json({
      ideas,
      spotifyContextUsed: spotifyTracks.length > 0,
    })
  } catch (error) {
    console.error('Generate transition ideas error:', error)
    return NextResponse.json(
      { error: 'Failed to generate transition ideas' },
      { status: 500 }
    )
  }
}
