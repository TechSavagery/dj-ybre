import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  getUserAccessToken,
  removeTracksFromSpotifyPlaylist,
} from '@/lib/spotify'

const prisma = db as any

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; songId: string } }
) {
  try {
    const list = await prisma.songRequestList.findUnique({
      where: { id: params.id },
      select: { id: true, spotifyPlaylistId: true },
    })

    if (!list) {
      return NextResponse.json({ error: 'Request list not found' }, { status: 404 })
    }

    const track = await prisma.songRequestTrack.findFirst({
      where: { id: params.songId, listId: params.id },
      select: { id: true, spotifyId: true },
    })

    if (!track) {
      return NextResponse.json({ error: 'Requested song not found' }, { status: 404 })
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
        await removeTracksFromSpotifyPlaylist(accessToken, list.spotifyPlaylistId, [
          track.spotifyId,
        ])
      } catch (spotifyError) {
        console.error('Failed to remove track from Spotify playlist:', spotifyError)
        return NextResponse.json(
          { error: 'Failed to delete song from Spotify playlist' },
          { status: 502 }
        )
      }
    }

    await prisma.songRequestTrack.delete({ where: { id: track.id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting requested song:', error)
    return NextResponse.json({ error: 'Failed to delete requested song' }, { status: 500 })
  }
}

