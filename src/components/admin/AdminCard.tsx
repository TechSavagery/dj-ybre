'use client'

import clsx from 'clsx'

export function AdminCard({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-sm',
        className
      )}
      {...props}
    />
  )
}

export function AdminCardHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={clsx('border-b border-[var(--admin-border)] px-6 py-5', className)}
      {...props}
    />
  )
}

export function AdminCardBody({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={clsx('px-6 py-6', className)} {...props} />
}

