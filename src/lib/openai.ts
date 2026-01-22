import OpenAI from 'openai'

let _openai: OpenAI | null = null
function getOpenAIClient(): OpenAI {
  if (_openai) return _openai

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // IMPORTANT: don't throw at module import time; it breaks `next build` when env vars
    // aren't present in CI/host and the route isn't invoked.
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }

  _openai = new OpenAI({ apiKey })
  return _openai
}

export interface PlaylistContext {
  eventType: string
  playlistDuration: number
  graduationYear1?: number
  graduationYear2?: number
  hometown1?: string
  hometown2?: string
  college1?: string
  college2?: string
  lastConcert1?: string
  lastConcert2?: string
  lastConcert3?: string
  eventDescription?: string
  inspirationTracks?: string[]
  inspirationArtists?: string[]
}

export async function generatePlaylistSuggestions(
  context: PlaylistContext,
  targetDuration: number
): Promise<string[]> {
  const prompt = buildPlaylistPrompt(context, targetDuration)

  const openai = getOpenAIClient()
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are an expert music curator and DJ with deep knowledge of music across all genres and eras. 
        Your task is to suggest songs that perfectly match the context and vibe described by the user.
        Return ONLY a JSON array of song titles with artist names in the format: "Song Title - Artist Name".
        Do not include any other text, explanations, or formatting.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  })

  const content = completion.choices[0]?.message?.content || '[]'
  
  try {
    // Try to parse as JSON array
    const suggestions = JSON.parse(content)
    if (Array.isArray(suggestions)) {
      return suggestions
    }
    // If not JSON, try to extract from text
    return extractSongSuggestions(content)
  } catch {
    // If parsing fails, extract from text
    return extractSongSuggestions(content)
  }
}

function buildPlaylistPrompt(context: PlaylistContext, targetDuration: number): string {
  const parts: string[] = []
  
  parts.push(`Create a playlist for a ${context.eventType} event.`)
  
  if (context.eventDescription) {
    parts.push(`Event description: ${context.eventDescription}`)
  }
  
  parts.push(`Target duration: ${targetDuration} minutes (approximately ${Math.round(targetDuration / 3.5)} songs)`)
  
  if (context.graduationYear1 || context.graduationYear2) {
    const years = [context.graduationYear1, context.graduationYear2].filter(Boolean)
    parts.push(`Graduation years: ${years.join(', ')} (suggest music from their high school/college era)`)
  }
  
  if (context.hometown1 || context.hometown2) {
    const towns = [context.hometown1, context.hometown2].filter(Boolean)
    parts.push(`Hometowns: ${towns.join(', ')}`)
  }
  
  if (context.college1 || context.college2) {
    const colleges = [context.college1, context.college2].filter(Boolean)
    parts.push(`Colleges: ${colleges.join(', ')}`)
  }
  
  if (context.lastConcert1 || context.lastConcert2 || context.lastConcert3) {
    const concerts = [
      context.lastConcert1,
      context.lastConcert2,
      context.lastConcert3,
    ].filter(Boolean)
    parts.push(`Recent concerts attended: ${concerts.join(', ')}`)
  }
  
  if (context.inspirationArtists && context.inspirationArtists.length > 0) {
    parts.push(`Inspiration artists: ${context.inspirationArtists.join(', ')}`)
  }
  
  if (context.inspirationTracks && context.inspirationTracks.length > 0) {
    parts.push(`Inspiration tracks: ${context.inspirationTracks.join(', ')}`)
  }
  
  parts.push(`
    Suggest a diverse mix of songs that:
    1. Match the event type and vibe
    2. Include music from the eras when they were in high school/college
    3. Incorporate similar artists/genres to their inspiration
    4. Have good flow and energy progression
    5. Are appropriate for the event type
    
    Return a JSON array of song suggestions in the format: ["Song Title - Artist Name", ...]
  `)
  
  return parts.join('\n')
}

