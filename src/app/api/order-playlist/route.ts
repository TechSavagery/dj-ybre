import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orderPlaylist } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    // Get session and tracks
    const session = await db.playlistSession.findUnique({
      where: { id: sessionId },
      include: {
        tracks: {
          where: {
            isRemoved: false,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Prepare tracks for ordering
    const tracks = session.tracks.map(track => ({
      name: track.name,
      artist: track.artist,
      duration: track.duration,
      bpm: (track.audioFeatures as any)?.bpm,
      energy: (track.audioFeatures as any)?.energy,
      valence: (track.audioFeatures as any)?.valence,
      genres: track.genres as string[] | undefined,
    }))

    // Get AI-ordered sequence
    const orderedIndices = await orderPlaylist(tracks, session.eventType)

    // Update track orders in database
    const updates = orderedIndices.map((originalIndex, newOrder) => {
      const track = session.tracks[originalIndex]
      if (!track) return null
      
      return db.playlistTrack.update({
        where: { id: track.id },
        data: { order: newOrder },
      })
    })

    await Promise.all(updates.filter(Boolean))

    // Return ordered tracks
    const orderedTracks = orderedIndices
      .map(i => session.tracks[i])
      .filter(Boolean)

    return NextResponse.json({
      tracks: orderedTracks.map(track => ({
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
    })
  } catch (error) {
    console.error('Order playlist error:', error)
    return NextResponse.json(
      { error: 'Failed to order playlist' },
      { status: 500 }
    )
  }
}













