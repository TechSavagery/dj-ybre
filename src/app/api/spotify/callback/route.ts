import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/spotify'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state')
    
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

    // Special-case the manual refresh-token script flow. That script uses a fixed
    // state of "spotify_refresh_token" and needs the *raw* one-time code to be
    // pasted into the terminal. If we exchange it here, the script can't use it.
    if (state === 'spotify_refresh_token') {
      const safeCode = escapeHtml(code)
      const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Spotify authorization code</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji", "Segoe UI Emoji"; padding: 24px; }
      pre { padding: 12px; background: #111827; color: #F9FAFB; border-radius: 8px; overflow-x: auto; }
      button { padding: 10px 14px; border-radius: 8px; border: 1px solid #D1D5DB; background: #fff; cursor: pointer; }
      .muted { color: #6B7280; }
    </style>
  </head>
  <body>
    <h1>Spotify authorization code</h1>
    <p>Copy this code and paste it into your terminal prompt.</p>
    <pre id="code">${safeCode}</pre>
    <p><button id="copy">Copy code</button> <span id="status" class="muted"></span></p>
    <p class="muted">You can close this tab after copying. This code is single-use.</p>

    <script>
      (function () {
        const code = document.getElementById('code').innerText.trim();
        const status = document.getElementById('status');
        document.getElementById('copy').addEventListener('click', async function () {
          try {
            await navigator.clipboard.writeText(code);
            status.textContent = 'Copied.';
          } catch (e) {
            status.textContent = 'Copy failed — select and copy manually.';
          }
        });
      })();
    </script>
  </body>
</html>`

      return new NextResponse(html, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
        },
      })
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













