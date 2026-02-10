import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { normalizeTemplateFields } from '@/lib/eventPortal'
import { buildUniqueTemplateSlug, mapTemplateWithFields } from '@/lib/eventPortalServer'

const prisma = db as any

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.eventPortalTemplate.findUnique({
      where: { id: params.id },
      include: {
        fields: {
          orderBy: { fieldOrder: 'asc' },
        },
        _count: {
          select: { events: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({
      template: {
        ...mapTemplateWithFields(template),
        eventsCount: template._count?.events ?? 0,
      },
    })
  } catch (error) {
    console.error('Error fetching event portal template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event portal template' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.eventPortalTemplate.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { events: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const hasName = typeof body?.name === 'string'
    const hasEventType = typeof body?.eventType === 'string'
    const hasDescription = body && Object.prototype.hasOwnProperty.call(body, 'description')
    const hasArchived = typeof body?.isArchived === 'boolean'
    const hasDefault = typeof body?.isDefault === 'boolean'
    const hasFields = Array.isArray(body?.fields)

    const name = hasName ? body.name.trim() : existing.name
    const eventType = hasEventType ? body.eventType.trim() : existing.eventType
    const description =
      hasDescription && typeof body.description === 'string' && body.description.trim().length > 0
        ? body.description.trim()
        : hasDescription
        ? null
        : existing.description

    if (!name || !eventType) {
      return NextResponse.json(
        { error: 'name and eventType cannot be empty' },
        { status: 400 }
      )
    }

    let normalizedFields: ReturnType<typeof normalizeTemplateFields> | null = null
    if (hasFields) {
      if ((existing._count?.events ?? 0) > 0) {
        return NextResponse.json(
          {
            error:
              'This template already has events. Create a new template to change form fields.',
          },
          { status: 409 }
        )
      }
      normalizedFields = normalizeTemplateFields(body.fields)
      if (normalizedFields.errors.length > 0) {
        return NextResponse.json(
          { error: 'Invalid template fields', details: normalizedFields.errors },
          { status: 400 }
        )
      }
    }

    const slug = name !== existing.name ? await buildUniqueTemplateSlug(name, existing.id) : existing.slug
    const isDefault = hasDefault ? Boolean(body.isDefault) : existing.isDefault

    const template = await prisma.$transaction(async (tx: any) => {
      if (isDefault) {
        await tx.eventPortalTemplate.updateMany({
          where: {
            eventType,
            NOT: { id: existing.id },
          },
          data: { isDefault: false },
        })
      }

      await tx.eventPortalTemplate.update({
        where: { id: existing.id },
        data: {
          name,
          slug,
          eventType,
          description,
          isArchived: hasArchived ? Boolean(body.isArchived) : existing.isArchived,
          isDefault,
        },
      })

      if (normalizedFields) {
        await tx.eventPortalTemplateField.deleteMany({
          where: { templateId: existing.id },
        })
        await tx.eventPortalTemplateField.createMany({
          data: normalizedFields.fields.map((field) => ({
            templateId: existing.id,
            key: field.key,
            label: field.label,
            helperText: field.helperText,
            placeholder: field.placeholder,
            type: field.type,
            required: field.required,
            options: field.options,
            fieldOrder: field.fieldOrder,
          })),
        })
      }

      return tx.eventPortalTemplate.findUnique({
        where: { id: existing.id },
        include: {
          fields: {
            orderBy: { fieldOrder: 'asc' },
          },
          _count: {
            select: { events: true },
          },
        },
      })
    })

    return NextResponse.json({
      template: {
        ...mapTemplateWithFields(template),
        eventsCount: template?._count?.events ?? 0,
      },
    })
  } catch (error) {
    console.error('Error updating event portal template:', error)
    return NextResponse.json(
      { error: 'Failed to update event portal template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.eventPortalTemplate.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { events: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if ((template._count?.events ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a template that is already in use by events.' },
        { status: 409 }
      )
    }

    await prisma.eventPortalTemplate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting event portal template:', error)
    return NextResponse.json(
      { error: 'Failed to delete event portal template' },
      { status: 500 }
    )
  }
}

