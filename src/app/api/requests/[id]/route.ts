import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { getUserAccessToken, unfollowSpotifyPlaylist } from '@/lib/spotify'

const prisma = db as any
const SESSION_COOKIE = 'song_request_session'
const REQUESTS_PER_SESSION_LIMIT = 3
const BOOSTS_PER_SESSION_LIMIT = 5

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const list = await prisma.songRequestList.findUnique({
      where: { id: params.id },
      include: {
        requests: {
          orderBy: [{ voteCount: 'desc' }, { createdAt: 'asc' }],
        },
      },
    })

    if (!list) {
      return NextResponse.json(
        { error: 'Request list not found' },
        { status: 404 }
      )
    }

    let sessionKey = request.cookies.get(SESSION_COOKIE)?.value
    let shouldSetCookie = false

    if (!sessionKey) {
      sessionKey = crypto.randomUUID()
      shouldSetCookie = true
    }

    const votes = sessionKey
      ? await prisma.songRequestVote.findMany({
          where: {
            sessionKey,
            request: {
              listId: params.id,
            },
          },
          select: { requestId: true },
        })
      : []

    const votedIds = new Set(votes.map((vote: any) => vote.requestId))

    const boostsUsed = votes.length
    const requestsUsed = sessionKey
      ? await prisma.songRequestTrack.count({
          where: {
            listId: params.id,
            requesterSessionKey: sessionKey,
          },
        })
      : 0

    const response = NextResponse.json({
      list: {
        id: list.id,
        name: list.name,
        eventType: list.eventType,
        eventDate: list.eventDate,
        eventTime: list.eventTime,
        publicDescription: list.publicDescription ?? null,
        createdAt: list.createdAt,
        publicUrl: `/requests/${list.id}`,
      },
      session: {
        boostsUsed,
        boostsLimit: BOOSTS_PER_SESSION_LIMIT,
        boostsRemaining: Math.max(0, BOOSTS_PER_SESSION_LIMIT - boostsUsed),
        requestsUsed,
        requestsLimit: REQUESTS_PER_SESSION_LIMIT,
        requestsRemaining: Math.max(0, REQUESTS_PER_SESSION_LIMIT - requestsUsed),
      },
      requests: list.requests.map((requestItem: any) => ({
        id: requestItem.id,
        spotifyId: requestItem.spotifyId,
        reccoBeatsId: requestItem.reccoBeatsId,
        name: requestItem.name,
        artist: requestItem.artist,
        artists: requestItem.artists,
        album: requestItem.album,
        albumImage: requestItem.albumImage,
        duration: requestItem.duration,
        previewUrl: requestItem.previewUrl,
        externalUrl: requestItem.externalUrl,
        bpm: requestItem.bpm,
        key: requestItem.key,
        mode: requestItem.mode,
        timeSignature: requestItem.timeSignature,
        energy: requestItem.energy,
        danceability: requestItem.danceability,
        valence: requestItem.valence,
        audioFeatures: requestItem.audioFeatures,
        genres: requestItem.genres,
        releaseDate: requestItem.releaseDate,
        popularity: requestItem.popularity,
        requesterFirstName: requestItem.requesterFirstName,
        requesterLastName: requestItem.requesterLastName,
        voteCount: requestItem.voteCount,
        createdAt: requestItem.createdAt,
        hasVoted: votedIds.has(requestItem.id),
      })),
    })

    if (shouldSetCookie && sessionKey) {
      response.cookies.set(SESSION_COOKIE, sessionKey, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      })
    }

    return response
  } catch (error) {
    console.error('Error fetching request list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request list' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieToken = request.cookies.get('spotify_access_token')?.value
    try {
      await getUserAccessToken(cookieToken)
    } catch {
      return NextResponse.json({ error: 'Not authenticated with Spotify' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const publicDescriptionRaw =
      typeof body?.publicDescription === 'string' ? body.publicDescription.trim() : ''
    const publicDescription = publicDescriptionRaw.length > 0 ? publicDescriptionRaw : null

    const updated = await prisma.songRequestList.update({
      where: { id: params.id },
      data: { publicDescription },
    })

    return NextResponse.json({
      list: {
        id: updated.id,
        name: updated.name,
        eventType: updated.eventType,
        eventDate: updated.eventDate,
        eventTime: updated.eventTime,
        publicDescription: updated.publicDescription ?? null,
        createdAt: updated.createdAt,
        publicUrl: `/requests/${updated.id}`,
      },
    })
  } catch (error) {
    console.error('Error updating request list:', error)
    return NextResponse.json({ error: 'Failed to update request list' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const list = await prisma.songRequestList.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        spotifyPlaylistId: true,
      },
    })

    if (!list) {
      return NextResponse.json({ error: 'Request list not found' }, { status: 404 })
    }

    const cookieToken = request.cookies.get('spotify_access_token')?.value
    let accessToken: string
    try {
      accessToken = await getUserAccessToken(cookieToken)
    } catch {
      return NextResponse.json({ error: 'Not authenticated with Spotify' }, { status: 401 })
    }

    if (list.spotifyPlaylistId) {
      try {
        await unfollowSpotifyPlaylist(accessToken, list.spotifyPlaylistId)
      } catch (spotifyError) {
        console.error('Failed to unfollow Spotify playlist:', spotifyError)
        return NextResponse.json(
          { error: 'Failed to delete Spotify playlist' },
          { status: 502 }
        )
      }
    }

    await prisma.songRequestList.delete({ where: { id: list.id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting request list:', error)
    return NextResponse.json({ error: 'Failed to delete request list' }, { status: 500 })
  }
}
