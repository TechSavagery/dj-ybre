import { NextRequest, NextResponse } from 'next/server'
import { searchSpotify, getAccessTokenForApi } from '@/lib/spotify'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ tracks: [], artists: [] })
    }
    
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get('spotify_access_token')?.value
    
    // Get access token - tries cookie first, then refresh token from env
    let accessToken: string
    try {
      accessToken = await getAccessTokenForApi(cookieToken)
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Not authenticated with Spotify',
          details: error instanceof Error ? error.message : 'Failed to get access token'
        },
        { status: 401 }
      )
    }
    
    const results = await searchSpotify(query, accessToken, limit)
    
    return NextResponse.json({
      tracks: results.tracks.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown',
        artists: track.artists.map(a => ({ id: a.id, name: a.name })),
        album: track.album.name,
        albumImage: track.album.images[0]?.url,
        previewUrl: track.preview_url,
        externalUrl: track.external_urls.spotify,
        duration: track.duration_ms,
      })),
      artists: results.artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        image: artist.images[0]?.url,
        genres: artist.genres,
        externalUrl: artist.external_urls.spotify,
      })),
    })
  } catch (error) {
    console.error('Spotify search error:', error)
    return NextResponse.json(
      { error: 'Failed to search Spotify' },
      { status: 500 }
    )
  }
}













