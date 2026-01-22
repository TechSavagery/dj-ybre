import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { generatePlaylistSuggestions, type PlaylistContext } from '@/lib/openai'
import { searchSpotify, getRecommendations, getAudioFeatures, getTracks } from '@/lib/spotify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      eventType,
      playlistDuration,
      graduationYear1,
      graduationYear2,
      hometown1,
      hometown2,
      college1,
      college2,
      lastConcert1,
      lastConcert2,
      lastConcert3,
      eventDescription,
      inspirationTracks = [],
      inspirationArtists = [],
    } = body

    const cookieStore = await cookies()
    const accessToken = cookieStore.get('spotify_access_token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Spotify' },
        { status: 401 }
      )
    }

    // Create playlist session
    const targetDuration = playlistDuration * 60 // Convert minutes to seconds
    const session = await db.playlistSession.create({
      data: {
        eventType,
        playlistDuration,
        graduationYear1,
        graduationYear2,
        hometown1,
        hometown2,
        college1,
        college2,
        lastConcert1,
        lastConcert2,
        lastConcert3,
        eventDescription,
        inspirationTracks: inspirationTracks.length > 0 ? inspirationTracks : null,
        inspirationArtists: inspirationArtists.length > 0 ? inspirationArtists : null,
        targetDuration,
      },
    })

    // Generate AI suggestions
    const context: PlaylistContext = {
      eventType,
      playlistDuration,
      graduationYear1,
      graduationYear2,
      hometown1,
      hometown2,
      college1,
      college2,
      lastConcert1,
      lastConcert2,
      lastConcert3,
      eventDescription,
      inspirationTracks,
      inspirationArtists,
    }

    const aiSuggestions = await generatePlaylistSuggestions(context, playlistDuration)

    // Search Spotify for AI suggestions
    const foundTracks: any[] = []
    for (const suggestion of aiSuggestions.slice(0, 50)) {
      try {
        const results = await searchSpotify(suggestion, accessToken, 1)
        if (results.tracks.length > 0) {
          foundTracks.push(results.tracks[0])
        }
      } catch (error) {
        console.error(`Failed to search for "${suggestion}":`, error)
      }
    }

    // Get recommendations from Spotify using inspiration tracks/artists
    let spotifyRecommendations: any[] = []
    if (inspirationTracks.length > 0 || inspirationArtists.length > 0) {
      try {
        spotifyRecommendations = await getRecommendations(accessToken, {
          seedTracks: inspirationTracks.slice(0, 5),
          seedArtists: inspirationArtists.slice(0, 5),
          limit: 30,
        })
      } catch (error) {
        console.error('Failed to get Spotify recommendations:', error)
      }
    }

    // Combine and deduplicate tracks
    const allTracks = [...foundTracks, ...spotifyRecommendations]
    const uniqueTracks = new Map<string, any>()
    
    for (const track of allTracks) {
      if (!uniqueTracks.has(track.id)) {
        uniqueTracks.set(track.id, track)
      }
    }

    // Get audio features for tracks
    const trackIds = Array.from(uniqueTracks.keys())
    const audioFeatures = await getAudioFeatures(trackIds, accessToken)
    const featuresMap = new Map(
      (audioFeatures || [])
        .filter((f: any): f is NonNullable<typeof f> => f !== null && f.id)
        .map((f: any) => [f.id, f])
    )

    // Calculate total duration and filter to target
    let totalDuration = 0
    const selectedTracks: any[] = []
    
    for (const trackId of trackIds) {
      const track = uniqueTracks.get(trackId)
      if (!track) continue
      
      const duration = track.duration_ms / 1000 // Convert to seconds
      if (totalDuration + duration <= targetDuration * 1.1) {
        selectedTracks.push(track)
        totalDuration += duration
      }
    }

    // Save tracks to database
    const savedTracks = await Promise.all(
      selectedTracks.map(async (track, index) => {
        const features = featuresMap.get(track.id)
        const genres = track.artists?.[0]?.genres || []
        
        return db.playlistTrack.create({
          data: {
            sessionId: session.id,
            spotifyId: track.id,
            name: track.name,
            artist: track.artists[0]?.name || 'Unknown',
            album: track.album?.name,
            duration: track.duration_ms,
            previewUrl: track.preview_url,
            imageUrl: track.album?.images[0]?.url,
            externalUrl: track.external_urls?.spotify,
            order: index,
            audioFeatures: features
              ? {
                  bpm: features.tempo,
                  energy: features.energy,
                  valence: features.valence,
                  danceability: features.danceability,
                  acousticness: features.acousticness,
                }
              : undefined,
            genres: genres.length > 0 ? genres : undefined,
          },
        })
      })
    )

    return NextResponse.json({
      sessionId: session.id,
      tracks: savedTracks.map(track => ({
        id: track.id,
        spotifyId: track.spotifyId,
        name: track.name,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        previewUrl: track.previewUrl,
        imageUrl: track.imageUrl,
        externalUrl: track.externalUrl,
        order: track.order,
        isHearted: track.isHearted,
        isRemoved: track.isRemoved,
        audioFeatures: track.audioFeatures,
        genres: track.genres,
      })),
      totalDuration: Math.round(totalDuration),
      targetDuration,
    })
  } catch (error) {
    console.error('Generate playlist error:', error)
    return NextResponse.json(
      { error: 'Failed to generate playlist' },
      { status: 500 }
    )
  }
}













