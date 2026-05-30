'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Lock, LogOut, ShieldAlert, Loader2, ShieldCheck } from 'lucide-react'

const INACTIVITY_MS   = 5 * 60 * 1000  // 5 minutes
const PIN_LENGTH      = 6
const INACTIVITY_LABEL = (() => {
  const mins = Math.round(INACTIVITY_MS / 60000)
  return mins === 1 ? '1 minute' : `${mins} minutes`
})()

// ── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase()
}

function avatarColor(name: string) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']
  let hash = 0
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// ── component ─────────────────────────────────────────────────────────────────

interface LockScreenProps {
  schoolName?: string | null
  schoolLogo?: string | null
}

export function LockScreenModal({ schoolName, schoolLogo }: LockScreenProps = {}) {
  const { data: session } = useSession()

  const [locked,      setLocked]      = useState(false)
  const [pin,         setPin]         = useState<string[]>(Array(PIN_LENGTH).fill(''))
  const [error,       setError]       = useState<string | null>(null)
  const [checking,    setChecking]    = useState(false)
  const [hasPinSet,   setHasPinSet]   = useState<boolean | null>(null)
  const [shake,       setShake]       = useState(false)
  const [lockoutEnd,  setLockoutEnd]  = useState<number | null>(null)   // epoch ms when DB lockout expires
  const [countdown,   setCountdown]   = useState<number>(0)             // seconds remaining

  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRefs  = useRef<(HTMLInputElement | null)[]>([])

  // ── fetch PIN status ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user) return
    fetch('/api/user/pin')
      .then(r => r.json())
      .then(d => setHasPinSet(d.pinSet ?? false))
      .catch(() => setHasPinSet(false))
  }, [(session?.user as any)?.id])

  // ── inactivity timer ────────────────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setLocked(true), INACTIVITY_MS)
  }, [])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [resetTimer])

  // ── focus first input when modal opens ─────────────────────────────────────
  useEffect(() => {
    if (locked && hasPinSet) {
      setTimeout(() => inputRefs.current[0]?.focus(), 120)
    }
  }, [locked, hasPinSet])

  // ── lockout countdown + auto-retry polling ─────────────────────────────────
  useEffect(() => {
    if (!lockoutEnd) { setCountdown(0); return }

    const tick = () => {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockoutEnd(null)
        setCountdown(0)
        setError(null)
        if (pollRef.current) clearInterval(pollRef.current)
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else {
        setCountdown(remaining)
      }
    }
    tick()
    pollRef.current = setInterval(tick, 1000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [lockoutEnd])

  // ── PIN verify ──────────────────────────────────────────────────────────────
  const verifyPin = useCallback(async (digits: string[]) => {
    setChecking(true)
    setError(null)
    try {
      const res  = await fetch('/api/user/pin/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pin: digits.join('') }),
      })
      const data = await res.json()

      if (res.ok && data.valid) {
        setLocked(false)
        setPin(Array(PIN_LENGTH).fill(''))
        setLockoutEnd(null)
        resetTimer()
      } else if (res.status === 429 && data.retryAfter) {
        // DB lockout — start countdown
        setLockoutEnd(Date.now() + data.retryAfter * 1000)
        setError(data.error ?? 'Too many attempts. Please wait.')
        setPin(Array(PIN_LENGTH).fill(''))
      } else {
        setError(data.error ?? 'Incorrect PIN.')
        setShake(true)
        setPin(Array(PIN_LENGTH).fill(''))
        setTimeout(() => { setShake(false); inputRefs.current[0]?.focus() }, 500)
      }
    } catch {
      setError('Connection error. Please try again.')
      setPin(Array(PIN_LENGTH).fill(''))
    } finally {
      setChecking(false)
    }
  }, [resetTimer])

  // ── digit input handlers ────────────────────────────────────────────────────
  const handleDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next  = [...pin]
    next[index] = digit
    setPin(next)
    setError(null)
    if (digit) {
      if (index < PIN_LENGTH - 1) inputRefs.current[index + 1]?.focus()
      if (next.every(d => d !== '')) verifyPin(next)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (pin[index]) {
        const next = [...pin]; next[index] = ''; setPin(next)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
        const next = [...pin]; next[index - 1] = ''; setPin(next)
      }
    } else if (e.key === 'ArrowLeft'  && index > 0)             inputRefs.current[index - 1]?.focus()
    else if   (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH)
    if (!digits) return
    const next = Array(PIN_LENGTH).fill('')
    digits.split('').forEach((d, i) => { next[i] = d })
    setPin(next)
    if (digits.length === PIN_LENGTH) verifyPin(next)
    else inputRefs.current[digits.length]?.focus()
  }

  if (!locked || !session?.user) return null

  const user      = session.user as any
  const userName  = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || user.email || 'User'
  const userEmail = user.email ?? ''

  // School avatar (for admin portal) or user avatar (for other portals)
  const showSchool   = !!schoolName
  const displayName  = showSchool ? schoolName! : userName
  const initials     = getInitials(displayName)
  const bgColor      = avatarColor(displayName)

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backdropFilter: 'blur(20px) saturate(180%)', background: 'rgba(10, 15, 35, 0.85)' }}
    >
      <div className="w-full max-w-sm mx-4">

        {/* ── Card ── */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Indigo→blue top accent */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />

          <div className="px-8 pt-8 pb-6 text-center">

            {/* Avatar — school logo or initials */}
            <div className="mx-auto mb-3 w-16 h-16 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center"
              style={{ background: schoolLogo ? '#fff' : bgColor, border: schoolLogo ? '1px solid #e5e7eb' : 'none' }}
            >
              {schoolLogo
                ? <img src={schoolLogo} alt={displayName} className="w-full h-full object-cover" />
                : <span className="text-white text-xl font-bold">{initials}</span>
              }
            </div>

            {/* Lock badge */}
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-3">
              <Lock className="w-3 h-3 text-indigo-400" />
              <span className="text-xs text-indigo-600 font-medium">Portal locked</span>
            </div>

            {/* School name (admin) or user name */}
            <p className="text-base font-bold text-gray-900 leading-tight">{displayName}</p>

            {/* Admin portal: show user as subtitle */}
            {showSchool ? (
              <p className="text-xs text-gray-400 mt-0.5 mb-3">
                Sign in as <span className="font-medium text-gray-500">{userName}</span> to continue
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5 mb-3">{userEmail}</p>
            )}

            {/* ── Why locked — reason box ── */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-5 text-left">
              <div className="flex gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">Why is this locked?</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    This session was automatically locked after{' '}
                    <strong className="text-slate-600">{INACTIVITY_LABEL} of inactivity</strong> to protect
                    student records, financial data, and sensitive school information from
                    unauthorized access.
                  </p>
                </div>
              </div>
            </div>

            {/* ── No PIN case ── */}
            {hasPinSet === false ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-left">
                <div className="flex gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">No PIN configured</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Set up a PIN in <strong>Account → Security</strong> to use quick unlock.
                      For now, please sign out and sign back in.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">Enter your {PIN_LENGTH}-digit PIN to continue</p>

                {/* ── PIN boxes ── */}
                <div className={`flex justify-center gap-2.5 mb-4 ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
                  {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={pin[i]}
                      onChange={e => handleDigit(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      onPaste={handlePaste}
                      disabled={checking || !!lockoutEnd}
                      aria-label={`PIN digit ${i + 1}`}
                      className={`
                        w-11 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none
                        transition-all duration-150 bg-gray-50
                        ${pin[i] ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700'}
                        focus:border-indigo-500 focus:bg-indigo-50 focus:ring-4 focus:ring-indigo-100
                        disabled:opacity-50
                      `}
                    />
                  ))}
                </div>

                {checking && (
                  <div className="flex items-center justify-center gap-2 text-indigo-500 text-sm mb-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying…</span>
                  </div>
                )}

                {/* Lockout countdown */}
                {lockoutEnd && countdown > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-3 text-center">
                    <p className="text-sm font-semibold text-orange-700">Too many incorrect attempts</p>
                    <p className="text-xs text-orange-500 mt-1">
                      Try again in{' '}
                      <strong>{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</strong>
                      {' '}— or sign out below
                    </p>
                  </div>
                )}

                {error && !checking && !lockoutEnd && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <p className="text-xs text-gray-400 mb-1">
                  Forgot your PIN?{' '}
                  <a href="/account/security" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                    Security Settings ↗
                  </a>
                </p>
              </>
            )}
          </div>

          {/* ── Sign out ── */}
          <div className="px-8 pb-6">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign out completely
            </button>
          </div>
        </div>

        {/* Below-card hint */}
        <p className="text-center text-xs text-white/30 mt-4">
          {showSchool ? `${displayName} · Admin Portal` : 'Tera SM'} · Protected by inactivity lock
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-6px); }
          40%     { transform: translateX(6px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}
