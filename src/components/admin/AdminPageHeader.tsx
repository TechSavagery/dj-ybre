'use client'

import clsx from 'clsx'

export function AdminPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={clsx('mb-6 flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight text-[var(--admin-fg)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-[var(--admin-muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

