import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAccessTokenForApi, getArtists, getSpotifyClient } from '@/lib/spotify'
import { db } from '@/lib/db'
import {
  getReccoBeatsAudioFeaturesByTrackIds,
  resolveReccoBeatsIdsFromSpotifyIds,
} from '@/lib/reccobeats'
import { isReccoBeatsConfigured } from '@/lib/reccobeats'

function parseReleaseYear(releaseDate?: string | null): number | null {
  if (!releaseDate) return null
  const yearStr = releaseDate.slice(0, 4)
  const year = Number.parseInt(yearStr, 10)
  return Number.isFinite(year) ? year : null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Missing track id' }, { status: 400 })
    }

    const reccoConfigured = isReccoBeatsConfigured()

    // First: try to use cached metadata from your own DB (works even if Spotify restricts audio endpoints).
    // This is especially useful for BPM/key/danceability which Spotify has restricted for many apps.
    const cached = await db.transitionTrack.findFirst({
      where: { spotifyId: id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        spotifyId: true,
        reccoBeatsId: true,
        bpm: true,
        key: true,
        mode: true,
        danceability: true,
        energy: true,
        valence: true,
        audioFeatures: true,
        genres: true,
        releaseDate: true,
        duration: true,
      },
    })

    if (cached) {
      // If we have a cached row but it's missing BPM/danceability/energy, try ReccoBeats once and backfill.
      const needsRecco =
        cached.bpm == null ||
        cached.danceability == null ||
        cached.energy == null ||
        !cached.reccoBeatsId

      let reccoError: string | null = null
      if (needsRecco) {
        try {
          const reccoMap = await resolveReccoBeatsIdsFromSpotifyIds([cached.spotifyId])
          const reccoId = cached.reccoBeatsId || reccoMap.get(cached.spotifyId) || null
          if (reccoId) {
            const featsArr = await getReccoBeatsAudioFeaturesByTrackIds([reccoId])
            const f = featsArr?.[0] ?? null
            const bpm = f?.tempo ?? null
            const energy = f?.energy ?? null
            const danceability = f?.danceability ?? null
            const valence = f?.valence ?? null

            await db.transitionTrack.update({
              where: { id: cached.id },
              data: {
                reccoBeatsId: reccoId,
                bpm: cached.bpm ?? bpm,
                energy: cached.energy ?? energy,
                danceability: cached.danceability ?? danceability,
                valence: cached.valence ?? valence,
                audioFeatures: f ? { provider: 'reccobeats', ...f } : undefined,
              },
            })

            // Prefer enriched values in response
            cached.reccoBeatsId = reccoId as any
            cached.bpm = cached.bpm ?? bpm
            cached.energy = cached.energy ?? energy
            cached.danceability = cached.danceability ?? danceability
          }
        } catch (err: any) {
          reccoError = err?.message || 'ReccoBeats lookup failed'
        }
      }

      const recco = (cached.audioFeatures &&
        typeof cached.audioFeatures === 'object' &&
        (cached.audioFeatures as any).provider === 'reccobeats')
        ? (cached.audioFeatures as any)
        : null

      return NextResponse.json({
        id: cached.spotifyId,
        reccoBeatsId: cached.reccoBeatsId ?? null,
        releaseYear: parseReleaseYear(cached.releaseDate ?? null),
        duration: cached.duration ?? null,
        bpm: cached.bpm ?? null,
        key: cached.key ?? null,
        mode: cached.mode ?? null,
        danceability: cached.danceability ?? null,
        energy: cached.energy ?? null,
        valence: cached.valence ?? recco?.valence ?? null,
        acousticness: recco?.acousticness ?? null,
        instrumentalness: recco?.instrumentalness ?? null,
        loudness: recco?.loudness ?? null,
        speechiness: recco?.speechiness ?? null,
        liveness: recco?.liveness ?? null,
        genres: Array.isArray(cached.genres) ? cached.genres : [],
        source: 'db',
        recco: {
          configured: reccoConfigured,
          attempted: Boolean(needsRecco && reccoConfigured),
          error: reccoError,
        },
      })
    }

    const cookieStore = await cookies()
    const cookieToken = cookieStore.get('spotify_access_token')?.value

    // Use refresh-token flow here because client-credentials can 403 on some endpoints
    // (and you already have refresh-token auth working for search).
    const accessToken = await getAccessTokenForApi(cookieToken, false)
    const client = getSpotifyClient(accessToken)

    let track: any | null = null
    try {
      track = (await client.getTrack(id))?.body
    } catch (err: any) {
      console.error('Spotify track details error (getTrack):', {
        status: err?.statusCode,
        message: err?.message,
        body: err?.body,
      })
    }

    if (!track) {
      // If we can't even fetch the track, we can't derive year/artists.
      return NextResponse.json({ error: 'Failed to fetch track from Spotify' }, { status: 502 })
    }

    const artistIds: string[] = (track.artists || [])
      .map((a: any) => a?.id)
      .filter(Boolean)
      .slice(0, 50)

    let genres: string[] = []
    if (artistIds.length > 0) {
      try {
        const artists = await getArtists(artistIds, accessToken)
        genres = Array.from(
          new Set(
            (artists || []).flatMap((a: any) => (Array.isArray(a?.genres) ? a.genres : []))
          )
        ).sort()
      } catch (err: any) {
        console.error('Spotify track details error (getArtists):', {
          status: err?.statusCode,
          message: err?.message,
          body: err?.body,
        })
      }
    }

    let reccoBeatsId: string | null = null
    let reccoFeatures: any | null = null
    let reccoError: string | null = null
    try {
      const map = await resolveReccoBeatsIdsFromSpotifyIds([id])
      reccoBeatsId = map.get(id) || null
      if (reccoBeatsId) {
        const feats = await getReccoBeatsAudioFeaturesByTrackIds([reccoBeatsId])
        reccoFeatures = feats?.[0] ?? null
      }
    } catch (err: any) {
      reccoError = err?.message || 'ReccoBeats lookup failed'
      reccoBeatsId = null
      reccoFeatures = null
    }

    const bpm = reccoFeatures?.tempo ?? null
    const danceability = reccoFeatures?.danceability ?? null
    const energy = reccoFeatures?.energy ?? null
    const valence = reccoFeatures?.valence ?? null
    // ReccoBeats audio-features does not provide musical key/mode; leave these as null.
    const key = null
    const mode = null

    return NextResponse.json({
      id,
      releaseYear: parseReleaseYear(track.album?.release_date),
      duration: track.duration_ms ?? null,
      bpm,
      key,
      mode,
      danceability,
      energy,
      valence,
      acousticness: reccoFeatures?.acousticness ?? null,
      instrumentalness: reccoFeatures?.instrumentalness ?? null,
      loudness: reccoFeatures?.loudness ?? null,
      speechiness: reccoFeatures?.speechiness ?? null,
      liveness: reccoFeatures?.liveness ?? null,
      genres,
      reccoBeatsId,
      source: reccoFeatures ? 'spotify+reccobeats' : 'spotify',
      recco: {
        configured: reccoConfigured,
        attempted: Boolean(reccoConfigured),
        error: reccoError ?? (!reccoConfigured ? 'RECCOBEATS_API_KEY is not set' : null),
      },
    })
  } catch (error: any) {
    console.error('Spotify track details error (unhandled):', {
      status: error?.statusCode,
      message: error?.message,
      body: error?.body,
    })
    return NextResponse.json({ error: 'Failed to fetch track details' }, { status: 500 })
  }
}

