'use client'

import clsx from 'clsx'

type StylizedVideoProps = {
  src: string
  className?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  playsInline?: boolean
}

export function StylizedVideo({
  className,
  src,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  ...props
}: StylizedVideoProps) {
  return (
    <div
      className={clsx(
        className,
        'relative flex aspect-[9/16] w-full max-w-full overflow-hidden',
      )}
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      <video
        src={src}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        preload="auto"
        className="w-full h-full bg-neutral-100 object-contain rounded-2xl"
        style={{ 
          WebkitPlaysinline: playsInline ? 'true' : undefined,
          borderRadius: '1rem',
          WebkitBorderRadius: '1rem',
        } as React.CSSProperties}
        {...props}
      />
    </div>
  )
}

