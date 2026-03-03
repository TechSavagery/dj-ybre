import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  createPortalUnlockCookieValue,
  getPortalUnlockCookieName,
  isValidPortalPin,
  normalizePortalPin,
  verifyPortalPin,
} from '@/lib/eventPortalAccess'

const prisma = db as any

export async function POST(
  request: NextRequest,
  { params }: { params: { accessCode: string } }
) {
  try {
    const event = await prisma.eventPortalEvent.findUnique({
      where: { accessCode: params.accessCode },
      select: {
        id: true,
        accessCode: true,
        accessPinHash: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event form not found' }, { status: 404 })
    }

    if (!event.accessPinHash) {
      const response = NextResponse.json({ ok: true, unlocked: true })
      response.cookies.set({
        name: getPortalUnlockCookieName(),
        value: createPortalUnlockCookieValue({ accessCode: event.accessCode }),
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 14,
      })
      return response
    }

    const body = await request.json().catch(() => ({}))
    const pin = normalizePortalPin(body?.pin)
    if (!isValidPortalPin(pin)) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
    }

    const ok = verifyPortalPin(pin, event.accessPinHash)
    if (!ok) {
      return NextResponse.json({ error: 'Incorrect code' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true, unlocked: true })
    response.cookies.set({
      name: getPortalUnlockCookieName(),
      value: createPortalUnlockCookieValue({ accessCode: event.accessCode }),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    })
    return response
  } catch (error) {
    console.error('Error unlocking event portal:', error)
    return NextResponse.json({ error: 'Failed to unlock portal' }, { status: 500 })
  }
}

