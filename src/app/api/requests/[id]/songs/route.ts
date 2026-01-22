import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { fetchTrackMetadata } from '@/lib/transitions'
import { getAccessTokenForApi } from '@/lib/spotify'

const prisma = db as any

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const accessToken = await getAccessTokenForApi(cookieToken, true)
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
      },
    })

    return NextResponse.json(
      {
        request: created,
      },
      { status: 201 }
    )
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
