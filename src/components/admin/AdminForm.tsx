'use client'

import clsx from 'clsx'

export function AdminLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'label'>) {
  return (
    <label
      className={clsx('text-sm font-semibold text-[var(--admin-fg)]', className)}
      {...props}
    />
  )
}

export function AdminHelp({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'p'>) {
  return (
    <p className={clsx('text-xs text-[var(--admin-muted)]', className)} {...props} />
  )
}

const controlBase =
  'w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-2.5 text-sm text-[var(--admin-fg)] shadow-sm outline-none transition placeholder:text-[color:var(--admin-muted)] focus:border-[var(--admin-primary)] focus:ring-4 focus:ring-[var(--admin-ring)]'

export function AdminInput({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'input'>) {
  return <input className={clsx(controlBase, className)} {...props} />
}

export function AdminSelect({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'select'>) {
  return <select className={clsx(controlBase, className)} {...props} />
}

export function AdminTextarea({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'textarea'>) {
  return <textarea className={clsx(controlBase, 'py-3', className)} {...props} />
}

export function AdminCheckbox({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'input'>) {
  return (
    <input
      type="checkbox"
      className={clsx(
        'h-4 w-4 rounded border-[var(--admin-border)] text-[var(--admin-primary)] focus:ring-[var(--admin-ring)]',
        className
      )}
      {...props}
    />
  )
}

