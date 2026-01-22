'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { InspirationSearch } from './InspirationSearch'

const formSchema = z.object({
  eventType: z.string().min(1, 'Event type is required'),
  playlistDuration: z.number().min(15).max(480),
  graduationYear1: z.number().int().min(1950).max(2030).optional(),
  graduationYear2: z.number().int().min(1950).max(2030).optional(),
  hometown1: z.string().optional(),
  hometown2: z.string().optional(),
  college1: z.string().optional(),
  college2: z.string().optional(),
  lastConcert1: z.string().optional(),
  lastConcert2: z.string().optional(),
  lastConcert3: z.string().optional(),
  eventDescription: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface StepperFormProps {
  onComplete: (data: FormData & { inspirationTracks: string[]; inspirationArtists: string[] }) => void
}

export function StepperForm({ onComplete }: StepperFormProps) {
  const [step, setStep] = useState(1)
  const [inspirationTracks, setInspirationTracks] = useState<string[]>([])
  const [inspirationArtists, setInspirationArtists] = useState<string[]>([])
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playlistDuration: 60,
    },
  })

  const playlistDuration = watch('playlistDuration')

  const onSubmit = (data: FormData) => {
    onComplete({
      ...data,
      inspirationTracks,
      inspirationArtists,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? 'bg-neutral-950 text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 ${
                    step > s ? 'bg-neutral-950' : 'bg-neutral-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-neutral-950">
              General Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Event Type *
              </label>
              <select
                {...register('eventType')}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
              >
                <option value="">Select event type</option>
                <option value="wedding">Wedding</option>
                <option value="birthday">Birthday</option>
                <option value="corporate">Corporate Event</option>
                <option value="anniversary">Anniversary</option>
                <option value="graduation">Graduation</option>
                <option value="other">Other</option>
              </select>
              {errors.eventType && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.eventType.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Playlist Duration: {playlistDuration} minutes
              </label>
              <input
                type="range"
                min="15"
                max="480"
                step="15"
                {...register('playlistDuration', { valueAsNumber: true })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>15 min</span>
                <span>480 min (8 hours)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                What is this playlist for?
              </label>
              <textarea
                {...register('eventDescription')}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                placeholder="Describe the event, vibe, or occasion..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Person 1 Graduation Year
                </label>
                <input
                  type="number"
                  {...register('graduationYear1', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                  placeholder="e.g., 2010"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Person 2 Graduation Year
                </label>
                <input
                  type="number"
                  {...register('graduationYear2', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                  placeholder="e.g., 2012"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Person 1 Hometown
                </label>
                <input
                  type="text"
                  {...register('hometown1')}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                  placeholder="e.g., Los Angeles, CA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Person 2 Hometown
                </label>
                <input
                  type="text"
                  {...register('hometown2')}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                  placeholder="e.g., New York, NY"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Person 1 College
                </label>
                <input
                  type="text"
                  {...register('college1')}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                  placeholder="e.g., UCLA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Person 2 College
                </label>
                <input
                  type="text"
                  {...register('college2')}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                  placeholder="e.g., USC"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Last 3 Concerts Attended
              </label>
              <input
                type="text"
                {...register('lastConcert1')}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                placeholder="Concert 1: Artist Name"
              />
              <input
                type="text"
                {...register('lastConcert2')}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                placeholder="Concert 2: Artist Name"
              />
              <input
                type="text"
                {...register('lastConcert3')}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
                placeholder="Concert 3: Artist Name"
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full px-6 py-3 bg-neutral-950 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              Next: Add Inspiration
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-neutral-950">
              Add Inspiration (Optional)
            </h2>
            <p className="text-neutral-600">
              Search for artists or songs that capture the vibe you want. This
              helps our AI understand your musical preferences.
            </p>
            <InspirationSearch
              onTracksChange={(tracks) => setInspirationTracks(tracks.map(t => t.id))}
              onArtistsChange={(artists) => setInspirationArtists(artists.map(a => a.id))}
            />
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-950 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 px-6 py-3 bg-neutral-950 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                Next: Review
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-neutral-950">
              Review & Generate
            </h2>
            <div className="bg-neutral-50 rounded-lg p-6 space-y-3">
              <p>
                <span className="font-medium">Event Type:</span>{' '}
                {watch('eventType')}
              </p>
              <p>
                <span className="font-medium">Duration:</span>{' '}
                {playlistDuration} minutes
              </p>
              {watch('eventDescription') && (
                <p>
                  <span className="font-medium">Description:</span>{' '}
                  {watch('eventDescription')}
                </p>
              )}
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-950 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-neutral-950 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                Generate Playlist
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}

