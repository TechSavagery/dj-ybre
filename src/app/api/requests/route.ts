import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const prisma = db as any

export async function GET() {
  try {
    const lists = await prisma.songRequestList.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { requests: true },
        },
      },
    })

    return NextResponse.json({
      lists: lists.map((list: any) => ({
        id: list.id,
        name: list.name,
        eventType: list.eventType,
        eventDate: list.eventDate,
        eventTime: list.eventTime,
        createdAt: list.createdAt,
        requestsCount: list._count?.requests ?? 0,
        publicUrl: `/requests/${list.id}`,
      })),
    })
  } catch (error) {
    console.error('Error fetching request lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request lists' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const eventType = typeof body?.eventType === 'string' ? body.eventType.trim() : ''
    const eventDate = typeof body?.eventDate === 'string' ? body.eventDate.trim() : ''
    const eventTime = typeof body?.eventTime === 'string' ? body.eventTime.trim() : null

    if (!name || !eventType || !eventDate) {
      return NextResponse.json(
        { error: 'name, eventType, and eventDate are required' },
        { status: 400 }
      )
    }

    const list = await prisma.songRequestList.create({
      data: {
        name,
        eventType,
        eventDate,
        eventTime: eventTime || null,
      },
    })

    return NextResponse.json(
      {
        list: {
          id: list.id,
          name: list.name,
          eventType: list.eventType,
          eventDate: list.eventDate,
          eventTime: list.eventTime,
          createdAt: list.createdAt,
          publicUrl: `/requests/${list.id}`,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating request list:', error)
    return NextResponse.json(
      { error: 'Failed to create request list' },
      { status: 500 }
    )
  }
}
