import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import {
  fetchTrackMetadata,
  generateTransitionName,
  validateTransitionData,
} from '@/lib/transitions'
import { getAccessTokenForApi } from '@/lib/spotify'

/**
 * GET /api/transitions
 * List all transitions with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const types = searchParams.getAll('types') // Support multiple types
    const tag = searchParams.get('tag')
    const tags = searchParams.getAll('tags') // Support multiple tags
    const search = searchParams.get('search')
    const minBpm = searchParams.get('minBpm')
    const maxBpm = searchParams.get('maxBpm')
    const key = searchParams.get('key')
    const minEnergy = searchParams.get('minEnergy')
    const maxEnergy = searchParams.get('maxEnergy')
    const trackCount = searchParams.get('trackCount')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}

    // Filter by transition types (support multiple)
    const allTypes = types.length > 0 ? types : type ? [type] : []
    if (allTypes.length > 0) {
      where.type = {
        hasSome: allTypes,
      }
    }

    // Filter by tags (support multiple)
    const allTags = tags.length > 0 ? tags : tag ? [tag] : []
    if (allTags.length > 0) {
      where.tags = {
        hasSome: allTags,
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { stemsNotes: { contains: search, mode: 'insensitive' } },
        {
          tracks: {
            some: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { artist: { contains: search, mode: 'insensitive' } },
                { album: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ]
    }

    // Build track filters for BPM, key, energy
    const trackFilters: any = {}
    if (minBpm || maxBpm) {
      trackFilters.bpm = {}
      if (minBpm) trackFilters.bpm.gte = parseFloat(minBpm)
      if (maxBpm) trackFilters.bpm.lte = parseFloat(maxBpm)
    }
    if (key !== null && key !== undefined && key !== '') {
      trackFilters.key = parseInt(key)
    }
    if (minEnergy || maxEnergy) {
      trackFilters.energy = {}
      if (minEnergy) trackFilters.energy.gte = parseFloat(minEnergy)
      if (maxEnergy) trackFilters.energy.lte = parseFloat(maxEnergy)
    }

    // Add track filters to where clause if any exist
    if (Object.keys(trackFilters).length > 0) {
      where.tracks = {
        some: trackFilters,
      }
    }

    const [transitions, total] = await Promise.all([
      db.transition.findMany({
        where,
        include: {
          tracks: {
            orderBy: { position: 'asc' },
          },
          points: {
            include: {
              track: true,
            },
            orderBy: { timestamp: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: trackCount ? limit * 3 : limit, // Get more to account for track count filtering
        skip: offset,
      }),
      db.transition.count({ where }),
    ])

    // Filter by track count if specified (post-query since Prisma doesn't support count filters directly)
    let filteredTransitions = transitions
    if (trackCount) {
      const count = parseInt(trackCount)
      filteredTransitions = transitions.filter((t) => t.tracks.length === count)
      // Apply limit after filtering
      filteredTransitions = filteredTransitions.slice(0, limit)
    }

    return NextResponse.json({
      transitions: filteredTransitions,
      pagination: {
        total: trackCount ? filteredTransitions.length : total,
        limit,
        offset,
        hasMore: trackCount 
          ? filteredTransitions.length === limit 
          : offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching transitions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transitions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transitions
 * Create a new transition
 */
export async function POST(request: NextRequest) {
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
      tracks,
      type,
      name,
      notes,
      stemsNotes,
      tags = [],
      points = [],
    } = body

    // Validate input
    const validation = validateTransitionData({ tracks, type })
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Fetch metadata for all tracks from Spotify
    const trackMetadataPromises = tracks.map((track: { spotifyId: string }) =>
      fetchTrackMetadata(track.spotifyId, accessToken)
    )
    const trackMetadata = await Promise.all(trackMetadataPromises)

    // Generate default name if not provided
    const transitionName =
      name ||
      generateTransitionName(
        trackMetadata.map((m) => ({ name: m.name, artist: m.artist }))
      )

    // Normalize type to array
    const transitionTypes = Array.isArray(type) 
      ? type.filter(Boolean) 
      : type 
        ? [type] 
        : []

    // Create transition first
    const transition = await db.transition.create({
      data: {
        name: transitionName,
        type: transitionTypes,
        notes: notes || null,
        stemsNotes: stemsNotes || null,
        tags: tags || [],
      },
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
              transitionId: transition.id,
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

    // Resolve fromTrackId relationships (convert spotifyId to database ID)
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

    // Create transition points if provided
    if (points && points.length > 0) {
      const updatedTracks = await db.transitionTrack.findMany({
        where: { transitionId: transition.id },
      })
      const trackMapBySpotifyId = new Map(
        updatedTracks.map((t) => [t.spotifyId, t.id])
      )

      await db.transitionPoint.createMany({
        data: points.map((point: any) => ({
          transitionId: transition.id,
          trackId: trackMapBySpotifyId.get(point.spotifyId) || updatedTracks[0]?.id,
          timestamp: point.timestamp,
          description: point.description || null,
          pointType: point.pointType || null,
        })),
      })
    }

    // Fetch complete transition with all relations
    const completeTransition = await db.transition.findUnique({
      where: { id: transition.id },
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

    return NextResponse.json(completeTransition, { status: 201 })
  } catch (error) {
    console.error('Error creating transition:', error)
    return NextResponse.json(
      { error: 'Failed to create transition', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

