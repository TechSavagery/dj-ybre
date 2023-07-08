/*
  This example requires Tailwind CSS v2.0+ 
  
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
      require('@tailwindcss/aspect-ratio'),
    ],
  }
  ```
*/
import { Fragment, useRef, useState } from "react";
import {
  Dialog,
  Disclosure,
  Menu,
  Popover,
  Tab,
  Transition,
} from "@headlessui/react";
import {
  MenuIcon,
  SearchIcon,
  ShoppingCartIcon,
  UserIcon,
  XIcon,
} from "@heroicons/react/outline";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/solid";
import Footer from "./components/ui/footer";
import SpotifyCard from "./components/ui/widgets/spotify/spotify-card";
import SpotifyPlayer from "react-spotify-player";

import {
  Card,
  Metric,
  Text,
  List,
  ListItem,
  BadgeDelta,
  Flex,
  Bold,
  DeltaType,
  Grid,
} from "@tremor/react";

const sales = [
  {
    name: "Switzerland",
    stat: "18.3%",
    status: "increase",
  },
  {
    name: "Germany",
    stat: "8.3%",
    status: "moderateIncrease",
  },
  {
    name: "Italy",
    stat: "1.6%",
    status: "unchanged",
  },
  {
    name: "France",
    stat: "-5.1%",
    status: "moderateDecrease",
  },
];

const profit = [
  {
    name: "Switzerland",
    stat: "1.3%",
    status: "unchanged",
  },
  {
    name: "Germany",
    stat: "3.3%",
    status: "moderateIncrease",
  },
  {
    name: "Italy",
    stat: "2.6%",
    status: "moderateIncrease",
  },
  {
    name: "France",
    stat: "-8.2%",
    status: "decrease",
  },
];

const customers = [
  {
    name: "Switzerland",
    stat: "-6.3%",
    status: "moderateDecrease",
  },
  {
    name: "Germany",
    stat: "6.7%",
    status: "increase",
  },
  {
    name: "Italy",
    stat: "2.9%",
    status: "moderateIncrease",
  },
  {
    name: "France",
    stat: "1.2%",
    status: "unchanged",
  },
];

const categories = [
  {
    title: "Sales",
    metric: "$ 23,456",
    data: sales,
  },
  {
    title: "Profit",
    metric: "$ 16,450",
    data: profit,
  },
  {
    title: "Customers",
    metric: "456",
    data: customers,
  },
];

const navigation = {
  categories: [
    {
      name: "Women",
      featured: [
        { name: "Sleep", href: "#" },
        { name: "Swimwear", href: "#" },
        { name: "Underwear", href: "#" },
      ],
      collection: [
        { name: "Everything", href: "#" },
        { name: "Core", href: "#" },
        { name: "New Arrivals", href: "#" },
        { name: "Sale", href: "#" },
      ],
      categories: [
        { name: "Basic Tees", href: "#" },
        { name: "Artwork Tees", href: "#" },
        { name: "Bottoms", href: "#" },
        { name: "Underwear", href: "#" },
        { name: "Accessories", href: "#" },
      ],
      brands: [
        { name: "Full Nelson", href: "#" },
        { name: "My Way", href: "#" },
        { name: "Re-Arranged", href: "#" },
        { name: "Counterfeit", href: "#" },
        { name: "Significant Other", href: "#" },
      ],
    },
    {
      name: "Men",
      featured: [
        { name: "Casual", href: "#" },
        { name: "Boxers", href: "#" },
        { name: "Outdoor", href: "#" },
      ],
      collection: [
        { name: "Everything", href: "#" },
        { name: "Core", href: "#" },
        { name: "New Arrivals", href: "#" },
        { name: "Sale", href: "#" },
      ],
      categories: [
        { name: "Artwork Tees", href: "#" },
        { name: "Pants", href: "#" },
        { name: "Accessories", href: "#" },
        { name: "Boxers", href: "#" },
        { name: "Basic Tees", href: "#" },
      ],
      brands: [
        { name: "Significant Other", href: "#" },
        { name: "My Way", href: "#" },
        { name: "Counterfeit", href: "#" },
        { name: "Re-Arranged", href: "#" },
        { name: "Full Nelson", href: "#" },
      ],
    },
  ],
  pages: [
    { name: "Home", href: "" },
    { name: "Instagram", href: "https://www.instagram.com/djybre/" },
    { name: "Mixcloud", href: "/contact.html" },
    { name: "Contact", href: "/contact.html" },
  ],
};

