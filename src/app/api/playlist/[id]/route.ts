import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await db.playlistSession.findUnique({
      where: { id: params.id },
      include: {
        tracks: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      session: {
        id: session.id,
        eventType: session.eventType,
        playlistDuration: session.playlistDuration,
        targetDuration: session.targetDuration,
        createdAt: session.createdAt,
      },
      tracks: session.tracks.map(track => ({
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
    console.error('Get playlist error:', error)
    return NextResponse.json(
      { error: 'Failed to get playlist' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { trackId, action, addTrack } = body

    if (addTrack) {
      // Add a new track to the playlist
      const track = await db.playlistTrack.create({
        data: {
          sessionId: params.id,
          spotifyId: addTrack.spotifyId,
          name: addTrack.name,
          artist: addTrack.artist,
          album: addTrack.album,
          duration: addTrack.duration,
          previewUrl: addTrack.previewUrl,
          imageUrl: addTrack.imageUrl,
          externalUrl: addTrack.externalUrl,
          audioFeatures: addTrack.audioFeatures,
          genres: addTrack.genres,
        },
      })

      return NextResponse.json({ track })
    }

    if (!trackId || !action) {
      return NextResponse.json(
        { error: 'trackId and action are required' },
        { status: 400 }
      )
    }

    // Update track interaction
    const updateData: any = {}
    if (action === 'heart') {
      updateData.isHearted = true
      updateData.isRemoved = false
    } else if (action === 'unheart') {
      updateData.isHearted = false
    } else if (action === 'remove') {
      updateData.isRemoved = true
      updateData.isHearted = false
    } else if (action === 'restore') {
      updateData.isRemoved = false
    }

    const track = await db.playlistTrack.update({
      where: { id: trackId },
      data: updateData,
    })

    // Log interaction
    await db.userInteraction.create({
      data: {
        sessionId: params.id,
        trackId: trackId,
        action: action === 'heart' ? 'heart' : action === 'remove' ? 'remove' : 'unheart',
      },
    })

    return NextResponse.json({ track })
  } catch (error) {
    console.error('Update playlist error:', error)
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    )
  }
}













