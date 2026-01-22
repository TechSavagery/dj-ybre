import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { fetchTrackMetadata, validateTransitionData } from '@/lib/transitions'
import { getAccessTokenForApi } from '@/lib/spotify'

/**
 * GET /api/transitions/[id]
 * Get a single transition by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transition = await db.transition.findUnique({
      where: { id: params.id },
      include: {
        tracks: {
          orderBy: { position: 'asc' },
          include: {
            fromTrack: true,
            toTracks: true,
          },
        },
        points: {
          include: {
            track: true,
          },
          orderBy: { timestamp: 'asc' },
        },
      },
    })

    if (!transition) {
      return NextResponse.json(
        { error: 'Transition not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transition)
  } catch (error) {
    console.error('Error fetching transition:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transition' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/transitions/[id]
 * Update a transition
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get('spotify_access_token')?.value

    // Get access token - tries cookie first, then refresh token from env
    // For public endpoints (tracks, audio features), prefer client credentials
    let accessToken: string
    try {
      // Use client credentials for public track data (more reliable than refresh tokens)
      accessToken = await getAccessTokenForApi(cookieToken, true)
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Not authenticated with Spotify',
          details: error instanceof Error ? error.message : 'Failed to get access token'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      type,
      notes,
      stemsNotes,
      tags,
      tracks,
      points,
    } = body

    // Check if transition exists
    const existing = await db.transition.findUnique({
      where: { id: params.id },
      include: { tracks: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Transition not found' },
        { status: 404 }
      )
    }

    // If tracks are being updated, validate and fetch metadata
    let updatedTracks = existing.tracks
    if (tracks) {
      // Use existing type if not provided, normalize to array
      const typeForValidation = type || existing.type
      const validation = validateTransitionData({ tracks, type: typeForValidation })
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.errors },
          { status: 400 }
        )
      }

      // Fetch metadata for new/updated tracks
      const trackMetadataPromises = tracks.map((track: { spotifyId: string }) =>
        fetchTrackMetadata(track.spotifyId, accessToken)
      )
      const trackMetadata = await Promise.all(trackMetadataPromises)

      // Delete existing tracks and create new ones
      await db.transitionTrack.deleteMany({
        where: { transitionId: params.id },
      })

      // Create tracks without fromTrackId first
      const createdTracks = await Promise.all(
        tracks.map(
          async (
            track: {
              spotifyId: string
              position: number
              fromTrackId?: string | null
            },
            index: number
          ) => {
            const metadata = trackMetadata[index]
            return db.transitionTrack.create({
              data: {
                transitionId: params.id,
                spotifyId: track.spotifyId,
                position: track.position,
                name: metadata.name,
                artist: metadata.artist,
                artists: metadata.artists,
                album: metadata.album,
                albumImage: metadata.albumImage,
                duration: metadata.duration,
                previewUrl: metadata.previewUrl,
                externalUrl: metadata.externalUrl,
                bpm: metadata.bpm,
                key: metadata.key,
                mode: metadata.mode,
                timeSignature: metadata.timeSignature,
                energy: metadata.energy,
                danceability: metadata.danceability,
                valence: metadata.valence,
                audioFeatures: metadata.audioFeatures,
                genres: metadata.genres,
                releaseDate: metadata.releaseDate,
                popularity: metadata.popularity,
              },
            })
          }
        )
      )

      // Resolve fromTrackId relationships
      const trackMap = new Map(createdTracks.map((t) => [t.spotifyId, t.id]))

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i]
        const createdTrack = createdTracks[i]
        if (track.fromTrackId) {
          const fromTrackId = trackMap.get(track.fromTrackId)
          if (fromTrackId) {
            await db.transitionTrack.update({
              where: { id: createdTrack.id },
              data: { fromTrackId },
            })
          }
        }
      }

      updatedTracks = createdTracks
    }

    // Update transition metadata
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) {
      // Normalize type to array
      updateData.type = Array.isArray(type) ? type.filter(Boolean) : type ? [type] : []
    }
    if (notes !== undefined) updateData.notes = notes
    if (stemsNotes !== undefined) updateData.stemsNotes = stemsNotes
    if (tags !== undefined) updateData.tags = tags

    await db.transition.update({
      where: { id: params.id },
      data: updateData,
    })

    // Update points if provided
    if (points !== undefined) {
      await db.transitionPoint.deleteMany({
        where: { transitionId: params.id },
      })

      if (points.length > 0) {
        const trackMapBySpotifyId = new Map(
          updatedTracks.map((t) => [t.spotifyId, t.id])
        )

        await db.transitionPoint.createMany({
          data: points.map((point: any) => ({
            transitionId: params.id,
            trackId: trackMapBySpotifyId.get(point.spotifyId) || updatedTracks[0]?.id,
            timestamp: point.timestamp,
            description: point.description || null,
            pointType: point.pointType || null,
          })),
        })
      }
    }

    // Fetch updated transition
    const updated = await db.transition.findUnique({
      where: { id: params.id },
      include: {
        tracks: {
          orderBy: { position: 'asc' },
          include: {
            fromTrack: true,
          },
        },
        points: {
          include: {
            track: true,
          },
          orderBy: { timestamp: 'asc' },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating transition:', error)
    return NextResponse.json(
      { error: 'Failed to update transition', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/transitions/[id]
 * Delete a transition
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transition = await db.transition.findUnique({
      where: { id: params.id },
    })

    if (!transition) {
      return NextResponse.json(
        { error: 'Transition not found' },
        { status: 404 }
      )
    }

    // Cascade delete will handle tracks and points
    await db.transition.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Transition deleted successfully' })
  } catch (error) {
    console.error('Error deleting transition:', error)
    return NextResponse.json(
      { error: 'Failed to delete transition' },
      { status: 500 }
    )
  }
}

