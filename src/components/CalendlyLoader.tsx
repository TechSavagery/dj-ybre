'use client'

import { useEffect } from 'react'

export function CalendlyLoader() {
  useEffect(() => {
    // Load Calendly CSS
    const link = document.createElement('link')
    link.href = 'https://assets.calendly.com/assets/external/widget.css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    return () => {
      // Cleanup on unmount
      document.head.removeChild(link)
    }
  }, [])

  return null
}

