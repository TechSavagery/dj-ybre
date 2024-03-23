'use client'
import React from 'react'
import { InlineWidget } from 'react-calendly'
import BlankLayout from '../consult/layout'

export default function CalendlyConsult() {
  return (
    <main>
      <div className="App">
        <InlineWidget
          styles={{
            height: '1000px',
          }}
          url="https://calendly.com/dj-ybre/consult"
        />
      </div>
    </main>
  )
}

CalendlyConsult.getLayout = function getLayout(
  page:
    | string
    | number
    | boolean
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | Iterable<React.ReactNode>
    | React.ReactPortal
    | React.PromiseLikeOfReactNode
    | null
    | undefined,
) {
  return <BlankLayout>{page}</BlankLayout>
}
