'use client'

import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Search, MapPin, ChevronRight, ArrowRight,
  Loader2, X, Check, AlertCircle, Lock, Mail, Globe, SearchX,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FloatingInput } from '@/components/ui/floating-input'

// ─── Types ────────────────────────────────────────────────────────────────────

type School = {
  id: string; name: string; slug: string
  country: string; logoUrl: string | null; plan: string
}

// ─── Portal mockup data ───────────────────────────────────────────────────────

const PORTAL_DATA = {
  Student: {
    greeting: 'Amara Mensah',
    role: 'Year 3 · Computer Science',
    stats: [
      { label: 'Courses', value: '6',   color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
      { label: 'GPA',     value: '3.7', color: '#34d399', bg: 'rgba(52,211,153,0.10)' },
      { label: 'Balance', value: '$0',  color: '#60a5fa', bg: 'rgba(96,165,250,0.10)' },
    ],
    items: [
      { dot: '#6366f1', title: 'CS 301 — Live Class',       sub: 'Today 10:00 AM' },
      { dot: '#34d399', title: 'Assignment submitted',       sub: 'Data Structures · 2h ago' },
      { dot: '#f59e0b', title: 'Fee reminder',               sub: 'Semester 2 · Due in 3 days' },
    ],
  },
  Teacher: {
    greeting: 'Dr. Okonkwo',
    role: 'Lecturer · Computer Science',
    stats: [
      { label: 'Students', value: '84', color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
      { label: 'Courses',  value: '3',  color: '#34d399', bg: 'rgba(52,211,153,0.10)' },
      { label: 'Pending',  value: '12', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
    ],
    items: [
      { dot: '#6366f1', title: 'Grade submissions due',      sub: 'CS 201 · Today' },
      { dot: '#34d399', title: 'Class recorded',             sub: 'CS 301 · 10:00 AM' },
      { dot: '#60a5fa', title: 'Meeting — Academic Board',   sub: 'Tomorrow 2:00 PM' },
    ],
  },
  Admin: {
    greeting: 'Greenfield College',
    role: 'Admin Dashboard',
    stats: [
      { label: 'Students', value: '1,247', color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
      { label: 'Revenue',  value: '₦4.2M', color: '#34d399', bg: 'rgba(52,211,153,0.10)' },
      { label: 'Attend.',  value: '94%',   color: '#60a5fa', bg: 'rgba(96,165,250,0.10)' },
    ],
    items: [
      { dot: '#818cf8', title: 'Adaeze Obi registered',      sub: '2 min ago' },
      { dot: '#34d399', title: '₦45,000 payment received',   sub: '8 min ago' },
      { dot: '#60a5fa', title: 'Transcript requested',        sub: '23 min ago' },
    ],
  },
  Parent: {
    greeting: 'Mrs. Mensah',
    role: 'Parent · Amara Mensah',
    stats: [
      { label: 'GPA',     value: '3.7', color: '#34d399', bg: 'rgba(52,211,153,0.10)' },
      { label: 'Attend.', value: '96%', color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
      { label: 'Balance', value: '$0',  color: '#60a5fa', bg: 'rgba(96,165,250,0.10)' },
    ],
    items: [
      { dot: '#34d399', title: 'Semester results published', sub: 'Amara · GPA 3.7' },
      { dot: '#6366f1', title: 'Message from Dr. Okonkwo',  sub: '1 hour ago' },
      { dot: '#f59e0b', title: 'Fee payment confirmed',      sub: '₦120,000 · 2 days ago' },
    ],
  },
} as const

type PortalKey = keyof typeof PORTAL_DATA
const PORTAL_TABS: PortalKey[] = ['Student', 'Teacher', 'Admin', 'Parent']

// ─── Portal mockup (login panel) ─────────────────────────────────────────────

function DashboardPreview() {
  const [active, setActive] = useState<PortalKey>('Admin')
  const data = PORTAL_DATA[active]

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.18, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Tab strip */}
      <div
        className="flex items-center gap-0.5 px-3 pt-3 pb-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {PORTAL_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className="relative px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors"
            style={{ color: active === tab ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.28)' }}
          >
            {active === tab && (
              <motion.div
                layoutId="portal-tab-bg"
                className="absolute inset-0 rounded-md"
                style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.25)' }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span style={{ fontSize: 9, color: 'rgba(52,211,153,0.6)' }}>Live</span>
        </div>
      </div>

      {/* Portal content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="px-4 pt-3 pb-4"
        >
          {/* Greeting */}
          <div className="mb-3">
            <p className="font-semibold" style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)' }}>
              {data.greeting}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>
              {data.role}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {data.stats.map(s => (
              <div
                key={s.label}
                className="rounded-lg px-2.5 py-2"
                style={{ background: s.bg, border: `1px solid ${s.color}22` }}
              >
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{s.label}</p>
                <p className="font-bold" style={{ fontSize: 14, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Activity items */}
          <div className="space-y-1.5">
            {data.items.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.22 }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.025)' }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: item.dot }}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', marginTop: 1 }}>
                    {item.sub}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Branding panel ───────────────────────────────────────────────────────────

function BrandingPanel() {
  return (
    <div
      className="hidden lg:flex w-[460px] flex-shrink-0 flex-col p-10 relative overflow-hidden"
      style={{ background: '#06060f' }}
    >

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          top: -120, left: -80,
          width: 520, height: 520,
          background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 65%)',
          filter: 'blur(72px)',
        }}
        animate={{ x: [0, 180, 80, 200, 0], y: [0, 100, 260, 140, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          bottom: -80, right: -60,
          width: 440, height: 440,
          background: 'radial-gradient(circle, rgba(139,92,246,0.30) 0%, transparent 65%)',
          filter: 'blur(64px)',
        }}
        animate={{ x: [0, -160, -60, -180, 0], y: [0, -120, -240, -100, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          top: '35%', left: '30%',
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 65%)',
          filter: 'blur(56px)',
        }}
        animate={{ x: [0, 80, -60, 40, 0], y: [0, -80, 60, -40, 0], scale: [1, 1.2, 0.9, 1.1, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Logo */}
      <div className="relative z-10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: '#6366f1', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}
          >
            <span className="text-white font-black" style={{ fontSize: 15 }}>T</span>
          </div>
          <span className="font-semibold tracking-tight" style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)' }}>
            Tera SM
          </span>
        </div>
        <span
          className="font-semibold uppercase tracking-[0.18em] rounded-full px-2 py-0.5"
          style={{ fontSize: 9, color: 'rgba(129,140,248,0.4)', border: '1px solid rgba(129,140,248,0.15)' }}
        >
          v2.0
        </span>
      </div>

      {/* Headline */}
      <div className="relative z-10 mt-8 flex-shrink-0">
        <p className="font-bold tracking-tight leading-[1.2]" style={{ fontSize: 22, color: 'rgba(255,255,255,0.82)' }}>
          The complete OS<br />for modern schools.
        </p>
        <p className="mt-2 leading-relaxed" style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
          Academics, finance, HR, and LMS — fully integrated.
        </p>
      </div>

      {/* Dashboard preview */}
      <div className="relative z-10 flex-1 flex flex-col justify-center my-7">
        <DashboardPreview />
      </div>

      {/* Testimonial chip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.45 }}
        className="relative z-10 flex-shrink-0 rounded-xl px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="italic leading-relaxed" style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
          "Our registrar staff are 4× more productive. Transcript generation went from days to seconds."
        </p>
        <div className="flex items-center gap-2 mt-2.5">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #818cf8, #3b82f6)' }}
          >
            <span className="text-white font-bold" style={{ fontSize: 8 }}>FA</span>
          </div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>
            Fatima Al-Hassan · Al-Nour Academy, Kano
          </p>
        </div>
      </motion.div>

      {/* Footer stats */}
      <div className="relative z-10 flex items-center justify-between mt-5 flex-shrink-0">
        <div className="flex items-center gap-4">
          {['500+ schools', '99.9% uptime', '19 modules'].map(s => (
            <span key={s} style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)' }}>{s}</span>
          ))}
        </div>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.12)' }}>© 2026 Tera SM</p>
      </div>
    </div>
  )
}

// ─── Forgot password modal ────────────────────────────────────────────────────

function ForgotPasswordModal({
  open, onClose, defaultEmail, tenantSlug,
}: {
  open: boolean
  onClose: () => void
  defaultEmail: string
  tenantSlug: string | null
}) {
  const [fpEmail,  setFpEmail]  = useState(defaultEmail)
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [fpError,  setFpError]  = useState('')

  // Sync email + reset state each time modal opens
  useEffect(() => {
    if (open) { setFpEmail(defaultEmail); setSuccess(false); setFpError('') }
  }, [open, defaultEmail])

  // ESC to close
  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fpEmail.trim()) return
    setLoading(true); setFpError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail.trim(), slug: tenantSlug }),
      })
      if (res.status === 429) {
        setFpError('Too many attempts. Please wait a few minutes and try again.')
      } else {
        setSuccess(true)
      }
    } catch {
      setFpError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0"
            style={{ background: 'rgba(15,23,42,0.42)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.05)' }}
          >
            {/* Close button */}
            <div className="flex justify-end px-5 pt-5">
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-7 pt-1">
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-center py-2"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: '#eef2ff' }}
                    >
                      <Check className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="font-semibold text-slate-900 tracking-tight" style={{ fontSize: 18 }}>
                      Check your email
                    </h2>
                    <p className="text-slate-400 mt-2 leading-relaxed" style={{ fontSize: 13 }}>
                      We sent a reset link to{' '}
                      <span className="text-slate-700 font-medium">{fpEmail}</span>.
                      {' '}It expires in 60 minutes.
                    </p>
                    <p className="text-slate-300 mt-2" style={{ fontSize: 12 }}>
                      Didn't receive it? Check your spam folder.
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-6 w-full h-11 flex items-center justify-center rounded-lg font-medium transition-colors"
                      style={{ fontSize: 13, background: '#6366f1', color: '#fff' }}
                    >
                      Back to sign in
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="font-bold text-slate-900 tracking-tight" style={{ fontSize: 18 }}>
                        Reset your password
                      </h2>
                      <p className="text-slate-400 mt-1" style={{ fontSize: 13 }}>
                        Enter your email and we'll send a reset link.
                      </p>
                    </div>

                    <FloatingInput
                      label="Email address"
                      type="email"
                      value={fpEmail}
                      onChange={setFpEmail}
                      required
                      autoComplete="email"
                    />

                    {fpError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5"
                        style={{ fontSize: 12 }}
                      >
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {fpError}
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !fpEmail.trim()}
                      className="w-full h-11 flex items-center justify-center gap-2 rounded-lg font-medium transition-colors"
                      style={{
                        fontSize: 13,
                        background: '#6366f1',
                        color: '#fff',
                        opacity: loading || !fpEmail.trim() ? 0.55 : 1,
                      }}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Send reset link</>}
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full text-center text-slate-400 hover:text-slate-700 transition-colors py-1"
                      style={{ fontSize: 12 }}
                    >
                      ← Back to sign in
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Login page ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()

  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<School[]>([])
  const [searching, setSearching] = useState(false)
  const [selected,  setSelected]  = useState<School | null>(null)
  const [showDrop,  setShowDrop]  = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [recentSchools, setRecentSchools] = useState<School[]>([])
  const [suggestedCountry, setSuggestedCountry] = useState<string | null>(null)
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [loggingIn,  setLoggingIn]  = useState(false)
  const [loginError, setLoginError] = useState('')

  const [otpStep, setOtpStep] = useState(false)
  const [otp,     setOtp]     = useState(['', '', '', '', '', ''])

  const [tenantSlug, setTenantSlug] = useState<string | null>(null)

  const searchRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const otpRefs     = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const host = window.location.hostname
    const roots = ['terasms.com', 'localhost', 'vercel.app']
    const isRoot = roots.some(d => host === d || host.startsWith(`www.${d}`))
    if (!isRoot) setTenantSlug(host.split('.')[0] ?? null)
  }, [])

  // Load recent schools from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tera_recent_schools')
      if (stored) setRecentSchools(JSON.parse(stored))
    } catch {}
  }, [])

  // Detect country from browser timezone for suggestions
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const TZ_COUNTRY: Record<string, string> = {
      'Africa/Lagos': 'Nigeria', 'Africa/Accra': 'Ghana', 'Africa/Nairobi': 'Kenya',
      'Africa/Johannesburg': 'South Africa', 'Africa/Cairo': 'Egypt',
      'Africa/Abidjan': "Côte d'Ivoire", 'Africa/Kigali': 'Rwanda',
      'Europe/London': 'United Kingdom', 'America/New_York': 'United States',
      'America/Los_Angeles': 'United States', 'Asia/Kolkata': 'India',
    }
    setSuggestedCountry(TZ_COUNTRY[tz] ?? null)
  }, [])

  // Reset keyboard highlight when results change
  useEffect(() => { setHighlightedIndex(-1) }, [results])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDrop(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleSearch = (val: string) => {
    setQuery(val); setSelected(null)
    if (!val.trim()) { setResults([]); setShowDrop(false); return }
    setSearching(true); setShowDrop(true)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      try { setResults(await fetch(`/api/auth/schools?q=${encodeURIComponent(val)}`).then(r => r.json())) }
      catch { setResults([]) }
      finally { setSearching(false) }
    }, 280)
  }

  const selectSchool = (s: School) => {
    setSelected(s); setQuery(s.name); setShowDrop(false)
    const next = [s, ...recentSchools.filter(r => r.id !== s.id)].slice(0, 3)
    setRecentSchools(next)
    try { localStorage.setItem('tera_recent_schools', JSON.stringify(next)) } catch {}
  }
  const clearSearch  = () => { setQuery(''); setResults([]); setSelected(null); setShowDrop(false); inputRef.current?.focus() }
  const goToSchool   = (slug: string) => { window.location.href = `https://${slug}.terasms.com/login` }

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDrop || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setHighlightedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setHighlightedIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault(); selectSchool(results[highlightedIndex])
    } else if (e.key === 'Escape') {
      setShowDrop(false); setHighlightedIndex(-1)
    }
  }

  const handleOtpChar = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }
  const handleOtpKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoggingIn(true)

    if (otpStep) {
      const code = otp.join('')
      const res = await signIn('credentials', { email, otp: code, slug: tenantSlug ?? '', redirect: false })
      setLoggingIn(false)
      if (res?.error) setLoginError('Invalid or expired code. Please try again.')
      else router.push('/dashboard')
      return
    }

    try {
      const data = await fetch('/api/auth/check-2fa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, slug: tenantSlug }),
      }).then(r => r.json())
      if (data.error) { setLoggingIn(false); setLoginError(data.error); return }
      if (data.requires2fa) { setLoggingIn(false); setOtpStep(true); setOtp(['', '', '', '', '', '']); return }
    } catch {
      setLoggingIn(false); setLoginError('Something went wrong. Please try again.'); return
    }

    const res = await signIn('credentials', { email, password, slug: tenantSlug ?? '', redirect: false })
    setLoggingIn(false)
    if (res?.error) {
      try {
        const params = new URLSearchParams({ email })
        if (tenantSlug) params.set('slug', tenantSlug)
        const ld = await fetch(`/api/auth/lockout-status?${params}`).then(r => r.json())
        if (ld.locked && ld.reason === 'brute_force')
          setLoginError(`Account locked. Try again in ${ld.minutesLeft} minute${ld.minutesLeft !== 1 ? 's' : ''}.`)
        else if (ld.locked && ld.reason === 'suspended')
          setLoginError('Account suspended. Contact your school administrator.')
        else
          setLoginError('Invalid email or password.')
      } catch { setLoginError('Invalid email or password.') }
    } else {
      router.push('/dashboard')
    }
  }

  const otpComplete = !otp.includes('')

  const [urlSlug, setUrlSlug] = useState('')

  const handleGoToUrl = () => {
    if (urlSlug.trim()) goToSchool(urlSlug.trim())
  }

  const [showForgotPw, setShowForgotPw] = useState(false)

  return (
    <div className="min-h-screen flex">
      <ForgotPasswordModal
        open={showForgotPw}
        onClose={() => setShowForgotPw(false)}
        defaultEmail={email}
        tenantSlug={tenantSlug}
      />

      <BrandingPanel />

      {/* ── Right panel ── */}
      <div
        className="flex-1 flex flex-col"
        style={{
          borderLeft: '1px solid #e8e8ed',
          background: '#f5f7fa',
        }}
      >

        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4" style={{ background: '#f5f7fa', borderBottom: '1px solid #e8edf5' }}>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">T</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">Tera SM</span>
          </Link>
          <Link href="/register" className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
            Register
          </Link>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-10 py-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[440px]"
          >

            {/* Heading */}
            <div className="mb-4">
              <div className="lg:hidden w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center mb-5 shadow-md shadow-indigo-600/20">
                <span className="text-white font-black text-base">T</span>
              </div>
              <h1 className="font-bold tracking-tight text-slate-900" style={{ fontSize: 30 }}>
                {otpStep ? 'Verify your identity' : 'Sign in'}
              </h1>
              <p className="text-slate-400 mt-2" style={{ fontSize: 14 }}>
                {otpStep
                  ? `Enter the 6-digit code sent to ${email}`
                  : 'Find your institution below to continue.'}
              </p>
            </div>

            <AnimatePresence mode="wait">

              {/* ── OTP step ── */}
              {otpStep ? (
                <motion.form
                  key="otp"
                  onSubmit={handleLogin}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="flex gap-2 justify-between">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        autoFocus={i === 0}
                        onChange={e => handleOtpChar(i, e.target.value)}
                        onKeyDown={e => handleOtpKey(i, e)}
                        onPaste={i === 0 ? e => {
                          e.preventDefault()
                          const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('')
                          const next = ['', '', '', '', '', '']
                          digits.forEach((ch, j) => { next[j] = ch })
                          setOtp(next)
                          otpRefs.current[Math.min(digits.length, 5)]?.focus()
                        } : undefined}
                        className="w-11 h-14 text-center text-lg font-bold border border-slate-200 rounded-lg outline-none transition-all text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 bg-slate-50 focus:bg-white"
                      />
                    ))}
                  </div>

                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {loginError}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loggingIn || !otpComplete}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg font-medium text-sm transition-all"
                  >
                    {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOtpStep(false); setOtp(['', '', '', '', '', '']); setLoginError('') }}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-700 transition-colors py-1"
                  >
                    ← Back to sign in
                  </button>
                </motion.form>

              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  {/* School search — primary action */}
                  <div className="space-y-3">

                    {/* Recent schools */}
                    <AnimatePresence>
                      {!query && recentSchools.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          className="space-y-1"
                        >
                          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mb-1.5">Recent</p>
                          {recentSchools.map(s => (
                            <button
                              key={s.id}
                              onClick={() => selectSchool(s)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-indigo-50 transition-colors text-left group"
                              style={{ border: '1px solid #e8edf5', background: '#fafbff' }}
                            >
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-white overflow-hidden text-[10px]"
                                style={{ background: s.logoUrl ? '#f8fafc' : 'linear-gradient(135deg, #6366f1, #818cf8)', border: s.logoUrl ? '1px solid #e8edf5' : 'none' }}
                              >
                                {s.logoUrl ? <img src={s.logoUrl} alt={s.name} className="w-full h-full object-contain p-0.5" /> : s.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                              </div>
                              <span className="text-xs font-medium text-slate-700 truncate flex-1">{s.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{s.slug}.terasms.com</span>
                            </button>
                          ))}
                          <div className="h-px bg-slate-100 mt-2" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Search input */}
                    <div ref={searchRef} className="relative">
                      <div className={cn(
                        'flex items-center border-2 rounded-2xl transition-all bg-white',
                        showDrop
                          ? 'border-indigo-400'
                          : 'border-slate-200 hover:border-indigo-300',
                      )}
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                      >
                        {searching
                          ? <Loader2 className="w-4 h-4 text-indigo-400 ml-4 flex-shrink-0 animate-spin" />
                          : <Search className="w-4 h-4 text-slate-400 ml-4 flex-shrink-0" />
                        }
                        <input
                          ref={inputRef}
                          type="text"
                          placeholder="School name, city or country…"
                          value={query}
                          onChange={e => handleSearch(e.target.value)}
                          onFocus={() => { if (results.length > 0) setShowDrop(true) }}
                          onKeyDown={handleSearchKeyDown}
                          className="flex-1 h-14 px-3 text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                          style={{ fontSize: 13 }}
                        />
                        {query ? (
                          <button onClick={clearSearch} className="mr-3 text-slate-300 hover:text-slate-500 flex-shrink-0 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="mr-3 text-slate-300 select-none flex-shrink-0" style={{ fontSize: 10 }}>↵</span>
                        )}
                      </div>

                      {/* Idle hint / searching state */}
                      <AnimatePresence mode="wait">
                        {searching ? (
                          <motion.p key="searching"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-indigo-400 mt-2 pl-1 flex items-center gap-1.5" style={{ fontSize: 11 }}
                          >
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Searching institutions…
                          </motion.p>
                        ) : !query && !showDrop ? (
                          <motion.p key="hint"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-slate-400 mt-2 pl-1" style={{ fontSize: 11 }}
                          >
                            {suggestedCountry
                              ? `Showing schools in ${suggestedCountry} — type to search globally`
                              : 'Start typing to find your institution'}
                          </motion.p>
                        ) : null}
                      </AnimatePresence>

                      {/* Dropdown */}
                      <AnimatePresence>
                        {showDrop && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.13 }}
                            className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-xl overflow-hidden z-50"
                            style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)' }}
                          >
                            {searching && (
                              <div className="flex items-center gap-2.5 px-4 py-4 text-slate-400" style={{ fontSize: 12 }}>
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                Searching institutions…
                              </div>
                            )}
                            {!searching && results.length === 0 && (
                              <div className="flex flex-col items-center gap-2 px-4 py-5 text-center">
                                <SearchX className="w-6 h-6 text-slate-200" />
                                <div>
                                  <p className="font-medium text-slate-500" style={{ fontSize: 12 }}>
                                    No schools found for &ldquo;{query}&rdquo;
                                  </p>
                                  <p className="text-slate-400 mt-0.5" style={{ fontSize: 11 }}>
                                    Try the URL option below, or register your school
                                  </p>
                                </div>
                                <Link
                                  href="/register"
                                  className="mt-1 inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                                  style={{ fontSize: 12 }}
                                >
                                  Register your school free →
                                </Link>
                              </div>
                            )}
                            {!searching && results.map((school, i) => {
                              const initials = school.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                              const planColors: Record<string, { bg: string; text: string }> = {
                                STARTER:    { bg: '#f1f5f9', text: '#64748b' },
                                PRO:        { bg: '#eff6ff', text: '#2563eb' },
                                ENTERPRISE: { bg: '#faf5ff', text: '#7c3aed' },
                                UNIVERSITY: { bg: '#fef3c7', text: '#d97706' },
                              }
                              const pc = planColors[school.plan] ?? planColors.STARTER
                              return (
                                <motion.button
                                  key={school.id}
                                  initial={{ opacity: 0, x: -6 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.04 }}
                                  onClick={() => selectSchool(school)}
                                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left group"
                                  style={{
                                    borderBottom: '1px solid #f8fafc',
                                    background: highlightedIndex === i ? '#eef2ff' : undefined,
                                  }}
                                >
                                  <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white overflow-hidden"
                                    style={{
                                      background: school.logoUrl ? '#f8fafc' : 'linear-gradient(135deg, #6366f1, #818cf8)',
                                      fontSize: 11,
                                      boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                                      border: school.logoUrl ? '1px solid #e8edf5' : 'none',
                                    }}
                                  >
                                    {school.logoUrl
                                      ? <img src={school.logoUrl} alt={school.name} className="w-full h-full object-contain p-1" />
                                      : initials
                                    }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-semibold text-slate-900 truncate">{school.name}</p>
                                      <span
                                        className="rounded-full px-1.5 py-px font-medium flex-shrink-0"
                                        style={{ fontSize: 9, background: pc.bg, color: pc.text }}
                                      >
                                        {school.plan}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-2.5 h-2.5" />
                                      {school.country}
                                      <span className="text-slate-200">·</span>
                                      <span className="font-mono">{school.slug}.terasms.com</span>
                                    </p>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                                </motion.button>
                              )
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Selected school */}
                    <AnimatePresence>
                      {selected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div
                            className="rounded-xl p-3 mb-2.5"
                            style={{ background: '#eef2ff', border: '1px solid #e0e7ff' }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white overflow-hidden"
                                style={{
                                  background: selected.logoUrl ? '#fff' : 'linear-gradient(135deg, #6366f1, #818cf8)',
                                  fontSize: 13,
                                  boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                                  border: selected.logoUrl ? '1px solid #e0e7ff' : 'none',
                                }}
                              >
                                {selected.logoUrl
                                  ? <img src={selected.logoUrl} alt={selected.name} className="w-full h-full object-contain p-1.5" />
                                  : selected.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-sm font-bold text-slate-900 truncate">{selected.name}</p>
                                  {(() => {
                                    const planColors: Record<string, { bg: string; text: string }> = {
                                      STARTER:    { bg: '#f1f5f9', text: '#64748b' },
                                      PRO:        { bg: '#dbeafe', text: '#2563eb' },
                                      ENTERPRISE: { bg: '#ede9fe', text: '#7c3aed' },
                                      UNIVERSITY: { bg: '#fef3c7', text: '#d97706' },
                                    }
                                    const pc = planColors[selected.plan] ?? planColors.STARTER
                                    return (
                                      <span
                                        className="rounded-full px-1.5 py-px font-semibold flex-shrink-0"
                                        style={{ fontSize: 9, background: pc.bg, color: pc.text }}
                                      >
                                        {selected.plan}
                                      </span>
                                    )
                                  })()}
                                </div>
                                <p className="text-[10px] text-indigo-400 font-mono mt-0.5 flex items-center gap-1">
                                  <Globe className="w-2.5 h-2.5" />
                                  {selected.slug}.terasms.com
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                                <button
                                  onClick={clearSearch}
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-indigo-300 hover:text-indigo-700 hover:bg-indigo-100 transition-all"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-indigo-400 mt-2 pl-0.5 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                              {selected.country}
                            </p>
                          </div>
                          <button
                            onClick={() => goToSchool(selected.slug)}
                            className="w-full h-11 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all group"
                            style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}
                          >
                            Go to {selected.name}
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Direct URL entry */}
                    <div>
                      <p className="text-slate-400 mb-2 flex items-center gap-1.5" style={{ fontSize: 11 }}>
                        <Globe className="w-3 h-3 flex-shrink-0" />
                        Know your school URL?
                      </p>

                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10"
                          style={{ height: 42 }}
                        >
                          <input
                            type="text"
                            placeholder="schoolname"
                            value={urlSlug}
                            onChange={e => setUrlSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            onKeyDown={e => { if (e.key === 'Enter') handleGoToUrl() }}
                            className="flex-1 h-full pl-3.5 text-slate-900 placeholder-slate-300 outline-none bg-transparent font-mono"
                            style={{ fontSize: 13 }}
                          />
                          <span className="pr-3.5 text-slate-400 flex-shrink-0 select-none" style={{ fontSize: 12 }}>
                            .terasms.com
                          </span>
                        </div>
                        <button
                          onClick={handleGoToUrl}
                          disabled={!urlSlug.trim()}
                          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-600 rounded-xl font-medium transition-all flex-shrink-0"
                          style={{ height: 42, padding: '0 16px', fontSize: 13, border: '1px solid #e2e8f0' }}
                        >
                          Go <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Live preview */}
                      <AnimatePresence>
                        {urlSlug.trim() && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1 mt-1.5 pl-1"
                            style={{ fontSize: 10 }}
                          >
                            <span className="text-slate-300">→</span>
                            <span className="text-indigo-400 font-mono">
                              https://{urlSlug}.terasms.com
                            </span>
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>{/* end school search */}

                  {/* Divider */}
                  {process.env.NEXT_PUBLIC_SUBDOMAIN_LIVE !== 'true' && (
                    <>
                      <div className="flex items-center gap-3 mt-14">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-slate-400 font-medium select-none" style={{ fontSize: 11 }}>or sign in with email</span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>

                      <div
                        className="mt-4 rounded-2xl p-5"
                        style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                      >
                      <form onSubmit={handleLogin} className="space-y-4">
                        <FloatingInput
                          label="Email address"
                          type="email"
                          value={email}
                          onChange={setEmail}
                          required
                          autoComplete="email"
                          inputBg="bg-slate-50"
                        />

                        <div>
                          <FloatingInput
                            label="Password"
                            type="password"
                            value={password}
                            onChange={setPassword}
                            required
                            autoComplete="current-password"
                            inputBg="bg-slate-50"
                          />
                          <div className="flex justify-end mt-1.5">
                            <button
                              type="button"
                              onClick={() => setShowForgotPw(true)}
                              className="text-slate-300 hover:text-slate-500 transition-colors"
                              style={{ fontSize: 11 }}
                            >
                              Forgot password?
                            </button>
                          </div>
                        </div>

                        {loginError && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5"
                            style={{ fontSize: 12 }}
                          >
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {loginError}
                          </motion.div>
                        )}

                        <button
                          type="submit"
                          disabled={loggingIn}
                          className="w-full h-12 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-medium text-sm transition-all group"
                          style={{ opacity: selected ? 0.4 : 1 }}
                        >
                          {loggingIn ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {tenantSlug ? `Signing in…` : 'Signing in…'}
                            </span>
                          ) : (
                            <>Sign in <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>
                          )}
                        </button>
                      </form>
                      </div>{/* end signin card */}

                      {/* Security note */}
                      <div className="flex items-center justify-center gap-1.5 mt-4">
                        <Lock className="w-3 h-3 text-slate-300" />
                        <p className="text-slate-400" style={{ fontSize: 11 }}>256-bit encrypted · SOC 2 compliant</p>
                      </div>
                    </>
                  )}

                </motion.div>
              )}
            </AnimatePresence>

            {/* Register link */}
            <p className="text-center mt-7 text-slate-400" style={{ fontSize: 12 }}>
              No account?{' '}
              <Link href="/register" className="text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                Start free trial →
              </Link>
            </p>

          </motion.div>
        </div>
      </div>
    </div>
  )
}
