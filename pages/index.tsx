import { Flex, useColorModeValue } from '@chakra-ui/react';
import { ChevronRightIcon, StarIcon } from '@heroicons/react/solid';
import PadBoard from '../pages/components/ui/widgets/controller-pad/pad-board';
import { SamplePadList } from '../utils/pads/sample-pads';
import { LinkPadList } from '../utils/pads/link-pads';
import NewsletterForm from '../pages/components/ui/widgets/newsletter-form';
import Footer from './components/ui/footer';

export default function Example() {
  const bg = useColorModeValue('white', '#171923');
  return (
    <div className="bg-white">
      <main>
        {/* Hero section */}
        <div className="pt-8 overflow-hidden sm:pt-12 lg:relative lg:py-48">
          <div className="mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-8 lg:max-w-7xl lg:grid lg:grid-cols-2 lg:gap-24">
            <div>
              <div>
                <img
                  className="h-110 w-auto"
                  src="\logo-v1.png"
                  alt="Workflow"
                />
              </div>
              <div className="mt-5">
                <div>
                  <a href="/mixcloud" className="inline-flex space-x-4">
                    <span className="rounded bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-500 tracking-wide uppercase">
                      What's new
                    </span>
                    <span className="inline-flex items-center text-sm font-medium text-stone-500 space-x-1">
                      <span>Check out my latests sets on MixCloud</span>
                      <ChevronRightIcon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </span>
                  </a>
                </div>
                <div className="mt-6 sm:max-w-xl">
                  <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                    Open Format
                    <br />
                    Mobile DJ + MC
                  </h1>
                  <p className="mt-6 text-xl text-gray-500">
                    Providing custom mixed sound tracks at venues through out
                    the beautiful Central Coast of California. Over 5 years and
                    100+ events of experience delivering quality audio
                    experience to crowds upwords of 500 guests of all ages and
                    backgrounds.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="sm:mx-auto sm:max-w-3xl sm:px-6">
            <div className="py-12 sm:relative sm:mt-12 sm:py-16 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
              <div className="hidden sm:block">
                <div className="absolute inset-y-0 left-1/2 w-screen bg-gray-50 rounded-l-3xl lg:left-80 lg:right-0 lg:w-full" />
                <svg
                  className="absolute top-8 right-1/2 -mr-3 lg:m-0 lg:left-0"
                  width={404}
                  height={392}
                  fill="none"
                  viewBox="0 0 404 392"
                >
                  <defs>
                    <pattern
                      id="837c3e70-6c3a-44e6-8854-cc48c737b659"
                      x={0}
                      y={0}
                      width={20}
                      height={20}
                      patternUnits="userSpaceOnUse"
                    >
                      <rect
                        x={0}
                        y={0}
                        width={4}
                        height={4}
                        className="text-gray-200"
                        fill="currentColor"
                      />
                    </pattern>
                  </defs>
                  <rect
                    width={404}
                    height={392}
                    fill="url(#837c3e70-6c3a-44e6-8854-cc48c737b659)"
                  />
                </svg>
              </div>
              <div className="relative pl-4 -mr-40 sm:mx-auto sm:max-w-3xl sm:px-0 lg:max-w-none lg:h-full lg:pl-12">
                <img
                  className="w-full rounded-md shadow-xl ring-1 ring-black ring-opacity-5 lg:h-full lg:w-auto lg:max-w-none"
                  src="/hero-image.jpg"
                  alt=""
                />
              </div>
            </div>
          </div>
        </div>

        {/* About 1 */}
        <div className="relative mt-20">
          <div className="lg:mx-auto lg:max-w-7xl lg:px-8 lg:grid lg:grid-cols-2 lg:gap-24 lg:items-start">
            <div className="relative sm:py-16 lg:py-0">
              <div
                aria-hidden="true"
                className="hidden sm:block lg:absolute lg:inset-y-0 lg:right-0 lg:w-screen"
              >
                <div className="absolute inset-y-0 right-1/2 w-full bg-gray-50 rounded-r-3xl lg:right-72" />
                <svg
                  className="absolute top-8 left-1/2 -ml-3 lg:-right-8 lg:left-auto lg:top-12"
                  width={404}
                  height={392}
                  fill="none"
                  viewBox="0 0 404 392"
                >
                  <defs>
                    <pattern
                      id="02f20b47-fd69-4224-a62a-4c9de5c763f7"
                      x={0}
                      y={0}
                      width={20}
                      height={20}
                      patternUnits="userSpaceOnUse"
                    >
                      <rect
                        x={0}
                        y={0}
                        width={4}
                        height={4}
                        className="text-gray-200"
                        fill="currentColor"
                      />
                    </pattern>
                  </defs>
                  <rect
                    width={404}
                    height={392}
                    fill="url(#02f20b47-fd69-4224-a62a-4c9de5c763f7)"
                  />
                </svg>
              </div>
              <div className="relative mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-0 lg:max-w-none lg:py-20">
                {/* Testimonial card*/}
                <div className="relative pt-64 pb-10 rounded-2xl shadow-xl overflow-hidden">
                  <img
                    className="absolute inset-0 h-full w-full object-cover"
                    src="/dj-ybre-day.jpg"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-rose-500 mix-blend-multiply" />
                  <div className="absolute inset-0 bg-gradient-to-t from-rose-600 via-rose-600 opacity-90 hover:opacity-0" />
                  <div className="relative px-8">
                    <div></div>
                    <blockquote className="mt-8">
                      <div className="relative text-lg font-medium text-white md:flex-grow">
                        <svg
                          className="absolute top-0 left-0 transform -translate-x-3 -translate-y-2 h-8 w-8 text-rose-400"
                          fill="currentColor"
                          viewBox="0 0 32 32"
                          aria-hidden="true"
                        >
                          <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                        </svg>
                        <p className="relative">
                          Lets create the perfect event that your guests will
                          talk about for years to come! I will leverage your
                          music preferences and favorite jams and add in 20/20
                          Crowd Reading Vision to birth the ultimate vibe.
                        </p>
                      </div>

                      <footer className="mt-4">
                        <p className="text-base font-semibold text-rose-200">
                          LaDell Erby, AKA DJ YBRE
                        </p>
                      </footer>
                    </blockquote>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-0">
              {/* Content area */}
              <div className="pt-12 px-100 sm:pt-10 lg:pt-2">
              <h2 className="leading-6 text-rose-600 font-semibold tracking-wide uppercase">
                Let's Connect
              </h2>
              <h3 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Check the Vibes
              </h3>
              <p className="mt-8 text-lg text-gray-500">
Below are links to my platform that you can use to experience my style. Live sets, playlists, original content and more. Schedule a virtual meeting if you need more info!  
              </p>
                <Flex
                  w={['100%', '100%', '100%', '100%']}
                  direction={['column', 'column', 'row', 'column']}
                  bg={bg}
                  rounded="none"
                  align="center"
                  p={50}
                >
                  <PadBoard
                    buttons={LinkPadList}
                    columns={2}
                    buttonSize="175px"
                  />
                </Flex>
              </div>
            </div>
          </div>
        </div>

        {/* About 2*/}
        <div className="relative">
          <div className="lg:mx-auto lg:max-w-7xl lg:px-8 lg:grid lg:grid-cols-2 lg:gap-24 lg:items-start">
            <div className="relative mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-0">
              {/* Content area */}

              <h2 className="leading-6 text-rose-600 font-semibold tracking-wide uppercase">
                Live from the studio
              </h2>
              <h3 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Fresh Samples
              </h3>
              <p className="mt-8 text-lg text-gray-500">
                Whats a set with out some air horn and other hype sound clips.
                Here are some of my current favorite sound bits (some viral +
                some classics). Interact with sample pad below! 
              </p>
              <div className="pt-1 px-100px sm:pt-1 lg:pt-1">
                <Flex
                  w={['100%', '100%', '100%', '100%']}
                  direction={['column', 'column', 'row', 'column']}
                  bg={bg}
                  rounded="none"
                  align="center"
                  p={50}
                >
                  <PadBoard
                    buttons={SamplePadList}
                    columns={4}
                    buttonSize="90px"
                  />
                </Flex>
              </div>
            </div>
            {/* Background SVG */}
            <div className="relative sm:py-0 lg:py-0">
              <div
                aria-hidden="true"
                className="hidden sm:block lg:absolute lg:inset-y-0 lg:left-0"
              >
                <div className="absolute inset-y-0 left-1/2 bg-gray-50 rounded-r-3xl lg:left-72" />
                <svg
                  className="absolute top-8 right-1/2 -mr-3 lg:-left-8 lg:right-auto lg:top-12"
                  width={404}
                  height={392}
                  fill="none"
                  viewBox="0 0 404 392"
                >
                  <defs>
                    <pattern
                      id="02f20b47-fd69-4224-a62a-4c9de5c763f7"
                      x={0}
                      y={0}
                      width={20}
                      height={20}
                      patternUnits="userSpaceOnUse"
                    >
                      <rect
                        x={0}
                        y={0}
                        width={4}
                        height={4}
                        className="text-gray-200"
                        fill="currentColor"
                      />
                    </pattern>
                  </defs>
                  <rect
                    width={404}
                    height={392}
                    fill="url(#02f20b47-fd69-4224-a62a-4c9de5c763f7)"
                  />
                </svg>
              </div>
              <div className="relative mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-0 lg:max-w-none lg:py-0">
                {/* Testimonial card*/}
                <div className="relative pt-64 pb-10 rounded-2xl shadow-xl overflow-hidden">
                  <img
                    className="absolute inset-0 h-full w-full object-cover"
                    src="/dj-ybre-night.jpg"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-rose-500 mix-blend-multiply" />
                  <div className="absolute inset-0 bg-gradient-to-t from-rose-600 via-rose-600 opacity-90 hover:opacity-0" />
                  <div className="relative px-8">
                    <blockquote className="mt-8">
                      <div className="relative text-lg font-medium text-white md:flex-grow">
                        <svg
                          className="absolute top-0 left-0 transform -translate-x-3 -translate-y-2 h-8 w-8 text-rose-400"
                          fill="currentColor"
                          viewBox="0 0 32 32"
                          aria-hidden="true"
                        >
                          <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                        </svg>
                        <p className="relative">
                          I play songs that you never knew you needed to hear.
                          My goal is to unite your guests with precision track
                          selection and give every one a Stayin Alive X Hot In
                          Herre blend they never knew they needed.
                        </p>
                      </div>

                      <footer className="mt-4">
                        <p className="text-base font-semibold text-rose-200">
                          LaDell Erby, AKA DJ YBRE
                        </p>
                      </footer>
                    </blockquote>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <NewsletterForm/>
      </main>

      {/* Footer section */}
      <Footer/>
    </div>
  );
}
