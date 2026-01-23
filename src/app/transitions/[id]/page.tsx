import { notFound } from 'next/navigation'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { Border } from '@/components/Border'
import { Button } from '@/components/Button'
import { SpotifyPlayOverlayImage } from '@/components/SpotifyPlayOverlayImage'
import { db } from '@/lib/db'
import {
  getReccoBeatsAudioFeaturesByTrackIds,
  resolveReccoBeatsIdsFromSpotifyIds,
} from '@/lib/reccobeats'

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const MODE_NAMES = ['Minor', 'Major']

function formatKey(key: number | null | undefined, mode: number | null | undefined): string | null {
  if (key === null || key === undefined) return null
  const keyName = KEY_NAMES[key]
  const modeName = mode !== null && mode !== undefined ? MODE_NAMES[mode] : ''
  return `${keyName}${modeName ? ` ${modeName}` : ''}`
}

function parseReleaseYear(releaseDate?: string | null): number | null {
  if (!releaseDate) return null
  const year = Number.parseInt(releaseDate.slice(0, 4), 10)
  return Number.isFinite(year) ? year : null
}

function formatDuration(ms: number | null | undefined): string | null {
  if (!ms && ms !== 0) return null
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded">
      {children}
    </span>
  )
}

async function getTransition(id: string) {
  try {
    let transition = await db.transition.findUnique({
      where: { id },
      include: {
        tracks: {
          orderBy: { position: 'asc' },
        },
        points: {
          include: {
            track: true,
          },
          orderBy: { timestamp: 'asc' },
        },
      },
    })

    if (!transition) return null

    // If existing transitions were created before ReccoBeats enrichment, backfill on demand.
    const missingTracks = transition.tracks.filter((t: any) => {
      return (
        t.bpm == null ||
        t.key == null ||
        t.mode == null ||
        t.danceability == null ||
        t.energy == null ||
        t.valence == null ||
        !t.reccoBeatsId
      )
    })

    if (missingTracks.length > 0) {
      try {
        const spotifyIds = Array.from(new Set(missingTracks.map((t: any) => t.spotifyId).filter(Boolean)))
        const reccoIdMap = await resolveReccoBeatsIdsFromSpotifyIds(spotifyIds)
        const reccoIds = spotifyIds
          .map((sid) => reccoIdMap.get(sid))
          .filter((v): v is string => Boolean(v))

        const feats = await getReccoBeatsAudioFeaturesByTrackIds(reccoIds)
        const byReccoId = new Map<string, any>()
        for (const f of feats) {
          const rid = (f as any)?.id || (f as any)?.trackId || (f as any)?.track_id
          if (typeof rid === 'string') byReccoId.set(rid, f)
        }

        await Promise.all(
          missingTracks.map(async (t: any) => {
            const reccoId = t.reccoBeatsId || reccoIdMap.get(t.spotifyId) || null
            if (!reccoId) return
            const f = byReccoId.get(reccoId)
            if (!f) return
            await db.transitionTrack.update({
              where: { id: t.id },
              data: {
                reccoBeatsId: reccoId,
                bpm: t.bpm ?? f.tempo ?? null,
                key: t.key ?? f.key ?? null,
                mode: t.mode ?? f.mode ?? null,
                danceability: t.danceability ?? f.danceability ?? null,
                energy: t.energy ?? f.energy ?? null,
                valence: t.valence ?? f.valence ?? null,
                audioFeatures: { provider: 'reccobeats', ...f },
              },
            })
          })
        )

        // Re-fetch with updated values for rendering
        transition = await db.transition.findUnique({
          where: { id },
          include: {
            tracks: {
              orderBy: { position: 'asc' },
            },
            points: {
              include: {
                track: true,
              },
              orderBy: { timestamp: 'asc' },
            },
          },
        })
      } catch (e) {
        // Non-fatal; render what we have.
        console.error('ReccoBeats backfill failed:', e)
      }
    }
    return transition
  } catch (error) {
    console.error('Error fetching transition:', error)
    return null
  }
}

