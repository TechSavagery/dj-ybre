import { useId } from 'react'
import { type Metadata } from 'next'
import Link from 'next/link'

import { Border } from '@/components/Border'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { SocialMedia } from '@/components/SocialMedia'

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

function ContactForm() {
  return (
    <FadeIn className="lg:order-last">
      <form>
        <h2 className="font-display text-base font-semibold text-neutral-950">
          Event Inquiry
        </h2>
        <div className="isolate mt-6 -space-y-px rounded-2xl bg-white/50">
          <TextInput
            label="First Name"
            name="first-name"
            autoComplete="first-name"
          />
          <TextInput
            label="Last Name"
            name="last-name"
            autoComplete="last-name"
          />
          <TextInput
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
          />
          <TextInput label="Venue" name="venue" autoComplete="venue" />
          <TextInput label="Phone" type="tel" name="phone" autoComplete="tel" />
          <TextInput label="Event Date" type="date" name="event-date" />
          <TextInput label="Message" name="message" />

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
                />
                <RadioInput
                  label="Bar/Club"
                  name="event-type"
                  value="bar-club"
                />
                <RadioInput
                  label="Birthday"
                  name="event-type"
                  value="birthday"
                />
                <RadioInput
                  label="Non-Profit/Fundraiser"
                  name="event-type"
                  value="nonprofit"
                />
                <RadioInput
                  label="School Dance"
                  name="event-type"
                  value="school-dance"
                />
                <RadioInput label="Other" name="event-type" value="other" />
              </div>
            </fieldset>
          </div>
        </div>
        <Button type="submit" className="mt-10">
          Let’s work together
        </Button>
      </form>
    </FadeIn>
  )
}

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Let’s work together. We can’t wait to hear from you.',
}

export default function Contact() {
  return (
    <>
      <PageIntro eyebrow="Contact us" title="Let’s work together">
        <p>We can’t wait to hear from you.</p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="grid grid-cols-1 gap-x-8 gap-y-24 lg:grid-cols-2">
          <ContactForm />
          <FadeIn>
            <Border className="mt-16 pt-16">
              <h2 className="font-display text-base font-semibold text-neutral-950">
                Email us
              </h2>
              <dl className="mt-6 grid grid-cols-1 gap-8 text-sm sm:grid-cols-2">
                {[['Info', 'info@djybre.com']].map(([label, email]) => (
                  <div key={email}>
                    <dt className="font-semibold text-neutral-950">{label}</dt>
                    <dd>
                      <Link
                        href={`mailto:${email}`}
                        className="text-neutral-600 hover:text-neutral-950"
                      >
                        {email}
                      </Link>
                    </dd>
                  </div>
                ))}
              </dl>
            </Border>

            <Border className="mt-16 pt-16">
              <h2 className="font-display text-base font-semibold text-neutral-950">
                Follow us
              </h2>
              <SocialMedia className="mt-6" />
            </Border>
          </FadeIn>
        </div>
      </Container>
    </>
  )
}
