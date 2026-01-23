import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { fetchTrackMetadata } from '@/lib/transitions'
import { addTracksToSpotifyPlaylist, getUserAccessToken } from '@/lib/spotify'

const prisma = db as any
const SESSION_COOKIE = 'song_request_session'
const REQUESTS_PER_SESSION_LIMIT = 3

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let sessionKey = request.cookies.get(SESSION_COOKIE)?.value
  let shouldSetCookie = false

  if (!sessionKey) {
    sessionKey = crypto.randomUUID()
    shouldSetCookie = true
  }

  try {
    const body = await request.json()
    const spotifyId = typeof body?.spotifyId === 'string' ? body.spotifyId.trim() : ''
    const requesterFirstName =
      typeof body?.requesterFirstName === 'string' ? body.requesterFirstName.trim() : ''
    const requesterLastName =
      typeof body?.requesterLastName === 'string' ? body.requesterLastName.trim() : ''

    if (!spotifyId || !requesterFirstName || !requesterLastName) {
      return NextResponse.json(
        { error: 'spotifyId, requesterFirstName, and requesterLastName are required' },
        { status: 400 }
      )
    }

    const list = await prisma.songRequestList.findUnique({
      where: { id: params.id },
    })

    if (!list) {
      return NextResponse.json(
        { error: 'Request list not found' },
        { status: 404 }
      )
    }

    if (sessionKey) {
      const existingCount = await prisma.songRequestTrack.count({
        where: {
          listId: params.id,
          requesterSessionKey: sessionKey,
        },
      })
      if (existingCount >= REQUESTS_PER_SESSION_LIMIT) {
        const response = NextResponse.json(
          { error: 'Only 3 requests per person.' },
          { status: 429 }
        )
        if (shouldSetCookie && sessionKey) {
          response.cookies.set(SESSION_COOKIE, sessionKey, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
          })
        }
        return response
      }
    }

    const existing = await prisma.songRequestTrack.findFirst({
      where: {
        listId: params.id,
        spotifyId,
      },
    })

    if (existing) {
      return NextResponse.json(
        {
          error: 'This song is already on the request list.',
          request: existing,
          duplicate: true,
        },
        { status: 409 }
      )
    }

    const cookieToken = request.cookies.get('spotify_access_token')?.value
    let accessToken: string
    try {
      accessToken = await getUserAccessToken(cookieToken)
    } catch (error) {
      return NextResponse.json(
        { error: 'Not authenticated with Spotify' },
        { status: 401 }
      )
    }

    const metadata = await fetchTrackMetadata(spotifyId, accessToken)

    const created = await prisma.songRequestTrack.create({
      data: {
        listId: params.id,
        spotifyId,
        reccoBeatsId: metadata.reccoBeatsId,
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
        requesterFirstName,
        requesterLastName,
        requesterSessionKey: sessionKey || null,
      },
    })

    if (!list.spotifyPlaylistId) {
      await prisma.songRequestTrack.delete({ where: { id: created.id } })
      return NextResponse.json(
        { error: 'Spotify playlist is not configured for this request list.' },
        { status: 500 }
      )
    }

    try {
      await addTracksToSpotifyPlaylist(accessToken, list.spotifyPlaylistId, [spotifyId])
    } catch (error) {
      await prisma.songRequestTrack.delete({ where: { id: created.id } })
      return NextResponse.json(
        { error: 'Failed to add song to Spotify playlist' },
        { status: 502 }
      )
    }

    const response = NextResponse.json(
      {
        request: created,
      },
      { status: 201 }
    )

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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This song is already on the request list.', duplicate: true },
        { status: 409 }
      )
    }

    console.error('Error adding song request:', error)
    return NextResponse.json(
      { error: 'Failed to add song request' },
      { status: 500 }
    )
  }
}
