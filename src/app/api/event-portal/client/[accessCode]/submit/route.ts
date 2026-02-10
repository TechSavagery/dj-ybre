import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { normalizeSubmissionAnswers } from '@/lib/eventPortal'
import { extractSpotifyTrackIdsFromAnswers } from '@/lib/eventPortalServer'
import {
  addTracksToSpotifyPlaylist,
  getUserAccessToken,
  removeTracksFromSpotifyPlaylist,
} from '@/lib/spotify'

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

export async function POST(
  request: NextRequest,
  { params }: { params: { accessCode: string } }
) {
  try {
    const event = await prisma.eventPortalEvent.findUnique({
      where: { accessCode: params.accessCode },
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
      return NextResponse.json({ error: 'Event form not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const normalized = normalizeSubmissionAnswers(
      Array.isArray(event.template?.fields)
        ? event.template.fields.map((field: any) => ({
            id: field.id,
            key: field.key,
            label: field.label,
            type: field.type,
            required: Boolean(field.required),
            options: field.options,
          }))
        : [],
      body?.answers
    )

    if (normalized.errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: normalized.errors,
        },
        { status: 400 }
      )
    }

    const previousSpotifyTrackIds = event.submission
      ? extractSpotifyTrackIdsFromAnswers(event.submission.answers || [])
      : []

    const savedSubmission = await prisma.$transaction(async (tx: any) => {
      const submission = event.submission
        ? await tx.eventPortalSubmission.update({
            where: { id: event.submission.id },
            data: {},
          })
        : await tx.eventPortalSubmission.create({
            data: {
              eventId: event.id,
            },
          })

      await tx.eventPortalSubmissionAnswer.deleteMany({
        where: { submissionId: submission.id },
      })

      if (normalized.answers.length > 0) {
        await tx.eventPortalSubmissionAnswer.createMany({
          data: normalized.answers.map((answer) => ({
            submissionId: submission.id,
            fieldId: answer.fieldId,
            valueText: answer.valueText,
            valueJson: answer.valueJson,
          })),
        })
      }

      return tx.eventPortalSubmission.findUnique({
        where: { id: submission.id },
        include: {
          answers: {
            include: {
              field: true,
            },
          },
        },
      })
    })

    let spotifyWarning: string | null = null
    if (event.spotifyPlaylistId) {
      const nextTrackIds = Array.from(new Set(normalized.spotifyTrackIds))
      const previousSet = new Set(previousSpotifyTrackIds)
      const nextSet = new Set(nextTrackIds)
      const toRemove = previousSpotifyTrackIds.filter((id) => !nextSet.has(id))
      const toAdd = nextTrackIds.filter((id) => !previousSet.has(id))

      if (toRemove.length > 0 || toAdd.length > 0) {
        const cookieToken = request.cookies.get('spotify_access_token')?.value
        try {
          const accessToken = await getUserAccessToken(cookieToken)
          if (toRemove.length > 0) {
            await removeTracksFromSpotifyPlaylist(accessToken, event.spotifyPlaylistId, toRemove)
          }
          if (toAdd.length > 0) {
            await addTracksToSpotifyPlaylist(accessToken, event.spotifyPlaylistId, toAdd)
          }
        } catch (error) {
          console.error('Failed to sync event portal Spotify playlist:', error)
          spotifyWarning =
            'Your form was saved, but Spotify playlist sync was not successful.'
        }
      }
    }

    const answersByKey: Record<string, unknown> = {}
    for (const answer of savedSubmission?.answers || []) {
      const key = answer?.field?.key
      if (!key) continue
      answersByKey[key] = toAnswerValue(answer)
    }

    return NextResponse.json({
      submission: {
        id: savedSubmission?.id,
        submittedAt: savedSubmission?.submittedAt,
        updatedAt: savedSubmission?.updatedAt,
        answersByKey,
      },
      warning: spotifyWarning,
    })
  } catch (error) {
    console.error('Error submitting event portal form:', error)
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    )
  }
}

