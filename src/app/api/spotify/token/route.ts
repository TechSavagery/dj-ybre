import { NextRequest, NextResponse } from 'next/server'
import { getClientCredentialsToken, getTokenFromRefreshToken } from '@/lib/spotify'

/**
 * POST /api/spotify/token
 * Get an access token using either:
 * - Refresh token from environment (if SPOTIFY_REFRESH_TOKEN is set)
 * - Client credentials (fallback for public data access)
 * 
 * Query params:
 * - grant_type: 'refresh_token' (uses env refresh token) or 'client_credentials' (default)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const grantType = searchParams.get('grant_type') || 'refresh_token'
    
    let tokenData
    
    if (grantType === 'refresh_token') {
      // Use refresh token from environment
      try {
        const refreshData = await getTokenFromRefreshToken()
        return NextResponse.json({
          access_token: refreshData.accessToken,
          token_type: 'Bearer',
          expires_in: refreshData.expiresIn,
        })
      } catch (error) {
        // Fallback to client credentials if refresh token fails
        console.warn('Refresh token failed, falling back to client credentials:', error)
        tokenData = await getClientCredentialsToken()
      }
    } else {
      // Use client credentials
      tokenData = await getClientCredentialsToken()
    }
    
    return NextResponse.json({
      access_token: tokenData.accessToken,
      token_type: tokenData.tokenType,
      expires_in: tokenData.expiresIn,
    })
  } catch (error) {
    console.error('Error getting token:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/spotify/token
 * Alternative endpoint (same functionality as POST)
 */
export async function GET(request: NextRequest) {
  return POST(request)
}
