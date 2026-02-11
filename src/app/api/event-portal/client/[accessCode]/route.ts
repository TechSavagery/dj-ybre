import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mapTemplateWithFields } from '@/lib/eventPortalServer'

const prisma = db as any

function toAnswerValue(answer: any) {
  const type = String(answer?.field?.type || '')
  if (type === 'multi_select') {
    return Array.isArray(answer?.valueJson) ? answer.valueJson : []
  }
  if (type === 'checkbox') {
    return Boolean(answer?.valueJson)
  }
  if (type === 'spotify_tracks') {
    return Array.isArray(answer?.valueJson) ? answer.valueJson : []
  }
  if (type === 'number') {
    return answer?.valueText ? Number(answer.valueText) : null
  }
  return answer?.valueText ?? ''
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { accessCode: string } }
) {
  try {
    const event = await prisma.eventPortalEvent.findUnique({
      where: { accessCode: params.accessCode },
      include: {
        eventType: true,
        template: {
          include: {
            eventType: true,
            fields: {
              orderBy: { fieldOrder: 'asc' },
            },
          },
        },
        submission: {
          include: {
            answers: {
              include: {
                field: true,
              },
            },
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event form not found' }, { status: 404 })
    }

    const answersByKey: Record<string, unknown> = {}
    if (Array.isArray(event.submission?.answers)) {
      for (const answer of event.submission.answers) {
        const key = answer?.field?.key
        if (!key) continue
        answersByKey[key] = toAnswerValue(answer)
      }
    }

    return NextResponse.json({
      event: {
        id: event.id,
        eventName: event.eventName,
        eventTypeId: event.eventTypeId,
        eventType: event.eventType?.name ?? null,
        eventTypeSlug: event.eventType?.slug ?? null,
        eventDate: event.eventDate,
        eventStartTime: event.eventStartTime ?? null,
        eventEndTime: event.eventEndTime ?? null,
        clientName: event.clientName,
        status: event.status,
      },
      template: mapTemplateWithFields(event.template),
      submission: event.submission
        ? {
            id: event.submission.id,
            submittedAt: event.submission.submittedAt,
            updatedAt: event.submission.updatedAt,
            answersByKey,
          }
        : null,
    })
  } catch (error) {
    console.error('Error loading public event portal form:', error)
    return NextResponse.json(
      { error: 'Failed to load event form' },
      { status: 500 }
    )
  }
}

