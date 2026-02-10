import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserAccessToken, unfollowSpotifyPlaylist } from '@/lib/spotify'
import {
  extractSpotifyTrackIdsFromAnswers,
  mapEventSummary,
  mapTemplateWithFields,
} from '@/lib/eventPortalServer'

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
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.eventPortalEvent.findUnique({
      where: { id: params.id },
      include: {
        template: {
          include: {
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
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const answersByKey: Record<string, unknown> = {}
    const answers = Array.isArray(event.submission?.answers)
      ? event.submission.answers.map((answer: any) => {
          const value = toAnswerValue(answer)
          answersByKey[answer.field?.key || answer.fieldId] = value
          return {
            id: answer.id,
            fieldId: answer.fieldId,
            fieldKey: answer.field?.key ?? '',
            label: answer.field?.label ?? '',
            type: answer.field?.type ?? '',
            required: Boolean(answer.field?.required),
            value,
          }
        })
      : []

    return NextResponse.json({
      event: mapEventSummary(event),
      template: mapTemplateWithFields(event.template),
      submission: event.submission
        ? {
            id: event.submission.id,
            submittedAt: event.submission.submittedAt,
            updatedAt: event.submission.updatedAt,
            answers,
            answersByKey,
            spotifyTrackIds: extractSpotifyTrackIdsFromAnswers(event.submission.answers || []),
          }
        : null,
    })
  } catch (error) {
    console.error('Error fetching event portal event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event portal event' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.eventPortalEvent.findUnique({
      where: { id: params.id },
      include: {
        submission: {
          select: { id: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const templateId =
      typeof body?.templateId === 'string' && body.templateId.trim().length > 0
        ? body.templateId.trim()
        : existing.templateId
    const eventName =
      typeof body?.eventName === 'string' && body.eventName.trim().length > 0
        ? body.eventName.trim()
        : existing.eventName
    const eventType =
      typeof body?.eventType === 'string' && body.eventType.trim().length > 0
        ? body.eventType.trim()
        : existing.eventType
    const eventDate =
      typeof body?.eventDate === 'string' && body.eventDate.trim().length > 0
        ? body.eventDate.trim()
        : existing.eventDate
    const clientName =
      typeof body?.clientName === 'string' && body.clientName.trim().length > 0
        ? body.clientName.trim()
        : existing.clientName
    const clientEmail =
      typeof body?.clientEmail === 'string'
        ? body.clientEmail.trim() || null
        : existing.clientEmail
    const eventStartTime =
      typeof body?.eventStartTime === 'string'
        ? body.eventStartTime.trim() || null
        : existing.eventStartTime
    const eventEndTime =
      typeof body?.eventEndTime === 'string'
        ? body.eventEndTime.trim() || null
        : existing.eventEndTime
    const notes =
      typeof body?.notes === 'string' ? body.notes.trim() || null : existing.notes
    const status =
      typeof body?.status === 'string' && body.status.trim().length > 0
        ? body.status.trim()
        : existing.status

    if (templateId !== existing.templateId && existing.submission) {
      return NextResponse.json(
        { error: 'Cannot change template after a client has submitted the form.' },
        { status: 409 }
      )
    }

    if (templateId !== existing.templateId) {
      const template = await prisma.eventPortalTemplate.findUnique({
        where: { id: templateId },
        select: { id: true, isArchived: true },
      })
      if (!template || template.isArchived) {
        return NextResponse.json(
          { error: 'Selected template was not found' },
          { status: 404 }
        )
      }
    }

    const updated = await prisma.eventPortalEvent.update({
      where: { id: existing.id },
      data: {
        templateId,
        eventName,
        eventType,
        eventDate,
        eventStartTime,
        eventEndTime,
        clientName,
        clientEmail,
        notes,
        status,
      },
      include: {
        template: {
          select: { id: true, name: true },
        },
        submission: {
          select: { id: true, submittedAt: true },
        },
      },
    })

    return NextResponse.json({
      event: mapEventSummary(updated),
    })
  } catch (error) {
    console.error('Error updating event portal event:', error)
    return NextResponse.json(
      { error: 'Failed to update event portal event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.eventPortalEvent.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        spotifyPlaylistId: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.spotifyPlaylistId) {
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

      try {
        await unfollowSpotifyPlaylist(accessToken, event.spotifyPlaylistId)
      } catch (spotifyError) {
        console.error('Failed to unfollow Spotify playlist:', spotifyError)
        return NextResponse.json(
          { error: 'Failed to delete Spotify playlist' },
          { status: 502 }
        )
      }
    }

    await prisma.eventPortalEvent.delete({
      where: { id: event.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting event portal event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event portal event' },
      { status: 500 }
    )
  }
}

