import { type Metadata } from 'next'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'

import { RootLayout } from '@/components/RootLayout'
import { CalendlyLoader } from '@/components/CalendlyLoader'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
  title: {
    template: '%s - DJ YBRE',
    default: 'DJ YBRE - Event DJ + MC',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-neutral-950 text-base antialiased">
      <body className="flex min-h-full flex-col">
        <CalendlyLoader />
        <Script
          src="https://assets.calendly.com/assets/external/widget.js"
          strategy="lazyOnload"
        />
        <RootLayout>{children}</RootLayout>
        <Analytics />
      </body>
    </html>
  )
}
