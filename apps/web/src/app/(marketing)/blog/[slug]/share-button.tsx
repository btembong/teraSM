'use client'

import { Share2, Check } from 'lucide-react'
import { useState } from 'react'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
    >
      {copied ? (
        <><Check className="w-4 h-4 text-green-500" /> <span className="text-green-600">Copied!</span></>
      ) : (
        <><Share2 className="w-4 h-4" /> Share</>
      )}
    </button>
  )
}
