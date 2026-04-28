import { NextRequest, NextResponse } from 'next/server'
import { cleanTransitionNotes } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { notes, tracks, transitionTypes } = await request.json()

    if (typeof notes !== 'string' || notes.trim().length === 0) {
      return NextResponse.json(
        { error: 'Notes are required' },
        { status: 400 }
      )
    }

    const cleanedNotes = await cleanTransitionNotes(notes, {
      tracks: Array.isArray(tracks) ? tracks : undefined,
      transitionTypes: Array.isArray(transitionTypes) ? transitionTypes : undefined,
    })

    return NextResponse.json({ notes: cleanedNotes })
  } catch (error) {
    console.error('Clean transition notes error:', error)
    return NextResponse.json(
      { error: 'Failed to clean notes' },
      { status: 500 }
    )
  }
}