const sortOptions = [
  { name: "Creation Date", href: "#", current: true },
  { name: "Rating (Likes)", href: "#", current: false },
];
const filters = [
  {
    id: "tag",
    name: "Tag",
    options: [
      { value: "wedding", label: "Wedding", checked: false },
      {
        value: "wedding-grand-entrance",
        label: "Wedding: Grand Entrance",
        checked: false,
      },
      {
        value: "wedding-parent-dances",
        label: "Wedding:Parent Dances",
        checked: true,
      },
      { value: "wedding-cocktail", label: "Wedding: Cocktail", checked: false },
      {
        value: "wedding-recessional",
        label: "Wedding: Recessional",
        checked: false,
      },
    ],
  },
];
const activeFilters: any[] = [];
const products = [
  {
    id: 1,
    name: "Earthen Bottle",
    href: "#",
    price: "$48",
    imageSrc:
      "https://tailwindui.com/img/ecommerce-images/category-page-04-image-card-01.jpg",
    imageAlt:
      "Tall slender porcelain bottle with natural clay textured body and cork stopper.",
  },
  {
    id: 2,
    name: "Nomad Tumbler",
    href: "#",
    price: "$35",
    imageSrc:
      "https://tailwindui.com/img/ecommerce-images/category-page-04-image-card-02.jpg",
    imageAlt:
      "Olive drab green insulated bottle with flared screw lid and flat top.",
  },
  {
    id: 3,
    name: "Focus Paper Refill",
    href: "#",
    price: "$89",
    imageSrc:
      "https://tailwindui.com/img/ecommerce-images/category-page-04-image-card-03.jpg",
    imageAlt:
      "Person using a pen to cross a task off a productivity paper card.",
  },
  {
    id: 4,
    name: "Machined Mechanical Pencil",
    href: "#",
    price: "$35",
    imageSrc:
      "https://tailwindui.com/img/ecommerce-images/category-page-04-image-card-04.jpg",
    imageAlt:
      "Hand holding black machined steel mechanical pencil with brass tip and top.",
  },
  // More products...
];

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function SpotifyPlaylists(props: any) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [open, setOpen] = useState(true);

  const [spotifyUri, setSpotifyUri] = useState("");

  const cancelButtonRef = useRef(null);

  const size = {
    width: "400px",
    height: "400px",
  };

  return (
    <div className="bg-gray-50">
      <div>
        {/* Mobile menu */}
        <Transition.Root show={mobileMenuOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 flex z-40 lg:hidden"
            onClose={setMobileMenuOpen}
          >
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <div className="relative max-w-xs w-full bg-white shadow-xl pb-12 flex flex-col overflow-y-auto">
                <div className="px-4 pt-5 pb-2 flex">
                  <button
                    type="button"
                    className="-m-2 p-2 rounded-md inline-flex items-center justify-center text-gray-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="sr-only">Close menu</span>
                    <XIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="border-t border-gray-200 py-6 px-4 space-y-6">
                  {navigation.pages.map((page) => (
                    <div key={page.name} className="flow-root">
                      <a
                        href={page.href}
                        className="-m-2 p-2 block font-medium text-gray-900"
                      >
                        {page.name}
                      </a>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 py-6 px-4 space-y-6">
                  <div className="flow-root">
                    <a
                      href="/spotify"
                      className="-m-2 p-2 block font-medium text-gray-900"
                    >
                      Spotify
                    </a>
                  </div>
                  <div className="flow-root">
                    <a
                      href="/mixcloud"
                      className="-m-2 p-2 block font-medium text-gray-900"
                    >
                      MixCloud
                    </a>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </Dialog>
        </Transition.Root>

        <header className="relative">
          <nav aria-label="Top">
            {/* Secondary navigation */}
            <div className="bg-white">
              <div className="max-w-7xl mx-auto px-4 pt-2 sm:px-6 lg:px-8 lg:pt-16">
                <div className="">
                  <div className="h-16 flex items-center justify-between">
                    {/* Logo (lg+) */}
                    <div className="hidden lg:flex lg:items-center">
                      <a href="#">
                        <span className="sr-only">Workflow</span>
                        <img
                          className="h-40 w-auto"
                          src="/logo-v1.png"
                          alt=""
                        />
                      </a>
                    </div>

                    <div className="hidden h-full lg:flex">
                      {/* Mega menus */}
                      <Popover.Group className="ml-8">
                        <div className="h-full flex justify-center space-x-8">
                          {navigation.pages.map((page) => (
                            <a
                              key={page.name}
                              href={page.href}
                              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-800"
                            >
                              {page.name}
                            </a>
                          ))}
                        </div>
                      </Popover.Group>
                    </div>

                    {/* Mobile menu and search (lg-) */}
                    <div className="flex-1 flex items-center lg:hidden">
                      <button
                        type="button"
                        className="-ml-2 bg-white p-2 rounded-md text-gray-400"
                        onClick={() => setMobileMenuOpen(true)}
                      >
                        <span className="sr-only">Open menu</span>
                        <MenuIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Logo (lg-) */}
                    <a href="/" className="lg:hidden">
                      <span className="sr-only">DJ YBRE</span>
                      <img
                        src="/logo-text-only.png"
                        alt=""
                        className="h-16 w-auto"
                      />
                    </a>
                    <div className="flex-1 flex items-center justify-end"></div>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </header>
      </div>

      <div>
        {/* Mobile filter dialog */}
        <Transition.Root show={mobileFiltersOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 flex z-40 sm:hidden"
            onClose={setMobileFiltersOpen}
          >
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="ml-auto relative max-w-xs w-full h-full bg-white shadow-xl py-4 pb-12 flex flex-col overflow-y-auto">
                <div className="px-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                  <button
                    type="button"
                    className="-mr-2 w-10 h-10 bg-white p-2 rounded-md flex items-center justify-center text-gray-400"
                    onClick={() => setMobileFiltersOpen(false)}
                  >
                    <span className="sr-only">Close menu</span>
                    <XIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                {/* Filters */}'{" "}
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Button text
                </button>
                '
                <form className="mt-4">
                  {filters.map((section) => (
                    <Disclosure
                      as="div"
                      key={section.name}
                      className="border-t border-gray-200 px-4 py-6"
                    >
                      {({ open }) => (
                        <>
                          <h3 className="-mx-2 -my-3 flow-root">
                            <Disclosure.Button className="px-2 py-3 bg-white w-full flex items-center justify-between text-sm text-gray-400">
                              <span className="font-medium text-gray-900">
                                {section.name}
                              </span>
                              <span className="ml-6 flex items-center">
                                <ChevronDownIcon
                                  className={classNames(
                                    open ? "-rotate-180" : "rotate-0",
                                    "h-5 w-5 transform"
                                  )}
                                  aria-hidden="true"
                                />
                              </span>
                            </Disclosure.Button>
                          </h3>
                          <Disclosure.Panel className="pt-6">
                            <div className="space-y-6">
                              {section.options.map((option, optionIdx) => (
                                <div
                                  key={option.value}
                                  className="flex items-center"
                                >
                                  <input
                                    id={`filter-mobile-${section.id}-${optionIdx}`}
                                    name={`${section.id}[]`}
                                    defaultValue={option.value}
                                    type="checkbox"
                                    defaultChecked={option.checked}
                                    className="h-4 w-4 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <label
                                    htmlFor={`filter-mobile-${section.id}-${optionIdx}`}
                                    className="ml-3 text-sm text-gray-500"
                                  >
                                    {option.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  ))}
                </form>
              </div>
            </Transition.Child>
          </Dialog>
        </Transition.Root>
        {/* Main Spotify Player */}

        <Transition.Root show={open} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-10"
            initialFocus={cancelButtonRef}
            onClose={setOpen}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative transform rounded-lg bg-transparent px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <SpotifyPlayer
                      uri="https://open.spotify.com/playlist/2FV9m2NU027Y8nm7b9yBi8"
                      size={{
                        width: "500px",
                        height: "500px",
                      }}
                      view="list"
                      theme="dark"
                      id="spotify-player"
                    ></SpotifyPlayer>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>

        <main>
          <div className="bg-white">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                Spotify x DJ YBRE
              </h1>
              <p className="mt-4 max-w-xl text-sm text-gray-700">
                Check out some hand curated playlist top help spark some
                inspiration for your event. These lists have a wide range of
                genres and vibes. If you can's find what you arte looking for,
                reach out and I can whip something up for you!
              </p>
            </div>
          </div>

          {/* Filters */}
          <section aria-labelledby="filter-heading">
            <h2 id="filter-heading" className="sr-only">
              Test
            </h2>
            <h2 id="filter-heading" className="sr-only">
              Filters
            </h2>

            <div className="relative z-10 bg-white border-b border-gray-200 pb-4">
              <div className="max-w-7xl mx-auto px-4 flex items-center justify-between sm:px-6 lg:px-8">
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button className="group inline-flex justify-center text-sm font-medium text-gray-700 hover:text-gray-900">
                      Sort
                      <ChevronDownIcon
                        className="flex-shrink-0 -mr-1 ml-1 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                        aria-hidden="true"
                      />
                    </Menu.Button>
                  </div>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="origin-top-left absolute left-0 mt-2 w-40 rounded-md shadow-2xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        {sortOptions.map((option) => (
                          <Menu.Item key={option.name}>
                            {({ active }) => (
                              <a
                                href={option.href}
                                className={classNames(
                                  option.current
                                    ? "font-medium text-gray-900"
                                    : "text-gray-500",
                                  active ? "bg-gray-100" : "",
                                  "block px-4 py-2 text-sm"
                                )}
                              >
                                {option.name}
                              </a>
                            )}
                          </Menu.Item>
                        ))}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>

                <button
                  type="button"
                  className="inline-block text-sm font-medium text-gray-700 hover:text-gray-900 sm:hidden"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  Filters
                </button>

                <div className="hidden sm:block">
                  <div className="flow-root">
                    <Popover.Group className="-mx-4 flex items-center divide-x divide-gray-200">
                      {filters.map((section, sectionIdx) => (
                        <Popover
                          key={section.name}
                          className="px-4 relative inline-block text-left"
                        >
                          <Popover.Button className="group inline-flex justify-center text-sm font-medium text-gray-700 hover:text-gray-900">
                            <span>{section.name}</span>
                            {sectionIdx === 0 ? (
                              <span className="ml-1.5 rounded py-0.5 px-1.5 bg-gray-200 text-xs font-semibold text-gray-700 tabular-nums">
                                1
                              </span>
                            ) : null}
                            <ChevronDownIcon
                              className="flex-shrink-0 -mr-1 ml-1 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                              aria-hidden="true"
                            />
                          </Popover.Button>

                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Popover.Panel className="origin-top-right absolute right-0 mt-2 bg-white rounded-md shadow-2xl p-4 ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <form className="space-y-4">
                                {section.options.map((option, optionIdx) => (
                                  <div
                                    key={option.value}
                                    className="flex items-center"
                                  >
                                    <input
                                      id={`filter-${section.id}-${optionIdx}`}
                                      name={`${section.id}[]`}
                                      defaultValue={option.value}
                                      type="checkbox"
                                      defaultChecked={option.checked}
                                      className="h-4 w-4 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label
                                      htmlFor={`filter-${section.id}-${optionIdx}`}
                                      className="ml-3 pr-6 text-sm font-medium text-gray-900 whitespace-nowrap"
                                    >
                                      {option.label}
                                    </label>
                                  </div>
                                ))}
                              </form>
                            </Popover.Panel>
                          </Transition>
                        </Popover>
                      ))}
                    </Popover.Group>
                  </div>
                </div>
              </div>
            </div>

            {/* Active filters */}
            <div className="bg-gray-100">
              <div className="max-w-7xl mx-auto py-3 px-4 sm:flex sm:items-center sm:px-6 lg:px-8">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Filters
                  <span className="sr-only">, active</span>
                </h3>

                <div
                  aria-hidden="true"
                  className="hidden w-px h-5 bg-gray-300 sm:block sm:ml-4"
                />

                <div className="mt-2 sm:mt-0 sm:ml-4">
                  <div className="-m-1 flex flex-wrap items-center">
                    {activeFilters.map((activeFilter) => (
                      <span
                        key={activeFilter.value}
                        className="m-1 inline-flex rounded-full border border-gray-200 items-center py-1.5 pl-3 pr-2 text-sm font-medium bg-white text-gray-900"
                      >
                        <span>{activeFilter.label}</span>
                        <button
                          type="button"
                          className="flex-shrink-0 ml-1 h-4 w-4 p-1 rounded-full inline-flex text-gray-400 hover:bg-gray-200 hover:text-gray-500"
                        >
                          <span className="sr-only">
                            Remove filter for {activeFilter.label}
                          </span>
                          <svg
                            className="h-2 w-2"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 8 8"
                          >
                            <path
                              strokeLinecap="round"
                              strokeWidth="1.5"
                              d="M1 1l6 6m0-6L1 7"
                            />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {}}
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </section>

          {/* Product grid */}
          <section
            aria-labelledby="products-heading"
            className="max-w-2xl mx-auto pt-12 pb-16 px-4 sm:pt-16 sm:pb-24 sm:px-6 lg:max-w-7xl lg:px-8 hidden xl:grid"
          >
            <h2 id="products-heading" className="sr-only">
              Products
            </h2>
            <Grid numColsSm={2} numColsLg={3} className="gap-6">
              {categories.map((item) => (
                <Card key={item.title}>
                  <Text>{item.title}</Text>
                  <Metric>{item.metric}</Metric>
                  <Flex className="mt-6">
                    <Text>
                      <Bold>Country</Bold>
                    </Text>
                    <Text>
                      <Bold>WoW (%)</Bold>
                    </Text>
                  </Flex>
                  <List className="mt-1">
                    {item.data.map((country) => (
                      <ListItem key={country.name}>
                        <Flex
                          justifyContent="start"
                          className="truncate space-x-2.5"
                        >
                          <BadgeDelta deltaType={country.status as DeltaType} />
                          <Text className="truncate">{country.name}</Text>
                        </Flex>
                        <Text>{country.stat}</Text>
                      </ListItem>
                    ))}
                  </List>
                </Card>
              ))}
            </Grid>

            <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-3 ">
              {props.playlists.map((playlist: any) => (
                <div>
                  <SpotifyPlayer
                    uri={playlist.uri}
                    size={size}
                    view="list"
                    theme="dark"
                    id="spotify-player"
                  ></SpotifyPlayer>
                  <h3 className="mt-4 text-sm text-gray-700">
                    {playlist.name}
                  </h3>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    {playlist.price}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps({ req }: any) {
  const res = await fetch(`${process.env.URL}/api/spotify/playlists`);
  const playlists = await res.json();

  return {
    props: {
      playlists,
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: 10, // In seconds
  };
}
