import { type Metadata } from 'next'
import Image from 'next/image'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { List, ListItem } from '@/components/List'
import { SectionIntro } from '@/components/SectionIntro'
import { StylizedVideo } from '@/components/StylizedVideo'
import logoBrightPath from '@/images/clients/bright-path/logo-light.svg'
import logoFamilyFund from '@/images/clients/family-fund/logo-light.svg'
import logoGreenLife from '@/images/clients/green-life/logo-light.svg'
import logoHomeWork from '@/images/clients/home-work/logo-light.svg'
import logoMailSmirk from '@/images/clients/mail-smirk/logo-light.svg'
import logoNorthAdventures from '@/images/clients/north-adventures/logo-light.svg'
import logoPhobiaLight from '@/images/clients/phobia/logo-light.svg'
import logoUnseal from '@/images/clients/unseal/logo-light.svg'
import { type CaseStudy, type MDXEntry, loadCaseStudies } from '@/lib/mdx'

const clients: Array<[string, typeof logoPhobiaLight]> = []

function Clients() {
  return (
    <div className="mt-24 rounded-4xl bg-neutral-950 py-20 sm:mt-32 sm:py-32 lg:mt-56">
      <Container>
        <FadeInStagger faster>
          <ul
            role="list"
            className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4"
          >
            {clients.map(([client, logo]) => (
              <li key={client}>
                <FadeIn>
                  <Image src={logo} alt={client} unoptimized />
                </FadeIn>
              </li>
            ))}
          </ul>
        </FadeInStagger>
      </Container>
    </div>
  )
}

function CaseStudies({
  caseStudies,
}: {
  caseStudies: Array<MDXEntry<CaseStudy>>
}) {
  return (
    <>
      {/* <SectionIntro
        title="Professional Beats for Timeless Memories - Your Wedding, Your Soundtrack"
        className="mt-24 sm:mt-32 lg:mt-40"
      >
        <p>
          Lets create the perfect event that your guests will talk about for
          years to come! I will leverage your music preferences and favorite
          jams and add in 20/20 Crowd Reading Vision to birth the ultimate vibe
        </p>
      </SectionIntro>
      <Container className="mt-16">
        <FadeInStagger className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {caseStudies.map((caseStudy) => (
            <FadeIn key={caseStudy.href} className="flex">
              <article className="relative flex w-full flex-col rounded-3xl p-6 ring-1 ring-neutral-950/5 transition hover:bg-neutral-50 sm:p-8">
                <h3>
                  <Link href={caseStudy.href}>
                    <span className="absolute inset-0 rounded-3xl" />
                    <Image
                      src={caseStudy.logo}
                      alt={caseStudy.client}
                      className="h-16 w-16"
                      unoptimized
                    />
                  </Link>
                </h3>
                <p className="mt-6 flex gap-x-2 text-sm text-neutral-950">
                  <time
                    dateTime={caseStudy.date.split('-')[0]}
                    className="font-semibold"
                  >
                    {caseStudy.date.split('-')[0]}
                  </time>
                  <span className="text-neutral-300" aria-hidden="true">
                    /
                  </span>
                  <span>Case study</span>
                </p>
                <p className="mt-6 font-display text-2xl font-semibold text-neutral-950">
                  {caseStudy.title}
                </p>
                <p className="mt-4 text-base text-neutral-600">
                  {caseStudy.description}
                </p>
              </article>
            </FadeIn>
          ))}
        </FadeInStagger>
      </Container> */}
    </>
  )
}

