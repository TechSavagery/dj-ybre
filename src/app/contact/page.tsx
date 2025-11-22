import { useId } from 'react'
import { type Metadata } from 'next'
import Link from 'next/link'

import { Border } from '@/components/Border'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { SocialMedia } from '@/components/SocialMedia'
import { ContactForm } from '@/components/ContactForm'

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


export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Let’s work together. We can’t wait to hear from you.',
}

export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ package?: string }> | { package?: string }
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams
  return (
    <>
      <PageIntro eyebrow="Contact us" title="Let's work together">
        <p>We can&apos;t wait to hear from you.</p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="grid grid-cols-1 gap-x-8 gap-y-24 lg:grid-cols-2">
          <ContactForm initialPackage={params?.package} />
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
