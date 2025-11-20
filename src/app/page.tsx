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
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">
          <div className="flex justify-center mb-16 lg:mb-0">
            <FadeIn className="w-full max-w-[23.625rem] flex-none sm:w-[20rem] lg:w-full lg:max-w-none">
              <StylizedVideo
                src="/video/ybre.mp4"
                className="justify-center"
              />
            </FadeIn>
          </div>
          <List className="lg:flex-shrink-0">
            <ListItem title="Wedding Ceremony + Reception">
              I love making wedding days magical by blending romantic tunes and
              party hits that create moments you`&#39;`ll remember forever. From your
              vows to the last dance, I curate the perfect soundtrack that
              celebrates your unique love story. With my top-tier sound and
              lighting setup, I create the atmosphere you`&#39;`ve dreamed of,
              reading the room and keeping the energy flowing so every moment
              feels unforgettable.
            </ListItem>
            <ListItem title="Corporate Events">
              I bring the energy your corporate event needs to impress clients
              and colleagues. Whether it`&#39;`s a product launch, holiday party, or
              award ceremony, I provide a professional soundtrack that sets the
              perfect tone. My extensive music library means I always have the
              right tracks to match your company`&#39;`s vibe and the occasion`&#39;`s
              theme. With my top-notch sound system and lighting, I`&#39;`ll transform
              your corporate gathering into an experience that boosts morale and
              leaves everyone talking.
            </ListItem>
            <ListItem title="Birthday Events">
              Let`&#39;`s turn up the fun on your birthday! No matter what milestone
              you`&#39;`re celebrating, I`&#39;`ve got the tunes to make your birthday bash
              absolutely epic. From the latest chart-toppers to timeless
              classics, I tailor the playlist to your style, making sure the
              music hits just right for you and your crew. I keep the energy
              high and the dance floor packed, making your birthday one for the
              books. Get ready to party like it`&#39;`s your birthday—because it is!
            </ListItem>
            <ListItem title="Club Events ">
              I bring the ultimate party vibe to your club with electrifying
              mixes that keep the night alive. I specialize in creating
              unforgettable nights by mixing the hottest tracks and crowd
              favorites that keep your patrons dancing until the wee hours. My
              expertise across genres—from EDM to hip-hop—means I craft diverse,
              vibrant playlists that hit different. With cutting-edge sound and
              lighting, I elevate your club`&#39;`s atmosphere and make every event
              the most talked-about night in town!
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
