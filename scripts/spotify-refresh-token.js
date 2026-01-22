const readline = require('readline')
const SpotifyWebApi = require('spotify-web-api-node')

const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
const redirectUri = process.env.SPOTIFY_REDIRECT_URI

if (!clientId || !clientSecret || !redirectUri) {
  console.error('Missing env vars.')
  console.error('Required: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI')
  process.exit(1)
}

const spotifyApi = new SpotifyWebApi({
  clientId,
  clientSecret,
  redirectUri,
})

const scopes = [
  'playlist-modify-private',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-read-collaborative',
]

const authUrl = spotifyApi.createAuthorizeURL(scopes, 'spotify_refresh_token')

console.log('\nOpen this URL in your browser and approve access:\n')
console.log(authUrl)
console.log('\nAfter approval, you will be redirected to your redirect URI.')
console.log('Copy the "code" query parameter and paste it below.\n')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('Authorization code: ', async (code) => {
  try {
    if (!code) {
      throw new Error('No code provided.')
    }
    const data = await spotifyApi.authorizationCodeGrant(code.trim())
    const refreshToken = data.body.refresh_token
    const accessToken = data.body.access_token
    const expiresIn = data.body.expires_in

    if (!refreshToken) {
      throw new Error('No refresh token returned. Ensure you approved the request.')
    }

    console.log('\nSuccess!\n')
    console.log(`SPOTIFY_REFRESH_TOKEN=${refreshToken}`)
    console.log(`Access token (short-lived): ${accessToken}`)
    console.log(`Expires in: ${expiresIn} seconds`)
    console.log('\nAdd SPOTIFY_REFRESH_TOKEN to your env to enable playlist creation.\n')
  } catch (error) {
    console.error('\nFailed to get refresh token.')
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  } finally {
    rl.close()
  }
})
