'use client'

import { useEffect } from 'react'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="inline-flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="text-slate-500 font-semibold text-sm">Tera SM</span>
        </div>

        {/* 500 display */}
        <div className="relative mb-6 inline-block">
          <p className="text-[120px] font-black text-gray-100 leading-none select-none">500</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-red-100 shadow-sm flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-red-400" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-2">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p className="text-[11px] text-gray-300 font-mono mb-8">Error ID: {error.digest}</p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
