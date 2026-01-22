import { NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/lib/spotify'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state') || undefined
    
    const authUrl = getAuthorizationUrl(state)
    
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Spotify auth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    )
  }
}













