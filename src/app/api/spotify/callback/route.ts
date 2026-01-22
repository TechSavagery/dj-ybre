import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/spotify'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    if (error) {
      return NextResponse.redirect(
        new URL(`/playlist-generator?error=${encodeURIComponent(error)}`, request.url)
      )
    }
    
    if (!code) {
      return NextResponse.redirect(
        new URL('/playlist-generator?error=no_code', request.url)
      )
    }
    
    const tokens = await getAccessToken(code)
    
    // Store tokens in session/cookie (for now, return to frontend)
    // In production, store securely in httpOnly cookies or session
    const response = NextResponse.redirect(
      new URL('/playlist-generator?spotify_connected=true', request.url)
    )
    
    // Store access token in cookie (temporary - should use httpOnly in production)
    response.cookies.set('spotify_access_token', tokens.accessToken, {
      maxAge: tokens.expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    
    if (tokens.refreshToken) {
      response.cookies.set('spotify_refresh_token', tokens.refreshToken, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
    }
    
    return response
  } catch (error) {
    console.error('Spotify callback error:', error)
    return NextResponse.redirect(
      new URL('/playlist-generator?error=callback_failed', request.url)
    )
  }
}













