'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X, ChevronDown, ChevronUp } from 'lucide-react'

const STORAGE_KEY = 'tera_cookie_consent'

type ConsentState = 'accepted' | 'declined' | 'custom' | null

interface Prefs {
  necessary: true
  analytics: boolean
  marketing: boolean
}

export function CookieBanner() {
  const [state, setState]       = useState<ConsentState>(null)
  const [showDetail, setDetail] = useState(false)
  const [prefs, setPrefs]       = useState<Prefs>({ necessary: true, analytics: true, marketing: false })
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setState(JSON.parse(saved).state)
  }, [])

  function save(s: ConsentState, p?: Prefs) {
    const data = { state: s, prefs: p ?? prefs, ts: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setState(s)
  }

  function acceptAll() {
    save('accepted', { necessary: true, analytics: true, marketing: true })
  }

  function declineAll() {
    save('declined', { necessary: true, analytics: false, marketing: false })
  }

  function saveCustom() {
    save('custom', prefs)
  }

  // Don't render until mounted (prevents SSR mismatch) or if already decided
  if (!mounted || state !== null) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 md:bottom-4 md:left-4 md:right-auto md:max-w-sm"
    >
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cookie className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Cookie preferences</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              We use cookies to improve your experience and analyse site traffic.{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
              {' · '}
              <Link href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link>
            </p>
          </div>
        </div>

        {/* Customise toggle */}
        {showDetail && (
          <div className="px-5 py-4 space-y-3 border-b border-gray-100 dark:border-gray-800">
            {/* Necessary — always on */}
            <label className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Necessary</p>
                <p className="text-xs text-gray-400">Authentication, security, preferences. Always on.</p>
              </div>
              <div className="w-9 h-5 rounded-full bg-blue-600 relative flex-shrink-0 cursor-not-allowed opacity-70">
                <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
              </div>
            </label>

            {/* Analytics */}
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Analytics</p>
                <p className="text-xs text-gray-400">Helps us understand how visitors use the site.</p>
              </div>
              <button
                role="switch"
                aria-checked={prefs.analytics}
                onClick={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
                className={`w-9 h-5 rounded-full relative flex-shrink-0 transition-colors ${prefs.analytics ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${prefs.analytics ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </label>

            {/* Marketing */}
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Marketing</p>
                <p className="text-xs text-gray-400">Used to show you relevant ads and measure campaigns.</p>
              </div>
              <button
                role="switch"
                aria-checked={prefs.marketing}
                onClick={() => setPrefs(p => ({ ...p, marketing: !p.marketing }))}
                className={`w-9 h-5 rounded-full relative flex-shrink-0 transition-colors ${prefs.marketing ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${prefs.marketing ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-4 space-y-2">
          {showDetail ? (
            <>
              <button
                onClick={saveCustom}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Save my preferences
              </button>
              <button
                onClick={() => setDetail(false)}
                className="w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" /> Hide options
              </button>
            </>
          ) : (
            <>
              <button
                onClick={acceptAll}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Accept all cookies
              </button>
              <div className="flex gap-2">
                <button
                  onClick={declineAll}
                  className="flex-1 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => setDetail(true)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Customise <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
