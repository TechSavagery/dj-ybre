import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

import { Fragment, useState } from "react";
import { Dialog, Popover, Tab, Transition } from "@headlessui/react";

const navigation = {
  categories: [],
  pages: [
    {
      name: "Wedding Site",
      href: "https://www.theknot.com/us/blaire-bass-and-derek-hill-jan-2024",
    },
    {
      name: "Registry",
      href: "https://www.theknot.com/us/blaire-bass-and-derek-hill-jan-2024/registry",
    },
  ],
};
const favorites = [
  {
    id: 1,
    name: "Black Basic Tee",
    price: "$32",
    href: "#",
    imageSrc:
      "https://tailwindui.com/img/ecommerce-images/home-page-03-favorite-01.jpg",
    imageAlt: "Model wearing women's black cotton crewneck tee.",
  },
  {
    id: 2,
    name: "Off-White Basic Tee",
    price: "$32",
    href: "#",
    imageSrc:
      "https://tailwindui.com/img/ecommerce-images/home-page-03-favorite-02.jpg",
    imageAlt: "Model wearing women's off-white cotton crewneck tee.",
  },
  {
    id: 3,
    name: "Mountains Artwork Tee",
    price: "$36",
    href: "#",
    imageSrc:
      "https://tailwindui.com/img/ecommerce-images/home-page-03-favorite-03.jpg",
    imageAlt:
      "Model wearing women's burgundy red crewneck artwork tee with small white triangle overlapping larger black triangle.",
  },
];
const footerNavigation = {
  shop: [
    { name: "Bags", href: "#" },
    { name: "Tees", href: "#" },
    { name: "Objects", href: "#" },
    { name: "Home Goods", href: "#" },
    { name: "Accessories", href: "#" },
  ],
  company: [
    { name: "Who we are", href: "#" },
    { name: "Sustainability", href: "#" },
    { name: "Press", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Terms & Conditions", href: "#" },
    { name: "Privacy", href: "#" },
  ],
  account: [
    { name: "Manage Account", href: "#" },
    { name: "Returns & Exchanges", href: "#" },
    { name: "Redeem a Gift Card", href: "#" },
  ],
  connect: [
    { name: "Contact Us", href: "#" },
    { name: "Twitter", href: "#" },
    { name: "Instagram", href: "#" },
    { name: "Pinterest", href: "#" },
  ],
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const RedirectPage: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white">
      {/* Your page content goes here */}
      <Head>
        {/* Add OG image meta tags */}
        <meta property="og:image" content="/weddings/hill.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:description"
          content="Calling all music enthusiasts and dancefloor divas – get ready to be part of the hottest wedding dance experience ever! 🎉🕺💃 We're putting the power of music selection in your hands, so you can help curate the soundtrack for an unforgettable night of celebration!  Derek + Blaire"
        />
        <title>Derek + Blaire Hill Wedding Song Requests</title>
      </Head>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-col overflow-y-auto bg-white pb-12 shadow-xl">
                <div className="flex px-4 pb-2 pt-5">
                  <button
                    type="button"
                    className="relative -m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400"
                    onClick={() => setOpen(false)}
                  >
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Close menu</span>
                  </button>
                </div>

                {/* Links */}

                <div className="space-y-6 border-t border-gray-200 px-4 py-6">
                  {navigation.pages.map((page) => (
                    <div key={page.name} className="flow-root">
                      <a
                        href={page.href}
                        className="-m-2 block p-2 font-medium text-gray-900"
                      >
                        {page.name}
                      </a>
                    </div>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <header className="relative overflow-hidden">
        {/* Top navigation */}
        <nav
          aria-label="Top"
          className="relative z-20 bg-white bg-opacity-90 backdrop-blur-xl backdrop-filter"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center">
              {/* Logo */}
              <div className="ml-4 flex lg:ml-0">
                <a href="#">
                  <span className="sr-only">Your Company</span>
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white border-black border-2">
                    <span className="text-md font-medium leading-none text-black">
                      B & D
                    </span>
                  </span>
                </a>
              </div>

              {/* Flyout menus */}
            </div>
          </div>
        </nav>

        {/* Hero section */}
        <div className="pb-80 pt-16 sm:pb-40 sm:pt-24 lg:pb-48 lg:pt-40">
          <div className="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
            <div className="sm:max-w-lg">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                We are ready to dance all night with you!
              </h1>
              <p className="mt-4 text-xl text-gray-500">
                Please help us curate the absolute vibe for the dance floor. We
                are giving you the AUX! Click link below and sign into Spotify
                to add requests to our playlist.
              </p>
            </div>
            <div>
              <div className="mt-10">
                {/* Decorative image grid */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none lg:absolute lg:inset-y-0 lg:mx-auto lg:w-full lg:max-w-7xl"
                >
                  <div className="absolute transform sm:left-1/2 sm:top-0 sm:translate-x-8 lg:left-1/2 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-8">
                    <div className="flex items-center space-x-6 lg:space-x-8">
                      <div className="grid flex-shrink-0 grid-cols-1 gap-y-6 lg:gap-y-8">
                        <div className="h-64 w-44 overflow-hidden rounded-lg sm:opacity-0 lg:opacity-100">
                          <img
                            src="/weddings/hill-1.png"
                            alt=""
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                        <div className="h-64 w-44 overflow-hidden rounded-lg">
                          <img
                            src="/weddings/hill-2.png"
                            alt=""
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                      </div>
                      <div className="grid flex-shrink-0 grid-cols-1 gap-y-6 lg:gap-y-8">
                        <div className="h-64 w-44 overflow-hidden rounded-lg">
                          <img
                            src="/weddings/hill-3.png"
                            alt=""
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                        <div className="h-64 w-44 overflow-hidden rounded-lg">
                          <img
                            src="/weddings/hill-4.png"
                            alt=""
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                        <div className="h-64 w-44 overflow-hidden rounded-lg">
                          <img
                            src="/weddings/hill-5.png"
                            alt=""
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                      </div>
                      <div className="grid flex-shrink-0 grid-cols-1 gap-y-6 lg:gap-y-8">
                        <div className="h-64 w-44 overflow-hidden rounded-lg">
                          <img
                            src="/weddings/hill-6.png"
                            alt=""
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                        <div className="h-64 w-44 overflow-hidden rounded-lg">
                          <img
                            src="/weddings/hill-7.png"
                            alt=""
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href="https://open.spotify.com/playlist/5aHzp5WJjcStcPqNuSAncK?si=94087031d1ba4355&pt=35d490a23e9adf530df4d35254d4cd02"
                  className="inline-block rounded-md border-2 border-black bg-white px-8 py-3 text-center font-medium text-black hover:bg-black hover:text-white"
                >
                  Add Request
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* CTA section */}
        {/* <section aria-labelledby="sale-heading">
          <div className="overflow-hidden pt-32 sm:pt-14">
            <div className="bg-black">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative pb-16 pt-48 sm:pb-24">
                  <div>
                    <h2
                      id="sale-heading"
                      className="text-4xl font-bold tracking-tight text-white md:text-5xl"
                    >
                      Lets Party!
                    </h2>
                    <h2
                      id="sale-heading"
                      className="text-lg font-bold tracking-tight text-white md:text-3xl"
                    >
                      San Jose Del Cabo, 01.12.2024
                    </h2>
                  </div>

                  <div className="absolute -top-32 left-1/2 -translate-x-1/2 transform sm:top-6 sm:translate-x-0">
                    <div className="ml-24 flex min-w-max space-x-6 sm:ml-3 lg:space-x-8">
                      <div className="flex space-x-6 sm:flex-col sm:space-x-0 sm:space-y-6 lg:space-y-8">
                        <div className="flex-shrink-0">
                          <img
                            className="h-64 w-64 rounded-lg object-cover md:h-72 md:w-72"
                            src="https://tailwindui.com/img/ecommerce-images/home-page-03-category-01.jpg"
                            alt=""
                          />
                        </div>

                        <div className="mt-6 flex-shrink-0 sm:mt-0">
                          <img
                            className="h-64 w-64 rounded-lg object-cover md:h-72 md:w-72"
                            src="https://tailwindui.com/img/ecommerce-images/home-page-03-category-02.jpg"
                            alt=""
                          />
                        </div>
                      </div>
                      <div className="flex space-x-6 sm:-mt-20 sm:flex-col sm:space-x-0 sm:space-y-6 lg:space-y-8">
                        <div className="flex-shrink-0">
                          <img
                            className="h-64 w-64 rounded-lg object-cover md:h-72 md:w-72"
                            src="https://tailwindui.com/img/ecommerce-images/home-page-03-favorite-01.jpg"
                            alt=""
                          />
                        </div>

                        <div className="mt-6 flex-shrink-0 sm:mt-0">
                          <img
                            className="h-64 w-64 rounded-lg object-cover md:h-72 md:w-72"
                            src="https://tailwindui.com/img/ecommerce-images/home-page-03-favorite-02.jpg"
                            alt=""
                          />
                        </div>
                      </div>
                      <div className="flex space-x-6 sm:flex-col sm:space-x-0 sm:space-y-6 lg:space-y-8">
                        <div className="flex-shrink-0">
                          <img
                            className="h-64 w-64 rounded-lg object-cover md:h-72 md:w-72"
                            src="https://tailwindui.com/img/ecommerce-images/home-page-03-category-01.jpg"
                            alt=""
                          />
                        </div>

                        <div className="mt-6 flex-shrink-0 sm:mt-0">
                          <img
                            className="h-64 w-64 rounded-lg object-cover md:h-72 md:w-72"
                            src="https://tailwindui.com/img/ecommerce-images/home-page-03-category-02.jpg"
                            alt=""
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section> */}
      </main>
    </div>
  );
};

export default RedirectPage;
