import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

const prisma = db as any
const SESSION_COOKIE = 'song_request_session'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; songId: string } }
) {
  let sessionKey = request.cookies.get(SESSION_COOKIE)?.value
  let shouldSetCookie = false

  if (!sessionKey) {
    sessionKey = crypto.randomUUID()
    shouldSetCookie = true
  }

  try {
    const track = await prisma.songRequestTrack.findFirst({
      where: {
        id: params.songId,
        listId: params.id,
      },
    })

    if (!track) {
      return NextResponse.json(
        { error: 'Requested song not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      await tx.songRequestVote.create({
        data: {
          requestId: track.id,
          sessionKey,
        },
      })

      return tx.songRequestTrack.update({
        where: { id: track.id },
        data: { voteCount: { increment: 1 } },
      })
    })

    const response = NextResponse.json(
      { request: updated, hasVoted: true },
      { status: 201 }
    )

    if (shouldSetCookie && sessionKey) {
      response.cookies.set(SESSION_COOKIE, sessionKey, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      })
    }

    return response
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.songRequestTrack.findFirst({
        where: {
          id: params.songId,
          listId: params.id,
        },
      })

      const response = NextResponse.json(
        {
          error: 'You already boosted this song.',
          request: existing,
          hasVoted: true,
        },
        { status: 409 }
      )

      if (shouldSetCookie && sessionKey) {
        response.cookies.set(SESSION_COOKIE, sessionKey, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
        })
      }

      return response
    }

    console.error('Error voting for song request:', error)
    return NextResponse.json(
      { error: 'Failed to vote for song request' },
      { status: 500 }
    )
  }
}
