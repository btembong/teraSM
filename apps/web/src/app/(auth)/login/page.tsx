'use client'

import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Search, Building2, MapPin, ChevronRight, ArrowRight,
  Loader2, X, Check, Globe, Mail, Lock, Eye, EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type School = {
  id: string
  name: string
  slug: string
  country: string
  logoUrl: string | null
  plan: string
}

export default function LoginPage() {
  const router = useRouter()
  const [query,      setQuery]      = useState('')
  const [results,    setResults]    = useState<School[]>([])
  const [searching,  setSearching]  = useState(false)
  const [selected,   setSelected]   = useState<School | null>(null)
  const [showDrop,   setShowDrop]   = useState(false)
  const [directSlug, setDirectSlug] = useState('')

  // Direct login form
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [loggingIn,  setLoggingIn]  = useState(false)
  const [loginError, setLoginError] = useState('')

  // 2FA OTP step
  const [otpStep,    setOtpStep]    = useState(false)
  const [otp,        setOtp]        = useState('')

  const searchRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDrop(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (val: string) => {
    setQuery(val)
    setSelected(null)
    if (!val.trim()) { setResults([]); setShowDrop(false); return }
    setSearching(true)
    setShowDrop(true)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/auth/schools?q=${encodeURIComponent(val)}`)
        const data = await res.json()
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 280)
  }

  const selectSchool = (school: School) => {
    setSelected(school)
    setQuery(school.name)
    setShowDrop(false)
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setSelected(null)
    setShowDrop(false)
    inputRef.current?.focus()
  }

  const goToSchool = (subdomain: string) => {
    window.location.href = `https://${subdomain}.terasms.com/login`
  }

  const handleDirectGo = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && directSlug.trim()) goToSchool(directSlug.trim())
  }

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoggingIn(true)

    if (otpStep) {
      // Step 2: verify OTP via NextAuth credentials
      const res = await signIn('credentials', { email, otp, redirect: false })
      setLoggingIn(false)
      if (res?.error) {
        setLoginError('Invalid or expired code. Please try again.')
      } else {
        router.push('/dashboard')
      }
      return
    }

    // Step 1: check password + whether 2FA is needed
    try {
      const check = await fetch('/api/auth/check-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await check.json()

      if (data.requires2fa) {
        setLoggingIn(false)
        setOtpStep(true)
        setOtp('')
        return
      }
    } catch {
      setLoggingIn(false)
      setLoginError('Something went wrong. Please try again.')
      return
    }

    // No 2FA — sign in normally
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoggingIn(false)
    if (res?.error) {
      setLoginError('Invalid email or password.')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">Tera SM</span>
        </Link>
        <Link href="/register" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
          Register your school &rarr;
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-500 text-sm">Find your school to sign in</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

            {/* Search input with dropdown */}
            <div ref={searchRef} className="relative">
              <div className={cn(
                'flex items-center border rounded-xl transition-all',
                showDrop ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-gray-200',
              )}>
                <Search className="w-4 h-4 text-gray-400 ml-3.5 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search school name, city or country..."
                  value={query}
                  onChange={e => handleSearch(e.target.value)}
                  onFocus={() => { if (results.length > 0) setShowDrop(true) }}
                  className="flex-1 h-12 px-3 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                  autoFocus
                />
                {query && (
                  <button onClick={clearSearch} className="mr-3 text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showDrop && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    {searching && (
                      <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                      </div>
                    )}
                    {!searching && results.length === 0 && (
                      <div className="px-4 py-4 text-sm text-gray-400 text-center">
                        No schools found for &ldquo;{query}&rdquo;
                      </div>
                    )}
                    {!searching && results.map((school, i) => (
                      <motion.button
                        key={school.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => selectSchool(school)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0"
                      >
                        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{school.name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {school.country}
                            <span className="mx-1 text-gray-300">·</span>
                            {school.slug}.terasms.com
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected school pill */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3.5 border-2 border-blue-500 bg-blue-50 rounded-xl">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{selected.name}</p>
                      <p className="text-xs text-blue-500 font-mono">{selected.slug}.terasms.com</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <button onClick={clearSearch} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Primary CTA */}
            <button
              onClick={() => selected && goToSchool(selected.slug)}
              disabled={!selected}
              className={cn(
                'w-full h-12 flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all',
                selected
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed',
              )}
            >
              {selected
                ? <><span>Go to {selected.name}</span><ArrowRight className="w-4 h-4" /></>
                : 'Search and select your school to continue'
              }
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or enter URL directly</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Direct URL entry */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Know your school&apos;s URL?</p>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all bg-white">
                <Globe className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="schoolname"
                  value={directSlug}
                  onChange={e => setDirectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  onKeyDown={handleDirectGo}
                  className="flex-1 h-11 px-2.5 text-sm outline-none bg-transparent"
                />
                <span className="text-sm text-gray-400 font-medium">.terasms.com</span>
                <button
                  onClick={() => directSlug && goToSchool(directSlug)}
                  disabled={!directSlug}
                  className="m-1.5 h-8 px-3.5 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
                >
                  Go
                </button>
              </div>
            </div>
          </div>

          {/* Direct login — only shown until subdomain routing is live */}
          {process.env.NEXT_PUBLIC_SUBDOMAIN_LIVE !== 'true' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium px-1">
                  {otpStep ? 'Two-factor verification' : 'Sign in directly'}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <form onSubmit={handleDirectLogin} className="space-y-3">
                {!otpStep ? (
                  <>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full h-12 pl-10 pr-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="w-full h-12 pl-10 pr-11 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(p => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 text-center">
                      A 6-digit code was sent to <strong className="text-gray-900">{email}</strong>.
                      <br />Enter it below — valid for 10 minutes.
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onPaste={e => {
                        e.preventDefault()
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                        setOtp(pasted)
                      }}
                      required
                      autoFocus
                      className="w-full h-14 text-center text-2xl font-mono tracking-[0.4em] border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => { setOtpStep(false); setOtp(''); setLoginError('') }}
                      className="text-xs text-gray-400 hover:text-gray-600 w-full text-center"
                    >
                      ← Back to sign in
                    </button>
                  </div>
                )}

                {loginError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loggingIn || (otpStep && otp.length !== 6)}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 text-white rounded-xl font-semibold text-sm transition-all"
                >
                  {loggingIn
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : otpStep ? 'Verify Code' : 'Sign in'
                  }
                </button>
              </form>
            </div>
          )}

          <p className="text-center text-sm text-gray-500">
            New school?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-semibold">
              Register for free
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
