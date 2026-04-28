'use client'

import Link from 'next/link'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

type AdminButtonProps = {
  variant?: Variant
  size?: 'sm' | 'md'
} & (
  | React.ComponentPropsWithoutRef<typeof Link>
  | (React.ComponentPropsWithoutRef<'button'> & { href?: undefined })
)

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--admin-ring)] disabled:cursor-not-allowed disabled:opacity-60'

function variantClasses(variant: Variant) {
  switch (variant) {
    case 'secondary':
      return 'border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-fg)] hover:bg-[var(--admin-surface-2)]'
    case 'ghost':
      return 'bg-transparent text-[var(--admin-fg)] hover:bg-black/5'
    case 'danger':
      return 'bg-[var(--admin-danger)] text-white hover:brightness-95'
    case 'primary':
    default:
      return 'bg-[var(--admin-primary)] text-white hover:bg-[var(--admin-primary-600)]'
  }
}

function sizeClasses(size: NonNullable<AdminButtonProps['size']>) {
  switch (size) {
    case 'sm':
      return 'px-3 py-2 text-sm'
    case 'md':
    default:
      return 'px-4 py-2.5 text-sm'
  }
}

export function AdminButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: AdminButtonProps) {
  const isDisabled = 'disabled' in props && props.disabled

  const classes = clsx(
    base,
    variantClasses(variant),
    sizeClasses(size),
    isDisabled && variant === 'primary' && 'hover:bg-[var(--admin-primary)]',
    className
  )

  if (typeof props.href === 'undefined') {
    return (
      <button className={classes} {...props}>
        {children}
      </button>
    )
  }

  return (
    <Link className={classes} {...props}>
      {children}
    </Link>
  )
}

