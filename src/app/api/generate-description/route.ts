import { NextRequest, NextResponse } from 'next/server'
import { generatePlaylistDescription, type PlaylistContext } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const context: PlaylistContext = await request.json()
    const description = await generatePlaylistDescription(context)
    return NextResponse.json({ description })
  } catch (error) {
    console.error('Generate description error:', error)
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    )
  }
}













