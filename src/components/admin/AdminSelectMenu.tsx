'use client'

import { Fragment, useMemo, useRef, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import clsx from 'clsx'

import { IconCheck, IconChevronDown } from './icons'

export type AdminSelectOption<T extends string = string> = {
  value: T
  label: string
  disabled?: boolean
}

export function AdminSelectMenu<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  searchable = true,
  searchPlaceholder = 'Search…',
  disabled = false,
  className,
}: {
  value: T | null | undefined
  onChange: (value: T) => void
  options: AdminSelectOption<T>[]
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
}) {
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement | null>(null)

  const selected = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  return (
    <Listbox
      value={selected?.value ?? null}
      onChange={(nextValue) => {
        setQuery('')
        onChange(nextValue as T)
      }}
      disabled={disabled}
    >
      {({ open }) => (
        <div className={clsx('relative', className)}>
          <Listbox.Button
            className={clsx(
              'flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-2.5 text-left text-sm text-[var(--admin-fg)] shadow-sm outline-none transition',
              'focus:border-[var(--admin-primary)] focus:ring-4 focus:ring-[var(--admin-ring)]',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          >
            <span className={clsx('truncate', !selected && 'text-[var(--admin-muted)]')}>
              {selected ? selected.label : placeholder}
            </span>
            <IconChevronDown
              className={clsx(
                'h-5 w-5 shrink-0 text-[var(--admin-muted)] transition',
                open && 'rotate-180'
              )}
            />
          </Listbox.Button>

          <Transition
            as={Fragment}
            show={open}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
            beforeEnter={() => {
              // keep query if user opened+closed quickly; only focus
              window.setTimeout(() => searchRef.current?.focus(), 0)
            }}
            afterLeave={() => setQuery('')}
          >
            <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-xl">
              {searchable ? (
                <div className="border-b border-[var(--admin-border)] p-2">
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      // Prevent Listbox typeahead from stealing keystrokes.
                      if (e.key !== 'Escape') e.stopPropagation()
                    }}
                    placeholder={searchPlaceholder}
                    className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-fg)] outline-none placeholder:text-[var(--admin-muted)] focus:border-[var(--admin-primary)] focus:ring-4 focus:ring-[var(--admin-ring)]"
                  />
                </div>
              ) : null}

              <Listbox.Options className="max-h-64 overflow-y-auto p-2 focus:outline-none">
                {filtered.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-[var(--admin-muted)]">No results.</div>
                ) : (
                  filtered.map((o) => (
                    <Listbox.Option key={o.value} value={o.value} disabled={o.disabled}>
                      {({ active, selected: isSelected, disabled: isDisabled }) => (
                        <div
                          className={clsx(
                            'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm',
                            active && !isDisabled && 'bg-[var(--admin-surface-2)]',
                            isDisabled && 'cursor-not-allowed opacity-50'
                          )}
                        >
                          <span className={clsx('truncate', isSelected && 'font-semibold')}>
                            {o.label}
                          </span>
                          {isSelected ? (
                            <IconCheck className="h-5 w-5 shrink-0 text-[var(--admin-primary)]" />
                          ) : null}
                        </div>
                      )}
                    </Listbox.Option>
                  ))
                )}
              </Listbox.Options>
            </div>
          </Transition>
        </div>
      )}
    </Listbox>
  )
}

