'use client'

import { useEffect, useState } from 'react'
import { X, PlayCircle } from 'lucide-react'

interface OnboardingVideoProps {
  videoSrc: string
  title: string
  subtitle: string
  storageKey: string
}

export function OnboardingVideo({ videoSrc, title, subtitle, storageKey }: OnboardingVideoProps) {
  const [show, setShow] = useState(false)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(storageKey)) return
    const t = setTimeout(() => {
      setShow(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true))
      })
    }, 900)
    return () => clearTimeout(t)
  }, [storageKey])

  const dismiss = () => {
    localStorage.setItem(storageKey, 'seen')
    setAnimate(false)
    setTimeout(() => setShow(false), 400)
  }

  if (!show) return null

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-500 ease-out ${
        animate ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <PlayCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{title}</p>
            <p className="text-xs text-gray-400 leading-tight mt-0.5">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Close"
          className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 ml-2 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Video area */}
      <div className="px-4 pb-4">
        {videoSrc ? (
          <video
            src={videoSrc}
            controls
            className="w-full rounded-xl bg-slate-900 object-cover"
            style={{ maxHeight: 176 }}
          />
        ) : (
          <div
            className="w-full rounded-xl bg-slate-900 flex flex-col items-center justify-center gap-2"
            style={{ height: 162 }}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Intro video coming soon</p>
          </div>
        )}

        <button
          onClick={dismiss}
          className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1 rounded-lg hover:bg-gray-50"
        >
          Don&apos;t show this again
        </button>
      </div>
    </div>
  )
}
