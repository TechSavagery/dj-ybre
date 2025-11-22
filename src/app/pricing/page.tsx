import { CheckIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { type Metadata } from 'next'

import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'

const tiers = [
  {
    name: 'Wedding Full',
    id: 'tier-wedding-full',
    price: '$1,500',
    description: 'Complete wedding day experience from ceremony to last dance.',
    features: [
      'Professional sound system & speakers',
      'Wireless microphones for vows & toasts',
      'Professional setup & presentation',
      'No Stress Setup and breakdown/cleanup',
      'Unlimited consultation hours',
      'Intelligent dance floor lighting',
      'Custom playlist creation',
      'Playlist review & refinement',
      'Song edits & special mixes',
      'Ceremony music',
      'Cocktail hour entertainment',
      'Reception DJ & MC services',
      'All-day event coverage',
    ],
    featured: true,
  },
  {
    name: 'Wedding Reception Only',
    id: 'tier-reception',
    price: '$1,100',
    description: 'Perfect for intimate celebrations focused on the reception.',
    features: [
      'Professional sound system & speakers',
      'Wireless microphones for toasts',
      'Professional setup & presentation',
      'No Stress Setup and breakdown/cleanup',
      'Unlimited consultation hours',
      'Intelligent dance floor lighting',
      'Custom playlist creation',
      'Playlist review & refinement',
      'Song edits & special mixes',
      'Reception DJ & MC services',
    ],
    featured: false,
  },
  {
    name: 'General Event',
    id: 'tier-general',
    price: '$150',
    priceSuffix: '/hour',
    description: 'Flexible hourly pricing for corporate events, parties, and special occasions.',
    features: [
      'Professional sound system & speakers',
      'Wireless microphones available',
      'Professional setup & presentation',
      'No Stress Setup and breakdown/cleanup',
      'Unlimited consultation hours',
      'Intelligent dance floor lighting',
      'Custom playlist creation',
      'Playlist review & refinement',
      'Song edits & special mixes',
      'DJ & MC services',
      'Flexible event duration',
      '2-hour minimum booking',
    ],
    featured: false,
  },
]

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Transparent pricing for unforgettable events. Choose from Wedding Full, Wedding Reception Only, or General Event packages. All include professional equipment and unlimited consultation.',
}

export default function Pricing() {
  return (
    <>
      <PageIntro eyebrow="Pricing" title="Transparent pricing for unforgettable events">
        <p>
          Choose the perfect package for your special occasion. All packages include professional equipment, unlimited consultation, and personalized service. Additional services can be added at an additional fee—contact us for a full custom quote.
        </p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn>
          <div className="mx-auto max-w-7xl">
            <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 md:max-w-2xl md:grid-cols-2 lg:max-w-5xl xl:mx-0 xl:max-w-none xl:grid-cols-3">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`rounded-3xl p-8 ring-1 ${
                    tier.featured
                      ? 'ring-2 ring-neutral-950 bg-neutral-50'
                      : 'ring-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-x-4">
                    <h3
                      id={`tier-${tier.id}`}
                      className={`text-lg font-semibold ${
                        tier.featured ? 'text-neutral-950' : 'text-gray-900'
                      }`}
                    >
                      {tier.name}
                    </h3>
                    {tier.featured && (
                      <p className="rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-semibold text-white">
                        Most popular
                      </p>
                    )}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-600">
                    {tier.description}
                  </p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-4xl font-semibold tracking-tight text-gray-900">
                      {tier.price}
                    </span>
                    {tier.priceSuffix && (
                      <span className="text-sm font-semibold text-gray-600">
                        {tier.priceSuffix}
                      </span>
                    )}
                  </p>
                  <Link
                    href={`/contact?package=${encodeURIComponent(tier.name)}`}
                    aria-describedby={tier.id}
                    className={`mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold transition ${
                      tier.featured
                        ? 'bg-neutral-950 text-white shadow-sm hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950'
                        : 'text-neutral-950 ring-1 ring-neutral-200 hover:ring-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950'
                    }`}
                  >
                    Get Started
                  </Link>
                  <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckIcon
                          aria-hidden="true"
                          className="h-6 w-5 flex-none text-neutral-950"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <p className="text-sm leading-6 text-gray-600">
                <span className="font-semibold">Additional Services:</span> Sparklers, dancing on cloud, dance floor lights for guests (LED fan sticks, light glasses and hats), CO2 cannons and guns, photo booths, extra speakers, uplighting, monogram lighting, ceremony sound systems, and more available upon request. Contact us for a full custom quote tailored to your event needs.
              </p>
            </div>
          </div>
        </FadeIn>
      </Container>
    </>
  )
}

