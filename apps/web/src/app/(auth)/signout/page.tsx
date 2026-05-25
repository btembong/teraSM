'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function SignOutPage() {
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <LogOut className="w-7 h-7 text-blue-600" />
          </div>

          {/* Wordmark */}
          <p className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-4">Tera SM</p>

          <h1 className="text-xl font-bold text-gray-900">Sign out?</h1>
          <p className="text-sm text-gray-400 mt-1.5 mb-8">
            You'll need to log back in to access your dashboard.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {loading ? 'Signing out…' : 'Yes, sign me out'}
            </button>

            <Link
              href="/admin"
              className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              Cancel — go back
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Tera SM · All rights reserved
        </p>
      </div>
    </div>
  )
}
