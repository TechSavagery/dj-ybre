import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { analyzePlaylistInteractions } from '@/lib/openai'
import { searchSpotify, getAudioFeatures } from '@/lib/spotify'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    const cookieStore = await cookies()
    const accessToken = cookieStore.get('spotify_access_token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Spotify' },
        { status: 401 }
      )
    }

    // Get session and tracks
    const session = await db.playlistSession.findUnique({
      where: { id: sessionId },
      include: {
        tracks: true,
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get hearted and removed tracks
    const heartedTracks = session.tracks.filter(t => t.isHearted && !t.isRemoved)
    const removedTracks = session.tracks.filter(t => t.isRemoved)

    if (heartedTracks.length === 0 && removedTracks.length === 0) {
      return NextResponse.json({
        message: 'No interactions to analyze',
        suggestions: [],
      })
    }

    // Analyze interactions with AI
    const analysis = await analyzePlaylistInteractions(
      heartedTracks.map(t => ({
        name: t.name,
        artist: t.artist,
        genres: t.genres as string[] | undefined,
      })),
      removedTracks.map(t => ({
        name: t.name,
        artist: t.artist,
        genres: t.genres as string[] | undefined,
      }))
    )

    // Search for replacement suggestions
    const replacementTracks: any[] = []
    for (const suggestion of analysis.suggestions.slice(0, 20)) {
      try {
        const results = await searchSpotify(suggestion, accessToken, 1)
        if (results.tracks.length > 0) {
          const track = results.tracks[0]
          // Check if track already exists in playlist
          const exists = session.tracks.some(t => t.spotifyId === track.id)
          if (!exists) {
            replacementTracks.push(track)
          }
        }
      } catch (error) {
        console.error(`Failed to search for "${suggestion}":`, error)
      }
    }

    // Get audio features for new tracks
    const trackIds = replacementTracks.map(t => t.id)
    const audioFeatures = await getAudioFeatures(trackIds, accessToken)
    const featuresMap = new Map(
      audioFeatures
        .filter((f): f is NonNullable<typeof f> => f !== null)
        .map(f => [f.id, f])
    )

    // Calculate current duration
    const activeTracks = session.tracks.filter(t => !t.isRemoved)
    const currentDuration = activeTracks.reduce((sum, t) => sum + t.duration, 0) / 1000
    const remainingDuration = session.targetDuration - currentDuration

    // Filter replacements to fit remaining duration
    const filteredReplacements: any[] = []
    let addedDuration = 0

    for (const track of replacementTracks) {
      const duration = track.duration_ms / 1000
      if (addedDuration + duration <= remainingDuration * 1.1) {
        filteredReplacements.push(track)
        addedDuration += duration
      }
    }

    // Return suggestions (don't add to playlist yet - let user choose)
    return NextResponse.json({
      preferences: analysis.preferences,
      suggestions: filteredReplacements.map(track => {
        const features = featuresMap.get(track.id)
        return {
          spotifyId: track.id,
          name: track.name,
          artist: track.artists[0]?.name || 'Unknown',
          album: track.album?.name,
          duration: track.duration_ms,
          previewUrl: track.preview_url,
          imageUrl: track.album?.images[0]?.url,
          externalUrl: track.external_urls?.spotify,
          audioFeatures: features
            ? {
                bpm: features.tempo,
                energy: features.energy,
                valence: features.valence,
                danceability: features.danceability,
              }
            : null,
        }
      }),
    })
  } catch (error) {
    console.error('Refine playlist error:', error)
    return NextResponse.json(
      { error: 'Failed to refine playlist' },
      { status: 500 }
    )
  }
}













