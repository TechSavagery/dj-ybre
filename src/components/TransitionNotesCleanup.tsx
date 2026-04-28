'use client'

import { Border } from '@/components/Border'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type TransitionTrackContext = {
  name: string
  artist: string
  position: number
}

export function TransitionNotesCleanup({
  transitionId,
  initialNotes,
  transitionTypes,
  tracks,
}: {
  transitionId: string
  initialNotes: string
  transitionTypes: string[]
  tracks: TransitionTrackContext[]
}) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes)
  const [isCleaning, setIsCleaning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const hasChanges = notes !== initialNotes
  const hasNotes = notes.trim().length > 0

  const cleanNotes = async () => {
    if (!hasNotes) {
      setErrorMessage('Add notes before cleaning them up')
      return
    }

    setIsCleaning(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/transitions/clean-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes,
          transitionTypes,
          tracks,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clean up notes')
      }

      setNotes(data.notes)
      setSuccessMessage('Notes cleaned. Review and save when ready.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to clean up notes')
    } finally {
      setIsCleaning(false)
    }
  }

  const saveNotes = async () => {
    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`/api/transitions/${transitionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save notes')
      }

      setSuccessMessage('Notes saved.')
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save notes')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Border className="p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-xl font-semibold text-neutral-950">
          Notes
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={cleanNotes}
            disabled={isCleaning || !hasNotes}
            className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCleaning ? 'Cleaning...' : 'Clean up notes'}
          </button>
          <button
            type="button"
            onClick={saveNotes}
            disabled={isSaving || !hasChanges}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save notes'}
          </button>
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value)
          setSuccessMessage('')
        }}
        rows={8}
        className="mt-4 block w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
      />

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-700">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="mt-3 text-sm text-green-700">{successMessage}</p>
      ) : null}
    </Border>
  )
}
