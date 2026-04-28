'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'

import { AdminButton } from '@/components/admin/AdminButton'
import { AdminCard, AdminCardBody, AdminCardHeader } from '@/components/admin/AdminCard'
import { AdminCheckbox, AdminInput } from '@/components/admin/AdminForm'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

type EventItem = {
  id: string
  eventName: string
  eventType: string
  eventDate: string
  eventStartTime?: string | null
  eventEndTime?: string | null
  status: string
  hasSubmission: boolean
}

function toLocalDateTime(date: string, time?: string | null) {
  if (!time) return date // all-day: YYYY-MM-DD
  const normalized = time.length === 5 ? `${time}:00` : time
  return `${date}T${normalized}`
}

export default function EventPortalManageCalendarPage() {
  const router = useRouter()
  const calendarRef = useRef<FullCalendar | null>(null)

  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [typeFilter, setTypeFilter] = useState<Record<string, boolean>>({})
  const [jumpTo, setJumpTo] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/event-portal/events?includePast=1')
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error || 'Failed to load events')
        }
        const data = await res.json()
        const next = Array.isArray(data?.events) ? (data.events as EventItem[]) : []
        if (cancelled) return
        setEvents(next)

        // initialize filters (default: all on)
        const nextTypes = Array.from(new Set(next.map((e) => e.eventType).filter(Boolean))).sort()
        setTypeFilter((prev) => {
          if (Object.keys(prev).length) return prev
          return Object.fromEntries(nextTypes.map((t) => [t, true]))
        })
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load events')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const eventTypes = useMemo(
    () => Array.from(new Set(events.map((e) => e.eventType).filter(Boolean))).sort(),
    [events]
  )

  const visibleEvents = useMemo(() => {
    const anyFilters = Object.keys(typeFilter).length > 0
    if (!anyFilters) return events
    return events.filter((e) => typeFilter[e.eventType] !== false)
  }, [events, typeFilter])

  const calendarEvents = useMemo(
    () =>
      visibleEvents.map((e) => {
        const allDay = !e.eventStartTime
        const start = toLocalDateTime(e.eventDate, e.eventStartTime)
        const end = e.eventEndTime ? toLocalDateTime(e.eventDate, e.eventEndTime) : undefined

        // Subtle colors similar to Vuexy (primary/lilac for default, green if submitted)
        const color = e.hasSubmission ? 'rgba(40, 199, 111, 0.18)' : 'rgba(115, 103, 240, 0.18)'
        const borderColor = e.hasSubmission ? 'rgba(40, 199, 111, 0.45)' : 'rgba(115, 103, 240, 0.55)'
        const textColor = 'var(--admin-fg)'

        return {
          id: e.id,
          title: e.eventName,
          start,
          end,
          allDay,
          backgroundColor: color,
          borderColor,
          textColor,
          extendedProps: e,
        }
      }),
    [visibleEvents]
  )

  return (
    <div>
      <AdminPageHeader
        title="Calendar"
        description="See all event portals across month, week, day, or list views."
        actions={
          <AdminButton variant="secondary" href="/event-portal/manage">
            Create / manage events
          </AdminButton>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,_1fr)]">
        <AdminCard>
          <AdminCardHeader>
            <h2 className="text-base font-bold text-[var(--admin-fg)]">Controls</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Jump to a date and filter events.
            </p>
          </AdminCardHeader>
          <AdminCardBody>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--admin-fg)]">Jump to date</p>
                <AdminInput
                  type="date"
                  value={jumpTo}
                  onChange={(e) => {
                    const next = e.target.value
                    setJumpTo(next)
                    if (next) {
                      calendarRef.current?.getApi().gotoDate(next)
                    }
                  }}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--admin-fg)]">Event filters</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[var(--admin-primary)]"
                    onClick={() =>
                      setTypeFilter(Object.fromEntries(eventTypes.map((t) => [t, true])))
                    }
                  >
                    View all
                  </button>
                </div>

                {eventTypes.length === 0 ? (
                  <p className="text-sm text-[var(--admin-muted)]">
                    {loading ? 'Loading…' : 'No events found.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {eventTypes.map((t) => (
                      <label
                        key={t}
                        className="flex items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-fg)]"
                      >
                        <AdminCheckbox
                          checked={typeFilter[t] !== false}
                          onChange={(e) =>
                            setTypeFilter((prev) => ({ ...prev, [t]: e.target.checked }))
                          }
                        />
                        <span className="truncate">{t}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </AdminCardBody>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--admin-fg)]">Event calendar</h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                Click an event to open its digest.
              </p>
            </div>
            {loading ? <span className="text-xs text-[var(--admin-muted)]">Loading…</span> : null}
            {error ? <span className="text-xs text-[var(--admin-danger)]">{error}</span> : null}
          </AdminCardHeader>
          <AdminCardBody>
            <div
              className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2"
              style={
                {
                  // FullCalendar CSS variables (v6) to blend with our theme.
                  ['--fc-border-color' as any]: 'var(--admin-border)',
                  ['--fc-page-bg-color' as any]: 'var(--admin-surface)',
                  ['--fc-neutral-bg-color' as any]: 'var(--admin-surface-2)',
                  ['--fc-today-bg-color' as any]: 'rgba(115, 103, 240, 0.10)',
                  ['--fc-button-bg-color' as any]: 'var(--admin-primary)',
                  ['--fc-button-border-color' as any]: 'var(--admin-primary)',
                  ['--fc-button-hover-bg-color' as any]: 'var(--admin-primary-600)',
                  ['--fc-button-hover-border-color' as any]: 'var(--admin-primary-600)',
                  ['--fc-button-active-bg-color' as any]: 'var(--admin-primary-600)',
                  ['--fc-button-active-border-color' as any]: 'var(--admin-primary-600)',
                } as React.CSSProperties
              }
            >
              <FullCalendar
                ref={(r) => {
                  calendarRef.current = r
                }}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
                }}
                height="auto"
                nowIndicator
                navLinks
                dayMaxEvents
                events={calendarEvents}
                eventClick={(info) => {
                  info.jsEvent.preventDefault()
                  const id = info.event.id
                  if (id) router.push(`/event-portal/manage/events/${id}`)
                }}
              />
            </div>
          </AdminCardBody>
        </AdminCard>
      </div>
    </div>
  )
}

