import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

const prisma = db as any
const SESSION_COOKIE = 'song_request_session'

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

    const response = NextResponse.json({
      list: {
        id: list.id,
        name: list.name,
        eventType: list.eventType,
        eventDate: list.eventDate,
        eventTime: list.eventTime,
        createdAt: list.createdAt,
        publicUrl: `/requests/${list.id}`,
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
