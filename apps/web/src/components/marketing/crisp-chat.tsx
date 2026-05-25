'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    $crisp: unknown[]
    CRISP_WEBSITE_ID: string
  }
}

export function CrispChat() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID
    if (!id) return

    window.$crisp = []
    window.CRISP_WEBSITE_ID = id

    const script = document.createElement('script')
    script.src = 'https://client.crisp.chat/l.js'
    script.async = true
    document.head.appendChild(script)

    return () => {
      try { document.head.removeChild(script) } catch {}
    }
  }, [])

  return null
}
