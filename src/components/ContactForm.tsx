'use client'

import { useId, useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Button } from '@/components/Button'
import { FadeIn } from '@/components/FadeIn'
import { useContactForm } from '@/hooks/useContactForm'

declare global {
  interface Window {
    Calendly: {
      initPopupWidget: (options: { url: string }) => void
    }
  }
}

function TextInput({
  label,
  type,
  value,
  placeholder,
  ...props
}: React.ComponentPropsWithoutRef<'input'> & { label: string }) {
  let id = useId()
  const hasValue = value && String(value).length > 0
  const showPlaceholder = placeholder && !hasValue

  return (
    <div className="group relative z-0 transition-all focus-within:z-10">
      <input
        type={type || 'text'}
        id={id}
        value={value}
        {...props}
        placeholder={showPlaceholder ? placeholder : ' '}
        className="peer block w-full border border-neutral-300 bg-transparent px-6 pb-4 pt-12 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5 group-first:rounded-t-2xl group-last:rounded-b-2xl"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-6 top-1/2 -mt-3 origin-left text-base/6 text-neutral-500 transition-all duration-200 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:font-semibold peer-focus:text-neutral-950 peer-[:not(:placeholder-shown)]:-translate-y-4 peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-neutral-950"
      >
        {label}
      </label>
    </div>
  )
}

function RadioInput({
  label,
  ...props
}: React.ComponentPropsWithoutRef<'input'> & { label: string }) {
  return (
    <label className="flex gap-x-3">
      <input
        type="radio"
        {...props}
        className="h-6 w-6 flex-none appearance-none rounded-full border border-neutral-950/20 outline-none checked:border-[0.5rem] checked:border-neutral-950 focus-visible:ring-1 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
      />
      <span className="text-base/6 text-neutral-950">{label}</span>
    </label>
  )
}

