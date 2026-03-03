'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

import { IconCalendar, IconExternalLink, IconLayers, IconList, IconMenu, IconX } from './icons'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<React.ComponentPropsWithoutRef<'svg'>>
}

const NAV: NavItem[] = [
  { href: '/event-portal/manage', label: 'Events', icon: IconList },
  { href: '/event-portal/manage/calendar', label: 'Calendar', icon: IconCalendar },
  { href: '/event-portal/manage/templates', label: 'Templates', icon: IconLayers },
  { href: '/event-portal', label: 'Portal overview', icon: IconExternalLink },
]

function isActive(pathname: string, href: string) {
  if (href === '/event-portal/manage') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('admin-theme')
    return () => {
      document.documentElement.classList.remove('admin-theme')
    }
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const navItems = useMemo(
    () =>
      NAV.map((item) => ({
        ...item,
        active: isActive(pathname, item.href),
      })),
    [pathname]
  )

  return (
    <div className="admin-theme min-h-full bg-[var(--admin-bg)] text-[var(--admin-fg)]">
      <div className="flex min-h-screen">
        {/* Mobile overlay */}
        <div
          className={clsx(
            'fixed inset-0 z-40 bg-black/40 transition lg:hidden',
            mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        <aside
          className={clsx(
            'fixed inset-y-0 left-0 z-50 flex w-72 translate-x-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-lg transition lg:static lg:z-auto lg:shadow-none',
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
          aria-label="Admin sidebar"
        >
          <div className="flex h-16 items-center gap-3 border-b border-[var(--admin-border)] px-6">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--admin-primary)] text-white">
              <span className="text-sm font-bold">Y</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Event Portal Admin</p>
              <p className="truncate text-xs text-[var(--admin-muted)]">DJ YBRE</p>
            </div>
            <button
              type="button"
              className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-fg)] hover:bg-[var(--admin-surface-2)] lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
              Event Portal
            </p>
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition',
                    item.active
                      ? 'bg-[var(--admin-primary)] text-white'
                      : 'text-[var(--admin-fg)] hover:bg-black/5'
                  )}
                >
                  <item.icon
                    className={clsx('h-5 w-5', item.active ? 'text-white' : 'text-[var(--admin-muted)]')}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/90 px-4 backdrop-blur sm:px-6">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-fg)] hover:bg-[var(--admin-surface-2)] lg:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {mobileOpen ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--admin-fg)]">
                {pathname?.startsWith('/event-portal/manage/templates')
                  ? 'Templates'
                  : pathname?.startsWith('/event-portal/manage/events')
                    ? 'Event Details'
                    : 'Manage Events'}
              </p>
              <p className="truncate text-xs text-[var(--admin-muted)]">Admin</p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/"
                className="hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm font-semibold text-[var(--admin-fg)] transition hover:bg-[var(--admin-surface-2)] sm:inline-flex"
              >
                View site
              </Link>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

