import OpenAI from 'openai'
import { TRANSITION_TYPES, type TransitionType } from '@/lib/transitions'

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

export type AIChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function runTextCompletion({
  messages,
  temperature = 0.7,
  maxTokens = 1000,
  fallback = '',
}: {
  messages: AIChatMessage[]
  temperature?: number
  maxTokens?: number
  fallback?: string
}): Promise<string> {
  const openai = getOpenAIClient()
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    temperature,
    max_tokens: maxTokens,
  })

  return completion.choices[0]?.message?.content?.trim() || fallback
}

export async function runJsonCompletion<T>({
  messages,
  temperature = 0.7,
  maxTokens = 1000,
  fallback,
}: {
  messages: AIChatMessage[]
  temperature?: number
  maxTokens?: number
  fallback: T
}): Promise<T> {
  const content = await runTextCompletion({
    messages,
    temperature,
    maxTokens,
    fallback: JSON.stringify(fallback),
  })

  try {
    return JSON.parse(stripJsonCodeFence(content)) as T
  } catch {
    return fallback
  }
}

function stripJsonCodeFence(content: string) {
  return content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
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

export interface TransitionNotesContext {
  transitionTypes?: string[]
  tracks?: Array<{
    name: string
    artist: string
    position: number
  }>
}

export interface SpotifyTrackContext {
  name: string
  artist: string
  album?: string
  duration?: number
  externalUrl?: string
}

export interface TransitionIdea {
  title: string
  summary: string
  tracks: string[]
  transitionTypes: TransitionType[]
  difficulty: 'easy' | 'medium' | 'advanced'
  whyItWorks: string
  steps: string[]
  notes: string
}

type TransitionIdeaDifficulty = TransitionIdea['difficulty']

export async function cleanTransitionNotes(
  notes: string,
  context: TransitionNotesContext = {}
): Promise<string> {
  const trimmedNotes = notes.trim()
  if (!trimmedNotes) {
    return ''
  }

  const contextLines: string[] = []
  if (context.transitionTypes?.length) {
    contextLines.push(`Transition types: ${context.transitionTypes.join(', ')}`)
  }
  if (context.tracks?.length) {
    contextLines.push(
      `Tracks:\n${context.tracks
        .map((track) => `${track.position}. ${track.name} - ${track.artist}`)
        .join('\n')}`
    )
  }

  return runTextCompletion({
    messages: [
      {
        role: 'system',
        content: `You rewrite DJ transition notes so another DJ can understand and repeat the transition later.
Preserve the user's meaning, track names, cue points, timestamps, BPM/key details, transition steps, stem references, and DJ shorthand when it matters.
Fix spelling, punctuation, capitalization, and sentence structure.
Expand shorthand into clear, beginner-friendly steps when the intended meaning is clear.
If a quick note implies an action, explain the action in plain language without inventing new technical details.
Use concise bullets, numbered steps, or short paragraphs if that improves readability.
Keep the output practical: what to listen for, when to start the next track, what controls/stems/EQ/filter moves to use, and when to complete the blend.
Do not invent new details, cue points, BPMs, or song facts that were not provided.
Return only the cleaned notes.`,
      },
      {
        role: 'user',
        content: [
          contextLines.length ? `Context:\n${contextLines.join('\n\n')}` : null,
          `Notes:\n${trimmedNotes}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
    ],
    temperature: 0.2,
    maxTokens: 800,
    fallback: trimmedNotes,
  })
}

export async function generateTransitionIdeas({
  prompt,
  spotifyTracks = [],
}: {
  prompt: string
  spotifyTracks?: SpotifyTrackContext[]
}): Promise<TransitionIdea[]> {
  const trimmedPrompt = prompt.trim()
  if (!trimmedPrompt) {
    return []
  }

  const spotifyContext = spotifyTracks.length
    ? `Spotify search context:\n${spotifyTracks
        .map((track, index) => {
          const details = [
            track.album ? `album: ${track.album}` : null,
            track.duration ? `duration: ${Math.round(track.duration / 1000)}s` : null,
          ]
            .filter(Boolean)
            .join(', ')

          return `${index + 1}. ${track.name} - ${track.artist}${details ? ` (${details})` : ''}`
        })
        .join('\n')}`
    : 'No Spotify search context was available. Use general DJ/music knowledge and avoid claiming that a song is currently trending.'

  const response = await runJsonCompletion<{ ideas: Partial<TransitionIdea>[] }>({
    messages: [
      {
        role: 'system',
        content: `You are a working DJ assistant that creates practical transition ideas.
Generate transition concepts that a DJ can test in Rekordbox, Serato, Traktor, or similar software.
Use Spotify context when it is supplied, but do not claim access to live Spotify charts or current popularity unless that context explicitly proves it.
Prefer realistic transitions: compatible energy, genre, lyric theme, phrasing, BPM feel, key feel, drums, drops, breakdowns, or wordplay.
Return only valid JSON shaped exactly as:
{
  "ideas": [
    {
      "title": "short transition name",
      "summary": "one sentence overview",
      "tracks": ["Song - Artist", "Song - Artist"],
      "transitionTypes": ["beat_match"],
      "difficulty": "easy",
      "whyItWorks": "why this pairing or technique makes sense",
      "steps": ["clear step 1", "clear step 2"],
      "notes": "expanded notes that can be pasted into the transition Notes field"
    }
  ]
}
Use 3 to 5 ideas. Difficulty must be easy, medium, or advanced.
Allowed transitionTypes values: ${TRANSITION_TYPES.join(', ')}.`,
      },
      {
        role: 'user',
        content: `DJ prompt:\n${trimmedPrompt}\n\n${spotifyContext}`,
      },
    ],
    temperature: 0.8,
    maxTokens: 1800,
    fallback: { ideas: [] },
  })

  return normalizeTransitionIdeas(response.ideas)
}

function normalizeTransitionIdeas(ideas: Partial<TransitionIdea>[] | undefined): TransitionIdea[] {
  if (!Array.isArray(ideas)) {
    return []
  }

  return ideas
    .map((idea) => {
      const transitionTypes: TransitionType[] = Array.isArray(idea.transitionTypes)
        ? idea.transitionTypes.filter((type): type is TransitionType =>
            TRANSITION_TYPES.includes(type as TransitionType)
          )
        : []
      const difficulty: TransitionIdeaDifficulty = ['easy', 'medium', 'advanced'].includes(
        String(idea.difficulty)
      )
        ? (idea.difficulty as TransitionIdeaDifficulty)
        : 'medium'

      return {
        title: typeof idea.title === 'string' && idea.title.trim() ? idea.title.trim() : 'Transition idea',
        summary: typeof idea.summary === 'string' ? idea.summary.trim() : '',
        tracks: Array.isArray(idea.tracks)
          ? idea.tracks.filter((track): track is string => typeof track === 'string')
          : [],
        transitionTypes: transitionTypes.length ? transitionTypes : ['other' as TransitionType],
        difficulty,
        whyItWorks: typeof idea.whyItWorks === 'string' ? idea.whyItWorks.trim() : '',
        steps: Array.isArray(idea.steps)
          ? idea.steps.filter((step): step is string => typeof step === 'string')
          : [],
        notes: typeof idea.notes === 'string' ? idea.notes.trim() : '',
      }
    })
    .slice(0, 5)
}













