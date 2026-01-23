'use client'

import { useEffect, useMemo, useState } from 'react'
import { Container } from '@/components/Container'
import { PageIntro } from '@/components/PageIntro'
import { FadeIn } from '@/components/FadeIn'
import { Button } from '@/components/Button'
import { Border } from '@/components/Border'

interface RequestList {
  id: string
  name: string
  eventType: string
  eventDate: string
  eventTime?: string | null
  createdAt: string
  requestsCount: number
  publicUrl: string
}

export default function RequestsIndexPage() {
  const [lists, setLists] = useState<RequestList[]>([])
  const [loading, setLoading] = useState(true)
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/requests')
      if (!res.ok) return
      const data = await res.json()
      setLists(Array.isArray(data.lists) ? data.lists : [])
    } catch (err) {
      console.error('Failed to load request lists:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLists()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const upcomingLists = useMemo(() => lists, [lists])

  const copyLink = async (url: string) => {
    if (!url) return
    const resolvedUrl = url.startsWith('http') ? url : `${origin}${url}`
    try {
      await navigator.clipboard.writeText(resolvedUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  return (
    <>
      <PageIntro eyebrow="Song Requests" title="Upcoming request lists">
        <p>
          Browse upcoming request lists and share the public links with guests.
        </p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="mb-10">
          <div className="flex items-center gap-4">
            <Button href="/requests/manage" className="inline-flex">
              Manage requests
            </Button>
            {copied ? <span className="text-sm text-neutral-600">Link copied.</span> : null}
          </div>
        </div>

        <FadeIn>
          <Border className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-950">Upcoming lists</h3>
              {loading ? <span className="text-xs text-neutral-500">Loading...</span> : null}
            </div>
            <div className="mt-4 space-y-4">
              {upcomingLists.length === 0 && !loading ? (
                <p className="text-sm text-neutral-600">
                  No upcoming request lists yet.
                </p>
              ) : null}
              {upcomingLists.map((list) => (
                <div key={list.id} className="rounded-xl border border-neutral-200 p-4">
                  <p className="text-sm font-semibold text-neutral-950">{list.name}</p>
                  <p className="text-xs text-neutral-500">
                    {list.eventType} · {list.eventDate}
                    {list.eventTime ? ` · ${list.eventTime}` : ''}
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    {list.requestsCount} request{list.requestsCount === 1 ? '' : 's'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => copyLink(list.publicUrl)}
                      className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-600 hover:text-neutral-950"
                    >
                      Copy link
                    </button>
                    <a
                      href={list.publicUrl}
                      className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-600 hover:text-neutral-950"
                    >
                      Open
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Border>
        </FadeIn>
      </Container>
    </>
  )
}