function PackagePopover({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
}) {
  let id = useId()
  const hasValue = value && value !== ''
  const selectedOption = options.find((opt) => opt.value === value)
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  
  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  return (
    <div className="group relative z-0 transition-all focus-within:z-10" ref={popoverRef}>
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="peer block w-full border border-neutral-300 bg-transparent px-6 pb-4 pt-12 pr-10 text-base/6 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5 group-first:rounded-t-2xl group-last:rounded-b-2xl text-left flex items-center justify-between"
      >
        <span className={hasValue ? 'text-neutral-950' : 'text-neutral-500'}>
          {selectedOption?.label || `Select ${label}`}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`size-5 flex-shrink-0 text-neutral-500 absolute right-6 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-6 origin-left text-base/6 transition-all duration-200 ${
          hasValue || isOpen
            ? '-translate-y-4 scale-75 font-semibold text-neutral-950 top-3'
            : 'top-1/2 -mt-3 text-neutral-500'
        }`}
      >
        {label}
      </label>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="absolute z-10 mt-1 w-full rounded-xl bg-white p-2 text-sm/6 font-semibold text-neutral-950 shadow-lg outline-1 outline-neutral-900/5"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left transition ${
                value === option.value
                  ? 'bg-neutral-950 text-white'
                  : 'hover:bg-neutral-100 text-neutral-950'
              }`}
            >
              {option.label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  )
}

function CheckIcon() {
  return (
    <motion.svg
      className="h-6 w-6 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
    >
      <motion.path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      />
    </motion.svg>
  )
}

export function ContactForm({ initialPackage }: { initialPackage?: string }) {
  const { formData, sent, isSending, handleInputChange, handleSubmit } =
    useContactForm(initialPackage)
  const confirmationRef = useRef<HTMLDivElement>(null)

  const showPackageField = !!initialPackage
  const isWeddingPackage = formData.package === 'Wedding Full' || formData.package === 'Wedding Reception Only'
  const showEventType = showPackageField && !isWeddingPackage
  const showTimeFields = formData.package === 'General Event'

  // Scroll to confirmation message when form is submitted
  useEffect(() => {
    if (sent && confirmationRef.current) {
      setTimeout(() => {
        confirmationRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 100) // Small delay to ensure the element is rendered
    }
  }, [sent])

  const handleScheduleConsult = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (typeof window !== 'undefined' && window.Calendly) {
      window.Calendly.initPopupWidget({
        url: 'https://calendly.com/dj-ybre/consult',
      })
    }
  }

  return (
    <FadeIn className="lg:order-last">
      {sent ? (
        <motion.div
          ref={confirmationRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-neutral-300 bg-white/50 p-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-950"
          >
            <CheckIcon />
          </motion.div>
          <h2 className="font-display text-2xl font-semibold text-neutral-950">
            Message Sent!
          </h2>
          <p className="mt-4 text-base/6 text-neutral-600">
            Thank you for reaching out. I&apos;ll get back to you as soon as possible. Please use my link below to schedule a consult so that we can meet and sync on your event details!
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button
              onClick={handleScheduleConsult}
              className="mt-6"
            >
              Schedule Consult
            </Button>
            {!showPackageField && (
              <Button
                href="/pricing"
                className="mt-6"
              >
                View Pricing
              </Button>
            )}
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit}>
          {' '}
          <h2 className="font-display text-base font-semibold text-neutral-950">
            Event Inquiry
          </h2>
          <div className="isolate mt-6 -space-y-px rounded-2xl bg-white/50">
            <TextInput
              label="First Name"
              name="firstName"
              value={formData.firstName}
              autoComplete="first-name"
              onChange={handleInputChange}
            />
            <TextInput
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              autoComplete="last-name"
              onChange={handleInputChange}
            />
            <TextInput
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              autoComplete="email"
              onChange={handleInputChange}
            />
            <TextInput
              onChange={handleInputChange}
              label="Venue"
              value={formData.venue}
              name="venue"
              autoComplete="venue"
            />
            <TextInput
              onChange={handleInputChange}
              label="Phone"
              type="tel"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
            />
            {showPackageField && (
              <PackagePopover
                label="Package"
                value={formData.package}
                onChange={(value) => handleInputChange({ target: { name: 'package', value } })}
                options={[
                  { value: 'Wedding Full', label: 'Wedding Full' },
                  { value: 'Wedding Reception Only', label: 'Wedding Reception Only' },
                  { value: 'General Event', label: 'General Event' },
                ]}
              />
            )}
            <TextInput
              onChange={handleInputChange}
              label="Event Date"
              type="text"
              name="date"
              value={formData.date}
              maxLength={10}
            />
            {showTimeFields && (
              <>
                <TextInput
                  onChange={handleInputChange}
                  label="Event Start Time"
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                />
                <TextInput
                  onChange={handleInputChange}
                  label="Event End Time"
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                />
              </>
            )}
            <TextInput
              onChange={handleInputChange}
              label="Message"
              name="message"
              value={formData.message}
            />

            {showEventType && (
              <div className="border border-neutral-300 px-6 py-8 first:rounded-t-2xl last:rounded-b-2xl">
                <fieldset>
                  <legend className="text-base/6 text-neutral-500">
                    Event Type
                  </legend>
                  <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
                    <RadioInput
                      label="Corporate Event"
                      name="event-type"
                      value="corporate"
                      onChange={handleInputChange}
                    />
                    <RadioInput
                      label="Bar/Club"
                      name="event-type"
                      value="bar-club"
                      onChange={handleInputChange}
                    />
                    <RadioInput
                      label="Birthday"
                      name="event-type"
                      value="birthday"
                      onChange={handleInputChange}
                    />
                    <RadioInput
                      label="Non-Profit/Fundraiser"
                      name="event-type"
                      value="nonprofit"
                      onChange={handleInputChange}
                    />
                    <RadioInput
                      label="School Dance"
                      name="event-type"
                      value="school-dance"
                      onChange={handleInputChange}
                    />
                    <RadioInput
                      onChange={handleInputChange}
                      label="Other"
                      name="event-type"
                      value="other"
                    />
                  </div>
                </fieldset>
              </div>
            )}

            {!showPackageField && (
              <div className="border border-neutral-300 px-6 py-8 first:rounded-t-2xl last:rounded-b-2xl">
                <fieldset>
                  <legend className="text-base/6 text-neutral-500">
                    Event Type
                  </legend>
                  <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
                    <RadioInput 
                      label="Wedding" 
                      name="event-type" 
                      value="wedding" 
                      onChange={handleInputChange}
                    />
                    <RadioInput
                      label="Corporate Event"
                      name="event-type"
                      value="corporate"
                      onChange={handleInputChange}
                    />
                    <RadioInput
                      label="Bar/Club"
                      name="event-type"
                      value="bar-club"
                      onChange={handleInputChange}
                    />
                    <RadioInput
                      label="Birthday"
                      name="event-type"
                      value="birthday"
                      onChange={handleInputChange}
                    />
                    <RadioInput
                      label="Non-Profit/Fundraiser"
                      name="event-type"
                      value="nonprofit"
                      onChange={handleInputChange}
                    />
                    <RadioInput
                      label="School Dance"
                      name="event-type"
                      value="school-dance"
                      onChange={handleInputChange}
                    />
                    <RadioInput
                      onChange={handleInputChange}
                      label="Other"
                      name="event-type"
                      value="other"
                    />
                  </div>
                </fieldset>
              </div>
            )}
          </div>
          <Button type="submit" className="mt-10" disabled={isSending}>
            {isSending ? 'Sending...' : "Let's work together"}
          </Button>
        </form>
      )}
    </FadeIn>
  )
}
