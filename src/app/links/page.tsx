import { type Metadata } from 'next'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { List, ListItem } from '@/components/List'
import { PageIntro } from '@/components/PageIntro'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const prisma = db as any

const links = [
  {
    title: 'Instagram',
    description: 'Behind-the-scenes clips, mixes, and upcoming gigs.',
    href: 'https://instagram.com/djybre',
    cta: 'Follow on Instagram',
  },
  {
    title: 'Tip YBRE',
    description: 'Show some love if you are feeling the vibes tonight.',
    href: 'https://buy.stripe.com/9B68wO4Sl121572aA71kA00',
    cta: 'Send a tip',
  },
  {
    title: 'Book a set',
    description: 'Lock in a date for weddings, parties, or corporate events.',
    href: '/contact',
    cta: 'Book now',
  },
]

export const metadata: Metadata = {
  title: 'Links',
  description: 'Quick links for DJ YBRE.',
}

function formatLocalDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseEventStart(eventDate: string, eventTime?: string | null) {
  const [year, month, day] = String(eventDate).split('-').map(Number)
  if (!year || !month || !day) return null

  let hour = 0
  let minute = 0
  if (eventTime) {
    const [h, min] = String(eventTime).split(':').map(Number)
    if (!Number.isNaN(h)) hour = h
    if (!Number.isNaN(min)) minute = min
  }

  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

function parseEventEnd(start: Date, eventDate: string, eventEndTime?: string | null) {
  if (!eventEndTime) return start
  const [year, month, day] = String(eventDate).split('-').map(Number)
  if (!year || !month || !day) return start

  const [h, min] = String(eventEndTime).split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(min)) return start

  const end = new Date(year, month - 1, day, h, min, 0, 0)
  // If the end time is earlier than the start time, assume it ends after midnight.
  if (end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1)
  }
  return end
}

function formatDate(dateString?: string) {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) return dateString
  return new Date(year, month - 1, day).toLocaleDateString()
}

function formatTime(timeString?: string | null) {
  if (!timeString) return ''
  const [hour, minute] = timeString.split(':').map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return timeString
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

async function getUpcomingRequestListWithinTwoDays() {
  const now = new Date()
  const nowTime = now.getTime()
  const windowStart = nowTime - 48 * 60 * 60 * 1000
  const windowEnd = nowTime + 48 * 60 * 60 * 1000

  const twoDaysBack = formatLocalDate(new Date(windowStart))
  const twoDaysOut = formatLocalDate(new Date(windowEnd))

  const lists = await prisma.songRequestList.findMany({
    where: {
      // eventDate is stored as YYYY-MM-DD, so lexicographic compare works.
      eventDate: { gte: twoDaysBack, lte: twoDaysOut },
    },
    orderBy: [{ eventDate: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      eventType: true,
      eventDate: true,
      eventTime: true,
      eventEndTime: true,
    },
  })

  const futureCandidates: Array<{
    id: string
    name: string
    eventType: string
    eventDate: string
    eventTime: string | null
    eventEndTime: string | null
    eventStart: Date
    eventEnd: Date
  }> = []

  const activeCandidates: Array<{
    id: string
    name: string
    eventType: string
    eventDate: string
    eventTime: string | null
    eventEndTime: string | null
    eventStart: Date
    eventEnd: Date
  }> = []

  for (const list of lists as Array<any>) {
    const start = parseEventStart(list.eventDate, list.eventTime)
    if (!start) continue
    const startTime = start.getTime()
    const end = parseEventEnd(start, list.eventDate, list.eventEndTime)
    const endTime = end.getTime()

    // Only show within 48 hours before start, and until end time.
    if (nowTime < startTime - 48 * 60 * 60 * 1000) continue
    if (nowTime > endTime) continue

    const candidate = {
      id: list.id,
      name: list.name,
      eventType: list.eventType,
      eventDate: list.eventDate,
      eventTime: list.eventTime ?? null,
      eventEndTime: list.eventEndTime ?? null,
      eventStart: start,
      eventEnd: end,
    }

    if (startTime > nowTime) {
      // Not started yet.
      if (startTime > windowEnd) continue
      futureCandidates.push(candidate)
    } else {
      // Active event (started, not ended).
      if (startTime < windowStart) continue
      activeCandidates.push(candidate)
    }
  }

  futureCandidates.sort((a, b) => a.eventStart.getTime() - b.eventStart.getTime())
  if (futureCandidates.length > 0) return futureCandidates[0]

  activeCandidates.sort((a, b) => b.eventStart.getTime() - a.eventStart.getTime())
  return activeCandidates[0] ?? null
}

export default async function LinksPage() {
  const upcoming = await getUpcomingRequestListWithinTwoDays()

  return (
    <>
      <PageIntro eyebrow="Links" title="Quick links for DJ YBRE">
        <p>Thanks for the energy. Tap a link to stay connected.</p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <List className="max-w-2xl">
          {upcoming ? (
            <ListItem title="Request a song">
              <p>
                {upcoming.name} · {upcoming.eventType} · {formatDate(upcoming.eventDate)}
                {upcoming.eventTime ? ` · ${formatTime(upcoming.eventTime)}` : ''}
                {upcoming.eventEndTime ? ` - ${formatTime(upcoming.eventEndTime)}` : ''}
              </p>
              <div className="mt-4">
                <Button href={`/requests/${upcoming.id}`}>Request a song</Button>
              </div>
            </ListItem>
          ) : null}

          {links.map((link) => (
            <ListItem key={link.title} title={link.title}>
              <p>{link.description}</p>
              <div className="mt-4">
                <Button href={link.href}>{link.cta}</Button>
              </div>
            </ListItem>
          ))}
        </List>
      </Container>
    </>
  )
}

