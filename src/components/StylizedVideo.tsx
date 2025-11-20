'use client'

import { useId } from 'react'
import clsx from 'clsx'

const shapes = [
  {
    width: 540,
    height: 960,
    // iPhone portrait 9:16 aspect ratio - Simplified rounded rectangle
    path: 'M30 0h480c16.569 0 30 13.431 30 30v900c0 16.569-13.431 30-30 30H30c-16.569 0-30-13.431-30-30V30C0 13.431 13.431 0 30 0z',
  },
  {
    width: 540,
    height: 960,
    // Rounded rectangle with more rounded corners
    path: 'M40 0h460c22.091 0 40 17.909 40 40v880c0 22.091-17.909 40-40 40H40c-22.091 0-40-17.909-40-40V40C0 17.909 17.909 0 40 0z',
  },
  {
    width: 540,
    height: 960,
    // Even more open shape - almost full rectangle with slight rounding
    path: 'M15 0h510c8.284 0 15 6.716 15 15v930c0 8.284-6.716 15-15 15H15c-8.284 0-15-6.716-15-15V15C0 6.716 6.716 0 15 0z',
  },
]

type StylizedVideoProps = {
  src: string
  shape?: 0 | 1 | 2
  className?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  playsInline?: boolean
}

export function StylizedVideo({
  shape = 0,
  className,
  src,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  ...props
}: StylizedVideoProps) {
  let id = useId()
  let { width, height, path } = shapes[shape]

  return (
    <div
      className={clsx(
        className,
        'relative flex aspect-[9/16] w-full max-w-full',
      )}
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} fill="none" className="h-full">
        <g clipPath={`url(#${id}-clip)`} className="group">
          <g className="origin-center scale-100 transition duration-500 motion-safe:group-hover:scale-105">
            <foreignObject width={width} height={height}>
              <video
                src={src}
                autoPlay={autoPlay}
                loop={loop}
                muted={muted}
                playsInline={playsInline}
                preload="auto"
                className="w-full h-full bg-neutral-100 object-contain"
                style={{ 
                  aspectRatio: `${width} / ${height}`,
                  WebkitPlaysinline: playsInline ? 'true' : undefined,
                } as React.CSSProperties}
                {...props}
              />
            </foreignObject>
          </g>
          <use
            href={`#${id}-shape`}
            strokeWidth="2"
            className="stroke-neutral-950/10"
          />
        </g>
        <defs>
          <clipPath id={`${id}-clip`}>
            <path
              id={`${id}-shape`}
              d={path}
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </clipPath>
        </defs>
      </svg>
    </div>
  )
}

