'use client'

import { useId } from 'react'
import { Button } from '@/components/Button'
import { FadeIn } from '@/components/FadeIn'
import { useContactForm } from '@/hooks/useContactForm'

function TextInput({
  label,
  ...props
}: React.ComponentPropsWithoutRef<'input'> & { label: string }) {
  let id = useId()

  return (
    <div className="group relative z-0 transition-all focus-within:z-10">
      <input
        type="text"
        id={id}
        {...props}
        placeholder=" "
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

export function ContactForm() {
  const { formData, sent, isSending, handleInputChange, handleSubmit } =
    useContactForm()
  return (
    <FadeIn className="lg:order-last">
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
          <TextInput
            onChange={handleInputChange}
            label="Event Date"
            type="date"
            name="date"
            value={formData.date}
          />
          <TextInput
            onChange={handleInputChange}
            label="Message"
            name="message"
            value={formData.message}
          />

          <div className="border border-neutral-300 px-6 py-8 first:rounded-t-2xl last:rounded-b-2xl">
            <fieldset>
              <legend className="text-base/6 text-neutral-500">
                Event Type
              </legend>
              <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
                <RadioInput label="Wedding" name="event-type" value="wedding" />
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
        </div>
        <Button type="submit" className="mt-10">
          Let's work together
        </Button>
      </form>
    </FadeIn>
  )
}
