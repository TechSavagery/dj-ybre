import { type Metadata } from 'next'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { List, ListItem } from '@/components/List'
import { PageIntro } from '@/components/PageIntro'

const links = [
  {
    title: 'Instagram',
    description: 'Behind-the-scenes clips, mixes, and upcoming gigs.',
    href: 'https://instagram.com/djybre',
    cta: 'Follow on Instagram',
  },
  {
    title: 'Tip YBRE',
    description: 'Show some love if you are feeling the vibes tonight.',
    href: 'https://buy.stripe.com/9B68wO4Sl121572aA71kA00',
    cta: 'Send a tip',
  },
  {
    title: 'Book a set',
    description: 'Lock in a date for weddings, parties, or corporate events.',
    href: '/contact',
    cta: 'Book now',
  },
]

export const metadata: Metadata = {
  title: 'Info',
  description: 'Stay connected with DJ YBRE.',
}

export default function InfoPage() {
  return (
    <>
      <PageIntro eyebrow="Info" title="Stay connected">
        <p>Thanks for the energy. Tap a button to stay connected.</p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <List className="max-w-2xl">
          {links.map((link) => (
            <ListItem key={link.title} title={link.title}>
              <p>{link.description}</p>
              <div className="mt-4">
                <Button
                  href={link.href}
                  className="w-full justify-center px-6 py-3 text-base sm:w-auto sm:justify-start"
                >
                  {link.cta}
                </Button>
              </div>
            </ListItem>
          ))}
        </List>
      </Container>
    </>
  )
}
