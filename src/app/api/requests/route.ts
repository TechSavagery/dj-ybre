import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSpotifyPlaylist, getUserAccessToken } from '@/lib/spotify'

const prisma = db as any

function formatLocalDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const includePast = url.searchParams.get('includePast') === '1'
    const today = formatLocalDate(new Date())
    const lists = await prisma.songRequestList.findMany({
      where: includePast
        ? undefined
        : {
            // eventDate is stored as YYYY-MM-DD, so lexicographic compare works.
            eventDate: { gte: today },
          },
      orderBy: includePast
        ? [{ createdAt: 'desc' }]
        : [{ eventDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { requests: true },
        },
      },
    })

    return NextResponse.json({
      lists: lists.map((list: any) => ({
        id: list.id,
        name: list.name,
        eventType: list.eventType,
        eventDate: list.eventDate,
        eventTime: list.eventTime,
        createdAt: list.createdAt,
        requestsCount: list._count?.requests ?? 0,
        publicUrl: `/requests/${list.id}`,
      })),
    })
  } catch (error) {
    console.error('Error fetching request lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request lists' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const eventType = typeof body?.eventType === 'string' ? body.eventType.trim() : ''
    const eventDate = typeof body?.eventDate === 'string' ? body.eventDate.trim() : ''
    const eventTime = typeof body?.eventTime === 'string' ? body.eventTime.trim() : null

    if (!name || !eventType || !eventDate) {
      return NextResponse.json(
        { error: 'name, eventType, and eventDate are required' },
        { status: 400 }
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

    let playlist
    try {
      const playlistName = `${name} - Request List`
      const description = `Song requests for ${name} (${eventType} on ${eventDate}).`
      playlist = await createSpotifyPlaylist(accessToken, playlistName, description, false)
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to create Spotify playlist' },
        { status: 502 }
      )
    }

    const list = await prisma.songRequestList.create({
      data: {
        name,
        eventType,
        eventDate,
        eventTime: eventTime || null,
        spotifyPlaylistId: playlist?.id ?? null,
        spotifyPlaylistUrl: playlist?.external_urls?.spotify ?? null,
      },
    })

    return NextResponse.json(
      {
        list: {
          id: list.id,
          name: list.name,
          eventType: list.eventType,
          eventDate: list.eventDate,
          eventTime: list.eventTime,
          createdAt: list.createdAt,
          spotifyPlaylistId: list.spotifyPlaylistId,
          spotifyPlaylistUrl: list.spotifyPlaylistUrl,
          publicUrl: `/requests/${list.id}`,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating request list:', error)
    return NextResponse.json(
      { error: 'Failed to create request list' },
      { status: 500 }
    )
  }
}
