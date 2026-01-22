'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/Container'
import { StepperForm } from '@/components/playlist/StepperForm'
import { InspirationSearch } from '@/components/playlist/InspirationSearch'
import { PlaylistDisplay } from '@/components/playlist/PlaylistDisplay'
import { PlaylistMetadata } from '@/components/playlist/PlaylistMetadata'

type ViewState =
  | 'form'
  | 'generating'
  | 'playlist'
  | 'metadata'
  | 'spotify-auth'

interface Track {
  id: string
  spotifyId: string
  name: string
  artist: string
  album?: string
  duration: number
  previewUrl?: string
  imageUrl?: string
  externalUrl?: string
  isHearted: boolean
  isRemoved: boolean
  order?: number
  audioFeatures?: any
  genres?: string[]
}

export default function PlaylistGeneratorPage() {
  const [viewState, setViewState] = useState<ViewState>('form')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [targetDuration, setTargetDuration] = useState(0)
  const [session, setSession] = useState<any>(null)
  const [inspirationTracks, setInspirationTracks] = useState<string[]>([])
  const [inspirationArtists, setInspirationArtists] = useState<string[]>([])
  const [spotifyConnected, setSpotifyConnected] = useState(false)

  useEffect(() => {
    // Check if Spotify is connected
    checkSpotifyConnection()

    // Check URL params for Spotify callback
    const params = new URLSearchParams(window.location.search)
    if (params.get('spotify_connected') === 'true') {
      setSpotifyConnected(true)
      // Clean URL
      window.history.replaceState({}, '', '/playlist-generator')
    }
  }, [])

  const checkSpotifyConnection = async () => {
    try {
      const response = await fetch('/api/spotify/search?q=test&limit=1')
      if (response.ok) {
        setSpotifyConnected(true)
      }
    } catch {
      setSpotifyConnected(false)
    }
  }

  const connectSpotify = async () => {
    try {
      const response = await fetch('/api/spotify/auth')
      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Failed to connect Spotify:', error)
    }
  }

  const handleFormComplete = async (formData: any) => {
    if (!spotifyConnected) {
      setViewState('spotify-auth')
      return
    }

    setViewState('generating')

    try {
      const response = await fetch('/api/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          inspirationTracks,
          inspirationArtists,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          setViewState('spotify-auth')
          return
        }
        throw new Error('Failed to generate playlist')
      }

      const data = await response.json()
      setSessionId(data.sessionId)
      setTracks(data.tracks)
      setTargetDuration(data.targetDuration)
      setViewState('playlist')
    } catch (error) {
      console.error('Generate playlist error:', error)
      alert('Failed to generate playlist. Please try again.')
      setViewState('form')
    }
  }

  const handleRefinePlaylist = async () => {
    if (!sessionId) return

    try {
      const response = await fetch('/api/refine-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      if (!response.ok) {
        throw new Error('Failed to refine playlist')
      }

      const data = await response.json()
      // Show suggestions to user (could be a modal or new section)
      console.log('Refinement suggestions:', data)
      alert(
        `Found ${data.suggestions.length} replacement suggestions based on your preferences!`
      )
    } catch (error) {
      console.error('Refine playlist error:', error)
    }
  }

  const handleOrderPlaylist = async () => {
    if (!sessionId) return

    try {
      const response = await fetch('/api/order-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      if (!response.ok) {
        throw new Error('Failed to order playlist')
      }

      const data = await response.json()
      setTracks(data.tracks)
      alert('Playlist reordered for optimal flow!')
    } catch (error) {
      console.error('Order playlist error:', error)
    }
  }

  const handleViewMetadata = async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`/api/playlist/${sessionId}`)
      if (!response.ok) {
        throw new Error('Failed to load session')
      }

      const data = await response.json()
      setSession(data.session)
      setViewState('metadata')
    } catch (error) {
      console.error('Load session error:', error)
    }
  }

  if (viewState === 'spotify-auth') {
    return (
      <Container className="mt-24">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-semibold text-neutral-950">
            Connect Spotify
          </h1>
          <p className="text-neutral-600">
            We need to connect to your Spotify account to search for music and
            generate playlists.
          </p>
          <button
            onClick={connectSpotify}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Connect with Spotify
          </button>
        </div>
      </Container>
    )
  }

  if (viewState === 'generating') {
    return (
      <Container className="mt-24">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-neutral-950 mx-auto"></div>
          <h1 className="text-2xl font-semibold text-neutral-950">
            Generating Your Playlist
          </h1>
          <p className="text-neutral-600">
            Our AI is analyzing your preferences and creating the perfect
            playlist...
          </p>
        </div>
      </Container>
    )
  }

  if (viewState === 'playlist') {
    return (
      <Container className="mt-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-neutral-950">
              Your Playlist
            </h1>
            <div className="flex gap-3">
              <button
                onClick={handleRefinePlaylist}
                className="px-4 py-2 border border-neutral-300 text-neutral-950 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Get Suggestions
              </button>
              <button
                onClick={handleOrderPlaylist}
                className="px-4 py-2 border border-neutral-300 text-neutral-950 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Optimize Order
              </button>
              <button
                onClick={handleViewMetadata}
                className="px-4 py-2 bg-neutral-950 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
          <PlaylistDisplay
            sessionId={sessionId!}
            tracks={tracks}
            targetDuration={targetDuration}
            onTracksChange={setTracks}
          />
        </div>
      </Container>
    )
  }

  if (viewState === 'metadata') {
    return (
      <Container className="mt-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-neutral-950">
              Playlist Details
            </h1>
            <button
              onClick={() => setViewState('playlist')}
              className="px-4 py-2 border border-neutral-300 text-neutral-950 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
            >
              Back to Playlist
            </button>
          </div>
          {session && (
            <PlaylistMetadata
              session={session}
              tracks={tracks.filter((t) => !t.isRemoved)}
            />
          )}
        </div>
      </Container>
    )
  }

  return (
    <Container className="mt-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-neutral-950">
            AI Playlist Generator
          </h1>
          <p className="mt-4 text-lg text-neutral-600">
            Tell us about your event and preferences, and we'll create the
            perfect playlist using AI and Spotify.
          </p>
        </div>

        {!spotifyConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Please connect your Spotify account to continue.
            </p>
            <button
              onClick={connectSpotify}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Connect Spotify
            </button>
          </div>
        )}

        <StepperForm onComplete={handleFormComplete} />
      </div>
    </Container>
  )
}













