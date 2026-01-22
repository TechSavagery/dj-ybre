import { notFound } from 'next/navigation'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { Border } from '@/components/Border'
import { Button } from '@/components/Button'
import { db } from '@/lib/db'

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const MODE_NAMES = ['Minor', 'Major']

function formatKey(key: number | null | undefined, mode: number | null | undefined): string {
  if (key === null || key === undefined) return 'N/A'
  const keyName = KEY_NAMES[key]
  const modeName = mode !== null && mode !== undefined ? MODE_NAMES[mode] : ''
  return `${keyName}${modeName ? ` ${modeName}` : ''}`
}

async function getTransition(id: string) {
  try {
    const transition = await db.transition.findUnique({
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
                        <img
                          src={track.albumImage}
                          alt={track.album || track.name}
                          className="w-20 h-20 rounded object-cover flex-shrink-0"
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
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
                          {track.bpm && (
                            <div>
                              <span className="text-neutral-500">BPM:</span>{' '}
                              <span className="font-semibold text-neutral-950">{Math.round(track.bpm)}</span>
                            </div>
                          )}
                          {track.key !== null && track.key !== undefined && (
                            <div>
                              <span className="text-neutral-500">Key:</span>{' '}
                              <span className="font-semibold text-neutral-950">
                                {formatKey(track.key, track.mode)}
                              </span>
                            </div>
                          )}
                          {track.energy !== null && track.energy !== undefined && (
                            <div>
                              <span className="text-neutral-500">Energy:</span>{' '}
                              <span className="font-semibold text-neutral-950">
                                {Math.round(track.energy * 100)}%
                              </span>
                            </div>
                          )}
                          {track.danceability !== null && track.danceability !== undefined && (
                            <div>
                              <span className="text-neutral-500">Dance:</span>{' '}
                              <span className="font-semibold text-neutral-950">
                                {Math.round(track.danceability * 100)}%
                              </span>
                            </div>
                          )}
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