export default async function TransitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const transition = await getTransition(id)

  if (!transition) {
    notFound()
  }

  const avgBpm = transition.tracks
    .map((t: any) => t.bpm)
    .filter((bpm: any): bpm is number => bpm !== null && bpm !== undefined)
    .reduce((acc: number, bpm: number, _: any, arr: number[]) => acc + bpm / arr.length, 0) || null

  return (
    <>
      <PageIntro eyebrow="DJ Transition" title={transition.name}>
        <p>Detailed view of transition techniques and track information.</p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <FadeIn>
              <Border className="p-8">
                <h2 className="font-display text-2xl font-semibold text-neutral-950 mb-6">
                  Tracks
                </h2>
                <div className="space-y-6">
                  {transition.tracks.map((track: any, idx: number) => (
                    <div key={track.id} className="flex items-start gap-4">
                      {track.albumImage && (
                        <SpotifyPlayOverlayImage
                          src={track.albumImage}
                          alt={track.album || track.name}
                          href={track.externalUrl}
                          spotifyUri={track.spotifyId ? `spotify:track:${track.spotifyId}` : undefined}
                          size={80}
                          className="w-20 h-20 rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-neutral-950">
                              {track.name}
                            </h3>
                            <p className="text-base text-neutral-600 mt-1">
                              {track.artist}
                            </p>
                            {track.album && (
                              <p className="text-sm text-neutral-500 mt-1">
                                {track.album}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-neutral-400">
                            #{track.position}
                          </span>
                        </div>

                        {/* Track feature pills */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {parseReleaseYear(track.releaseDate) ? (
                            <Pill>{parseReleaseYear(track.releaseDate)}</Pill>
                          ) : null}
                          {formatDuration(track.duration) ? <Pill>{formatDuration(track.duration)}</Pill> : null}
                          <Pill>{track.bpm ? `${Math.round(track.bpm)} BPM` : 'BPM —'}</Pill>
                          {formatKey(track.key, track.mode) ? (
                            <Pill>{formatKey(track.key, track.mode)}</Pill>
                          ) : null}
                          {track.danceability !== null && track.danceability !== undefined ? (
                            <Pill>Dance {Math.round(track.danceability * 100)}%</Pill>
                          ) : null}
                          {track.energy !== null && track.energy !== undefined ? (
                            <Pill>Energy {Math.round(track.energy * 100)}%</Pill>
                          ) : null}
                          {track.valence !== null && track.valence !== undefined ? (
                            <Pill>Mood {Math.round(track.valence * 100)}%</Pill>
                          ) : null}
                        </div>
                        {track.genres && track.genres.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {track.genres.map((genre: string) => (
                              <span
                                key={genre}
                                className="px-2 py-1 text-xs bg-neutral-100 text-neutral-700 rounded"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        )}
                        {track.externalUrl && (
                          <a
                            href={track.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-4 text-sm font-semibold text-neutral-950 hover:text-neutral-700"
                          >
                            Open in Spotify →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Border>
            </FadeIn>

            {transition.notes && (
              <FadeIn>
                <Border className="p-8">
                  <h2 className="font-display text-xl font-semibold text-neutral-950 mb-4">
                    Notes
                  </h2>
                  <div className="prose prose-neutral max-w-none">
                    <p className="text-base text-neutral-600 whitespace-pre-wrap">
                      {transition.notes}
                    </p>
                  </div>
                </Border>
              </FadeIn>
            )}

            {transition.stemsNotes && (
              <FadeIn>
                <Border className="p-8">
                  <h2 className="font-display text-xl font-semibold text-neutral-950 mb-4">
                    Stems Notes
                  </h2>
                  <div className="prose prose-neutral max-w-none">
                    <p className="text-base text-neutral-600 whitespace-pre-wrap">
                      {transition.stemsNotes}
                    </p>
                  </div>
                </Border>
              </FadeIn>
            )}

            {transition.points && transition.points.length > 0 && (
              <FadeIn>
                <Border className="p-8">
                  <h2 className="font-display text-xl font-semibold text-neutral-950 mb-4">
                    Transition Points
                  </h2>
                  <div className="space-y-4">
                    {transition.points.map((point: any) => (
                      <div key={point.id} className="border-l-2 border-neutral-200 pl-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-neutral-950">
                            {point.track.name}
                          </span>
                          <span className="text-sm text-neutral-500">
                            @ {Math.floor(point.timestamp / 60)}:{(point.timestamp % 60).toFixed(1).padStart(4, '0')}
                          </span>
                          {point.pointType && (
                            <span className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-700 rounded">
                              {point.pointType}
                            </span>
                          )}
                        </div>
                        {point.description && (
                          <p className="text-sm text-neutral-600">{point.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Border>
              </FadeIn>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <FadeIn>
              <div className="sticky top-8 space-y-6">
                <Border className="p-6">
                  <h3 className="font-display text-lg font-semibold text-neutral-950 mb-4">
                    Details
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-neutral-500">Transition Types</dt>
                      <dd className="mt-1">
                        <div className="flex flex-wrap gap-2">
                          {transition.type.map((type: string) => (
                            <span
                              key={type}
                              className="px-2 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded"
                            >
                              {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </span>
                          ))}
                        </div>
                      </dd>
                    </div>
                    {transition.tags.length > 0 && (
                      <div>
                        <dt className="text-neutral-500">Tags</dt>
                        <dd className="mt-1">
                          <div className="flex flex-wrap gap-2">
                            {transition.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-neutral-50 text-neutral-600 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </dd>
                      </div>
                    )}
                    {avgBpm && (
                      <div>
                        <dt className="text-neutral-500">Average BPM</dt>
                        <dd className="mt-1 font-semibold text-neutral-950">
                          {Math.round(avgBpm)}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-neutral-500">Track Count</dt>
                      <dd className="mt-1 font-semibold text-neutral-950">
                        {transition.tracks.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Created</dt>
                      <dd className="mt-1 text-neutral-600">
                        {new Date(transition.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </Border>

                <div className="flex flex-col gap-3">
                  <Button href="/transitions/browse">
                    ← Back to Browse
                  </Button>
                  <Button href="/transitions">
                    + Create New
                  </Button>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </Container>
    </>
  )
}
