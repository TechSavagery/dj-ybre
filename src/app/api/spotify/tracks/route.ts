import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  getReccoBeatsAudioFeaturesByTrackIds,
  resolveReccoBeatsIdsFromSpotifyIds,
} from '@/lib/reccobeats'

function parseReleaseYear(releaseDate?: string | null): number | null {
  if (!releaseDate) return null
  const year = Number.parseInt(releaseDate.slice(0, 4), 10)
  return Number.isFinite(year) ? year : null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids') || ''
    const ids = Array.from(
      new Set(
        idsParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      )
    )

    if (ids.length === 0) {
      return NextResponse.json({ tracks: [] })
    }

    // Read any cached rows from DB.
    const rows = await db.transitionTrack.findMany({
      where: { spotifyId: { in: ids } },
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
        releaseDate: true,
        duration: true,
        genres: true,
      },
    })

    const bySpotifyId = new Map(rows.map((r) => [r.spotifyId, r]))

    const needs = ids.filter((sid) => {
      const r = bySpotifyId.get(sid)
      if (!r) return false
      return (
        r.bpm == null ||
        r.key == null ||
        r.mode == null ||
        r.danceability == null ||
        r.energy == null ||
        r.valence == null ||
        !r.reccoBeatsId
      )
    })

    if (needs.length > 0) {
      // Resolve ReccoBeats IDs and audio-features in bulk.
      const reccoIdMap = await resolveReccoBeatsIdsFromSpotifyIds(needs)
      const reccoIds = needs
        .map((sid) => reccoIdMap.get(sid))
        .filter((v): v is string => Boolean(v))

      const feats = await getReccoBeatsAudioFeaturesByTrackIds(reccoIds)
      const byReccoId = new Map<string, any>()
      for (const f of feats) {
        const id = (f as any)?.id || (f as any)?.trackId || (f as any)?.track_id
        if (typeof id === 'string') byReccoId.set(id, f)
      }

      await Promise.all(
        needs.map(async (sid) => {
          const row = bySpotifyId.get(sid)
          if (!row) return
          const reccoId = row.reccoBeatsId || reccoIdMap.get(sid) || null
          if (!reccoId) return
          const f = byReccoId.get(reccoId)
          if (!f) return

          await db.transitionTrack.update({
            where: { id: row.id },
            data: {
              reccoBeatsId: reccoId,
              bpm: row.bpm ?? f.tempo ?? null,
              key: row.key ?? f.key ?? null,
              mode: row.mode ?? f.mode ?? null,
              danceability: row.danceability ?? f.danceability ?? null,
              energy: row.energy ?? f.energy ?? null,
              valence: row.valence ?? f.valence ?? null,
              audioFeatures: { provider: 'reccobeats', ...f },
            },
          })
        })
      )
    }

    // Re-read updated rows to return fresh values.
    const updated = await db.transitionTrack.findMany({
      where: { spotifyId: { in: ids } },
      select: {
        spotifyId: true,
        reccoBeatsId: true,
        bpm: true,
        key: true,
        mode: true,
        danceability: true,
        energy: true,
        valence: true,
        audioFeatures: true,
        releaseDate: true,
        duration: true,
        genres: true,
      },
    })

    const tracks = updated.map((r) => {
      const recco =
        r.audioFeatures && typeof r.audioFeatures === 'object' && (r.audioFeatures as any).provider === 'reccobeats'
          ? (r.audioFeatures as any)
          : null

      return {
        id: r.spotifyId,
        reccoBeatsId: r.reccoBeatsId ?? null,
        releaseYear: parseReleaseYear(r.releaseDate ?? null),
        releaseDate: r.releaseDate ?? null,
        duration: r.duration ?? null,
        bpm: r.bpm ?? null,
        key: r.key ?? null,
        mode: r.mode ?? null,
        danceability: r.danceability ?? null,
        energy: r.energy ?? null,
        valence: r.valence ?? recco?.valence ?? null,
        acousticness: recco?.acousticness ?? null,
        instrumentalness: recco?.instrumentalness ?? null,
        loudness: recco?.loudness ?? null,
        speechiness: recco?.speechiness ?? null,
        liveness: recco?.liveness ?? null,
        genres: Array.isArray(r.genres) ? r.genres : [],
      }
    })

    return NextResponse.json({ tracks })
  } catch (error: any) {
    console.error('Bulk track enrichment error:', error)
    return NextResponse.json({ error: 'Failed to enrich tracks' }, { status: 500 })
  }
}