function Services() {
  return (
    <>
      <SectionIntro
        eyebrow="Services"
        title="Professional Beats for Timeless Memories - Your Event, Your Soundtrack"
        className="mt-24 sm:mt-32 lg:mt-40"
      >
        <p>
          Lets create the perfect event that your guests will talk about for
          years to come! I will leverage your music preferences and favorite
          jams and add in 20/20 Crowd Reading Vision to birth the ultimate vibe
        </p>
      </SectionIntro>
      <Container className="mt-16">
        <div className="lg:flex lg:items-center lg:justify-end">
          <div className="flex justify-center lg:w-1/2 lg:justify-end lg:pr-12">
            <FadeIn className="w-[23.625rem] flex-none lg:w-[31.5rem]">
              <StylizedVideo
                src="/video/ybre.mov"
                className="justify-center lg:justify-end"
              />
            </FadeIn>
          </div>
          <List className="mt-16 lg:mt-0 lg:w-1/2 lg:min-w-[33rem] lg:pl-4">
            <ListItem title="Wedding Ceremony + Reception">
              Make your wedding day magical with our DJ services, blending
              romantic tunes and party hits for a day to remember. From your
              vows to the last dance, we curate the perfect soundtrack to
              celebrate your love. With top-tier sound and lighting, we create
              the atmosphere you`&#39;`ve dreamed of, ensuring every moment is
              unforgettable.
            </ListItem>
            <ListItem title="Corporate Events">
              Elevate your next corporate event with our premium DJ services,
              designed to impress clients and colleagues alike. Whether it`&#39;`s a
              product launch, holiday party, or award ceremony, we provide a
              professional soundtrack that sets the perfect tone for your event.
              Our extensive music library ensures we have the right tracks to
              suit your company`&#39;`s vibe and the occasion`&#39;`s theme. Plus, with our
              top-notch sound system and lighting, we`&#39;`ll transform your
              corporate gathering into an extraordinary experience that boosts
              morale and leaves a lasting impression.
            </ListItem>
            <ListItem title="Birthday Events">
              Turn up the fun on your birthday with our dynamic DJ services! No
              matter what milestone you`&#39;`re celebrating, we`&#39;`ve got the tunes to
              make your birthday bash a hit. From the latest chart-toppers to
              timeless classics, we`&#39;`ll tailor the playlist to your preferences,
              ensuring the music resonates with you and your guests. Our
              engaging DJ will keep the energy high and the dance floor full,
              making your birthday event memorable for all the right reasons.
              Get ready to party like its your birthday—because it is!
            </ListItem>
            <ListItem title="Club Events ">
              Bring the ultimate party vibe to your club with our electrifying
              DJ services. Specializing in creating unforgettable nights, we mix
              the hottest tracks and crowd favorites to keep your patrons
              dancing until the wee hours. Our expertise in various genres, from
              EDM to hip-hop, ensures a diverse and vibrant playlist that caters
              to all tastes. Coupled with cutting-edge sound and lighting, our
              DJ services will elevate the atmosphere of your club, making every
              event a sensational hit. Get ready to host the most talked-about
              nights in town!
            </ListItem>
          </List>
        </div>
      </Container>
    </>
  )
}

export const metadata: Metadata = {
  description:
    'We are a development studio working at the intersection of design and technology.',
}

export default async function Home() {
  let caseStudies = (await loadCaseStudies()).slice(0, 3)

  return (
    <>
      <Container className="z-40 mt-40 sm:mt-44 md:mt-56">
        <FadeIn className="max-w-3xl">
          <h1 className="z-40 font-display text-5xl font-medium tracking-tight text-neutral-950 [text-wrap:balance] sm:text-7xl">
            Open Format Mobile DJ + MC
          </h1>
          <p className="mt-6 text-xl text-neutral-600">
            Providing custom mixed sound tracks at venues through out the
            beautiful Central Coast of California. Over 6 years and 100+ events
            of experience delivering quality audio experience to crowds upwords
            of 500 guests of all ages and backgrounds.
          </p>
        </FadeIn>
      </Container>

      <CaseStudies caseStudies={caseStudies} />

      {/* <Testimonial
        className="mt-24 sm:mt-32 lg:mt-40"
        client={{ name: 'Phobia', logo: logoPhobiaDark }}
      >
        The team at Studio went above and beyond with our onboarding, even
        finding a way to access the user’s microphone without triggering one of
        those annoying permission dialogs.
      </Testimonial> */}

      <Services />

      <ContactSection />
    </>
  )
}
