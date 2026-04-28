import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildUniqueEventTypeSlug } from '@/lib/eventPortalServer'

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.eventPortalEventType.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            templates: true,
            events: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Event type not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const hasName = typeof body?.name === 'string'
    const hasActive = typeof body?.isActive === 'boolean'

    if (!hasName && !hasActive) {
      return NextResponse.json(
        { error: 'At least one of name or isActive must be provided' },
        { status: 400 }
      )
    }

    const name = hasName ? body.name.trim() : existing.name
    if (!name) {
      return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
    }

    if (hasName && name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.eventPortalEventType.findFirst({
        where: {
          id: { not: existing.id },
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'An event type with this name already exists.' },
          { status: 409 }
        )
      }
    }

    const slug =
      hasName && name.toLowerCase() !== existing.name.toLowerCase()
        ? await buildUniqueEventTypeSlug(name, existing.id)
        : existing.slug

    const updated = await prisma.eventPortalEventType.update({
      where: { id: existing.id },
      data: {
        name,
        slug,
        isActive: hasActive ? Boolean(body.isActive) : existing.isActive,
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

    return NextResponse.json({ eventType: mapEventType(updated) })
  } catch (error) {
    console.error('Error updating event portal event type:', error)
    return NextResponse.json(
      { error: 'Failed to update event type' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.eventPortalEventType.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            templates: true,
            events: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Event type not found' }, { status: 404 })
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { error: 'System event types cannot be deleted.' },
        { status: 409 }
      )
    }

    if ((existing._count?.templates ?? 0) > 0 || (existing._count?.events ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete an event type that is already in use.' },
        { status: 409 }
      )
    }

    await prisma.eventPortalEventType.delete({
      where: { id: existing.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting event portal event type:', error)
    return NextResponse.json(
      { error: 'Failed to delete event type' },
      { status: 500 }
    )
  }
}

