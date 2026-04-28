import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  buildUniqueEventTypeSlug,
  ensureEventPortalDefaults,
} from '@/lib/eventPortalServer'

const prisma = db as any

function mapEventType(eventType: any) {
  return {
    id: eventType.id,
    name: eventType.name,
    slug: eventType.slug,
    isSystem: Boolean(eventType.isSystem),
    isActive: Boolean(eventType.isActive),
    createdAt: eventType.createdAt,
    updatedAt: eventType.updatedAt,
    templatesCount: eventType._count?.templates ?? 0,
    eventsCount: eventType._count?.events ?? 0,
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureEventPortalDefaults()

    const url = new URL(request.url)
    const includeInactive = url.searchParams.get('includeInactive') === '1'
    const eventTypes = await prisma.eventPortalEventType.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        _count: {
          select: {
            templates: true,
            events: true,
          },
        },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json({
      eventTypes: eventTypes.map((eventType: any) => mapEventType(eventType)),
    })
  } catch (error) {
    console.error('Error fetching event portal event types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event types' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const name = typeof body?.name === 'string' ? body.name.trim() : ''

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const existing = await prisma.eventPortalEventType.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      include: {
        _count: {
          select: {
            templates: true,
            events: true,
          },
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An event type with this name already exists.', eventType: mapEventType(existing) },
        { status: 409 }
      )
    }

    const slug = await buildUniqueEventTypeSlug(name)
    const eventType = await prisma.eventPortalEventType.create({
      data: {
        name,
        slug,
        isSystem: false,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            templates: true,
            events: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        eventType: mapEventType(eventType),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating event portal event type:', error)
    return NextResponse.json(
      { error: 'Failed to create event type' },
      { status: 500 }
    )
  }
}

