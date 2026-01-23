'use client'

import Image from 'next/image'

type Props = {
  src: string
  alt: string
  href?: string | null
  spotifyUri?: string | null
  size: number
  mode?: 'anchor' | 'popup'
  className?: string
  imageClassName?: string
}

export function SpotifyPlayOverlayImage({
  src,
  alt,
  href,
  spotifyUri,
  size,
  mode = 'anchor',
  className = '',
  imageClassName = '',
}: Props) {
  const target = spotifyUri || href

  const overlay = (
    <>
      <span className="absolute inset-0 bg-neutral-950/0 transition group-hover:bg-neutral-950/35" />
      <span className="relative grid place-items-center rounded-full bg-white/70 p-2 text-neutral-950 opacity-85 shadow-sm transition group-hover:opacity-100">
        <svg
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M6.5 5.5a1 1 0 011.53-.848l7 4.5a1 1 0 010 1.696l-7 4.5A1 1 0 016.5 14.5v-9z" />
        </svg>
      </span>
    </>
  )

  return (
    <div
      className={[
        'relative overflow-hidden rounded',
        className,
      ].join(' ')}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={['h-full w-full object-cover', imageClassName].join(' ')}
        unoptimized
      />

      {target ? (
        mode === 'anchor' ? (
          <a
            href={target}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in Spotify"
            title="Open in Spotify"
            className="group absolute inset-0 grid place-items-center"
          >
            {overlay}
          </a>
        ) : (
          <span
            role="link"
            tabIndex={0}
            aria-label="Open in Spotify"
            title="Open in Spotify"
            className="group absolute inset-0 grid cursor-pointer place-items-center"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.open(target, '_blank', 'noopener,noreferrer')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                window.open(target, '_blank', 'noopener,noreferrer')
              }
            }}
          >
            {overlay}
          </span>
        )
      ) : null}
    </div>
  )
}

