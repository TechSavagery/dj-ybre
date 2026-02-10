import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { normalizeTemplateFields } from '@/lib/eventPortal'
import {
  buildUniqueTemplateSlug,
  ensureEventPortalDefaults,
  mapTemplateWithFields,
} from '@/lib/eventPortalServer'

const prisma = db as any

export async function GET(request: NextRequest) {
  try {
    await ensureEventPortalDefaults()

    const url = new URL(request.url)
    const includeArchived = url.searchParams.get('includeArchived') === '1'

    const templates = await prisma.eventPortalTemplate.findMany({
      where: includeArchived ? undefined : { isArchived: false },
      include: {
        fields: {
          orderBy: { fieldOrder: 'asc' },
        },
        _count: {
          select: { events: true },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { eventType: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({
      templates: templates.map((template: any) => ({
        ...mapTemplateWithFields(template),
        eventsCount: template._count?.events ?? 0,
      })),
    })
  } catch (error) {
    console.error('Error fetching event portal templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event portal templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const eventType = typeof body?.eventType === 'string' ? body.eventType.trim() : ''
    const description =
      typeof body?.description === 'string' && body.description.trim().length > 0
        ? body.description.trim()
        : null
    const isDefault = Boolean(body?.isDefault)

    if (!name || !eventType) {
      return NextResponse.json(
        { error: 'name and eventType are required' },
        { status: 400 }
      )
    }

    const normalized = normalizeTemplateFields(body?.fields)
    if (normalized.errors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid template fields', details: normalized.errors },
        { status: 400 }
      )
    }

    const slug = await buildUniqueTemplateSlug(name)

    const template = await prisma.$transaction(async (tx: any) => {
      if (isDefault) {
        await tx.eventPortalTemplate.updateMany({
          where: { eventType },
          data: { isDefault: false },
        })
      }

      return tx.eventPortalTemplate.create({
        data: {
          name,
          slug,
          eventType,
          description,
          isDefault,
          fields: {
            create: normalized.fields.map((field) => ({
              key: field.key,
              label: field.label,
              helperText: field.helperText,
              placeholder: field.placeholder,
              type: field.type,
              required: field.required,
              options: field.options,
              fieldOrder: field.fieldOrder,
            })),
          },
        },
        include: {
          fields: {
            orderBy: { fieldOrder: 'asc' },
          },
        },
      })
    })

    return NextResponse.json(
      {
        template: mapTemplateWithFields(template),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating event portal template:', error)
    return NextResponse.json(
      { error: 'Failed to create event portal template' },
      { status: 500 }
    )
  }
}

