import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { createSpotifyPlaylist, getUserAccessToken } from '@/lib/spotify'
import { ensureEventPortalDefaults, mapEventSummary } from '@/lib/eventPortalServer'

const prisma = db as any

function formatLocalDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function generateUniqueAccessCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = crypto.randomBytes(10).toString('hex')
    const existing = await prisma.eventPortalEvent.findUnique({
      where: { accessCode: candidate },
      select: { id: true },
    })
    if (!existing) {
      return candidate
    }
  }
  throw new Error('Failed to generate a unique access code')
}

export async function GET(request: NextRequest) {
  try {
    await ensureEventPortalDefaults()

    const url = new URL(request.url)
    const includePast = url.searchParams.get('includePast') === '1'
    const today = formatLocalDate(new Date())

    const events = await prisma.eventPortalEvent.findMany({
      where: includePast
        ? undefined
        : {
            eventDate: { gte: today },
          },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        submission: {
          select: {
            id: true,
            submittedAt: true,
          },
        },
      },
      orderBy: includePast
        ? [{ createdAt: 'desc' }]
        : [{ eventDate: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({
      events: events.map((event: any) => mapEventSummary(event)),
    })
  } catch (error) {
    console.error('Error fetching event portal events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event portal events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const templateId = typeof body?.templateId === 'string' ? body.templateId.trim() : ''
    const eventName = typeof body?.eventName === 'string' ? body.eventName.trim() : ''
    const eventDate = typeof body?.eventDate === 'string' ? body.eventDate.trim() : ''
    const clientName = typeof body?.clientName === 'string' ? body.clientName.trim() : ''
    const clientEmail =
      typeof body?.clientEmail === 'string' && body.clientEmail.trim().length > 0
        ? body.clientEmail.trim()
        : null
    const notes =
      typeof body?.notes === 'string' && body.notes.trim().length > 0
        ? body.notes.trim()
        : null
    const eventTypeRaw = typeof body?.eventType === 'string' ? body.eventType.trim() : ''
    const eventStartTime =
      typeof body?.eventStartTime === 'string' && body.eventStartTime.trim().length > 0
        ? body.eventStartTime.trim()
        : null
    const eventEndTime =
      typeof body?.eventEndTime === 'string' && body.eventEndTime.trim().length > 0
        ? body.eventEndTime.trim()
        : null

    if (!templateId || !eventName || !eventDate || !clientName) {
      return NextResponse.json(
        { error: 'templateId, eventName, eventDate, and clientName are required' },
        { status: 400 }
      )
    }

    const template = await prisma.eventPortalTemplate.findUnique({
      where: { id: templateId },
      include: {
        fields: true,
      },
    })

    if (!template || template.isArchived) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (!Array.isArray(template.fields) || template.fields.length === 0) {
      return NextResponse.json(
        { error: 'Selected template does not have any form fields' },
        { status: 400 }
      )
    }

    const eventType = eventTypeRaw || template.eventType

    const cookieToken = request.cookies.get('spotify_access_token')?.value
    let accessToken: string
    try {
      accessToken = await getUserAccessToken(cookieToken)
    } catch {
      return NextResponse.json(
        { error: 'Not authenticated with Spotify' },
        { status: 401 }
      )
    }

    let playlist
    try {
      const playlistName = `${eventName} - Client Requests`
      const description = `Event portal requests for ${eventName} (${eventType} on ${eventDate}).`
      playlist = await createSpotifyPlaylist(accessToken, playlistName, description, false)
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to create Spotify playlist' },
        { status: 502 }
      )
    }

    const accessCode = await generateUniqueAccessCode()
    const event = await prisma.eventPortalEvent.create({
      data: {
        templateId,
        accessCode,
        eventName,
        eventType,
        eventDate,
        eventStartTime,
        eventEndTime,
        clientName,
        clientEmail,
        notes,
        status: 'sent',
        spotifyPlaylistId: playlist?.id ?? null,
        spotifyPlaylistUrl: playlist?.external_urls?.spotify ?? null,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        submission: {
          select: {
            id: true,
            submittedAt: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        event: mapEventSummary(event),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating event portal event:', error)
    return NextResponse.json(
      { error: 'Failed to create event portal event' },
      { status: 500 }
    )
  }
}

