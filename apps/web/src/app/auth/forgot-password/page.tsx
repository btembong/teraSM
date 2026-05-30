'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Loader2, GraduationCap } from 'lucide-react'
import Link from 'next/link'

type SchoolBrand = { name: string; logoUrl: string | null; slug: string }

function getSlugFromHostname(): string | null {
  if (typeof window === 'undefined') return null
  const host = window.location.hostname
  // school.terasms.com → "school"; localhost → null
  const rootDomains = ['terasms.com', 'localhost', 'vercel.app']
  const isRoot = rootDomains.some(d => host === d || host.startsWith(`www.${d}`))
  if (isRoot) return null
  return host.split('.')[0] ?? null
}

export default function ForgotPasswordPage() {
  const [school, setSchool]   = useState<SchoolBrand | null>(null)
  const [slug, setSlug]       = useState<string | null>(null)
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    const s = getSlugFromHostname()
    setSlug(s)
    if (!s) return
    fetch(`/api/public/tenant?slug=${s}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSchool(data) })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, slug }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message ?? 'Something went wrong.'); return }
      setSent(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Branding ─────────────────────────────────────────────────────────────
  const brandName = school?.name ?? (slug ? '' : 'Tera SM')
  const showTeraBrand = !slug // only show Tera SM if on root domain

  const Logo = () => {
    if (school?.logoUrl) {
      return (
        <img
          src={school.logoUrl}
          alt={school.name}
          className="h-10 w-auto object-contain"
        />
      )
    }
    if (school) {
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">{school.name.charAt(0)}</span>
        </div>
      )
    }
    if (showTeraBrand) {
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">T</span>
        </div>
      )
    }
    // Subdomain detected but school not loaded yet — placeholder
    return (
      <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
        <GraduationCap className="w-5 h-5 text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8">

        {/* Brand header */}
        <div className="flex items-center gap-3 mb-8">
          <Logo />
          <div>
            <span className="font-bold text-gray-900 text-base leading-tight block">
              {brandName}
            </span>
            {school && (
              <span className="text-xs text-gray-400">Student Portal</span>
            )}
          </div>
        </div>

        {sent ? (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-500 text-sm mb-6">
              If <strong>{email}</strong> is registered
              {school ? ` at ${school.name}` : ''}, we&apos;ve sent a password reset
              link. It expires in 60 minutes.
            </p>
            <Link href="/login" className="text-blue-600 text-sm hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h1>
            <p className="text-gray-500 text-sm mb-6">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@school.edu"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              <Link href="/login" className="text-blue-600 hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