function extractSongSuggestions(text: string): string[] {
  // Try to extract song-artist pairs from various formats
  const lines = text.split('\n').filter(line => line.trim())
  const suggestions: string[] = []
  
  for (const line of lines) {
    // Match patterns like "Song - Artist" or "Song by Artist"
    const match = line.match(/["']?([^"']+?)\s*[-–—]\s*([^"']+?)["']?/i) ||
                   line.match(/["']?([^"']+?)\s+by\s+([^"']+?)["']?/i)
    
    if (match) {
      suggestions.push(`${match[1].trim()} - ${match[2].trim()}`)
    } else if (line.includes('-') && !line.startsWith('-')) {
      // Fallback: split by dash
      const parts = line.split('-').map(p => p.trim())
      if (parts.length >= 2) {
        suggestions.push(`${parts[0]} - ${parts.slice(1).join(' - ')}`)
      }
    }
  }
  
  return suggestions
}

export async function analyzePlaylistInteractions(
  heartedTracks: Array<{ name: string; artist: string; genres?: string[] }>,
  removedTracks: Array<{ name: string; artist: string; genres?: string[] }>
): Promise<{ preferences: string; suggestions: string[] }> {
  const prompt = `Analyze these playlist interactions:

HEARTED TRACKS (user likes):
${heartedTracks.map(t => `- ${t.name} by ${t.artist}${t.genres ? ` (${t.genres.join(', ')})` : ''}`).join('\n')}

REMOVED TRACKS (user dislikes):
${removedTracks.map(t => `- ${t.name} by ${t.artist}${t.genres ? ` (${t.genres.join(', ')})` : ''}`).join('\n')}

Based on these interactions, identify:
1. Musical preferences (genres, eras, energy levels, styles)
2. What to avoid
3. 10 replacement song suggestions that match the preferences

Return a JSON object with:
{
  "preferences": "description of user preferences",
  "suggestions": ["Song Title - Artist Name", ...]
}`

  const openai = getOpenAIClient()
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a music analysis expert. Analyze user preferences and suggest replacements.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  })

  const content = completion.choices[0]?.message?.content || '{}'
  
  try {
    return JSON.parse(content)
  } catch {
    return {
      preferences: 'Unable to analyze preferences',
      suggestions: [],
    }
  }
}

export async function orderPlaylist(
  tracks: Array<{
    name: string
    artist: string
    duration: number
    bpm?: number
    energy?: number
    valence?: number
    genres?: string[]
  }>,
  eventType: string
): Promise<number[]> {
  const prompt = `Order these ${tracks.length} tracks for a ${eventType} playlist to create optimal flow:

${tracks.map((t, i) => 
  `${i}: ${t.name} by ${t.artist} (${Math.round(t.duration / 1000)}s${t.bpm ? `, ${t.bpm} BPM` : ''}${t.energy ? `, energy: ${t.energy}` : ''}${t.genres ? `, genres: ${t.genres.join(', ')}` : ''})`
).join('\n')}

Consider:
1. Energy flow (build-up, peaks, cool-downs)
2. BPM transitions (smooth changes)
3. Genre transitions (natural flow)
4. Event timeline (if ${eventType}, consider ceremony → reception → party flow)

Return ONLY a JSON array of track indices in the optimal order, e.g., [5, 2, 8, ...]`

  const openai = getOpenAIClient()
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a DJ expert at sequencing tracks for optimal flow and energy.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.6,
    max_tokens: 1000,
  })

  const content = completion.choices[0]?.message?.content || '[]'
  
  try {
    const order = JSON.parse(content)
    if (Array.isArray(order) && order.every((i: any) => typeof i === 'number')) {
      return order
    }
  } catch {
    // Fallback: return original order
  }
  
  return tracks.map((_, i) => i)
}

export async function generatePlaylistDescription(context: PlaylistContext): Promise<string> {
  const prompt = `Create a compelling, personalized description for a ${context.eventType} playlist based on:

${JSON.stringify(context, null, 2)}

Write 2-3 sentences that capture the vibe, era, and personal touches. Make it engaging and specific.`

  const openai = getOpenAIClient()
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a creative writer specializing in music descriptions.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 200,
  })

  return completion.choices[0]?.message?.content || 'A carefully curated playlist for your special event.'
}













