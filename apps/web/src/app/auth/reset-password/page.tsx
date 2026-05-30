'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Loader2, AlertCircle, Check, X, KeyRound, ArrowRight } from 'lucide-react'
import { FloatingInput } from '@/components/ui/floating-input'
import { cn } from '@/lib/utils'

// ─── Password strength (mirrors register page) ────────────────────────────────

const PW_CHECKS = [
  { label: '8+ characters',     test: (v: string) => v.length >= 8 },
  { label: 'Uppercase letter',  test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Lowercase letter',  test: (v: string) => /[a-z]/.test(v) },
  { label: 'Number',            test: (v: string) => /\d/.test(v) },
  { label: 'Special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

const STRENGTH_LEVELS = [
  { label: 'Too weak', barColor: 'bg-blue-100',   textColor: 'text-slate-400'  },
  { label: 'Weak',     barColor: 'bg-blue-200',   textColor: 'text-blue-400'   },
  { label: 'Fair',     barColor: 'bg-blue-400',   textColor: 'text-blue-500'   },
  { label: 'Good',     barColor: 'bg-indigo-500', textColor: 'text-indigo-600' },
  { label: 'Strong',   barColor: 'bg-indigo-700', textColor: 'text-indigo-700' },
]

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const score = PW_CHECKS.filter(c => c.test(password)).length
  const level = STRENGTH_LEVELS[Math.max(score - 1, 0)]
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 space-y-2.5"
    >
      {/* Strength bars */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 h-1 rounded-full transition-all duration-300',
              i < score ? level.barColor : 'bg-slate-100',
            )}
          />
        ))}
      </div>
      <p className={cn('text-[11px] font-medium', level.textColor)}>{level.label}</p>

      {/* Live checklist */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
        {PW_CHECKS.map(c => {
          const passed = c.test(password)
          return (
            <div key={c.label} className="flex items-center gap-1.5">
              <Check className={cn('w-3 h-3 flex-shrink-0 transition-colors duration-200', passed ? 'text-indigo-600' : 'text-slate-200')} />
              <span className={cn('text-[11px] transition-colors duration-200', passed ? 'text-slate-600' : 'text-slate-400')}>{c.label}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Left panel ───────────────────────────────────────────────────────────────

function BrandingPanel() {
  return (
    <div
      className="hidden lg:flex w-[460px] flex-shrink-0 flex-col p-10 relative overflow-hidden"
      style={{ background: '#06060f' }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(165,180,252,0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Glows */}
      <div className="absolute pointer-events-none" style={{ top: -120, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div className="absolute pointer-events-none" style={{ bottom: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />

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
      <div className="relative z-10 mt-10 flex-shrink-0">
        <p className="font-bold tracking-tight leading-[1.2]" style={{ fontSize: 26, color: 'rgba(255,255,255,0.82)' }}>
          Keep your account<br />secure.
        </p>
        <p className="mt-3 leading-relaxed" style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
          Choose a strong, unique password. We'll never ask for it by phone or email.
        </p>
      </div>

      {/* Security tips */}
      <div className="relative z-10 mt-10 space-y-4 flex-shrink-0">
        {[
          'Use 12+ characters — mix letters, numbers, and symbols.',
          'Avoid reusing passwords from other services.',
          'Consider a password manager to store it safely.',
        ].map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
            className="flex items-start gap-3"
          >
            <div
              className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
              style={{ background: 'rgba(129,140,248,0.5)' }}
            />
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', lineHeight: 1.65 }}>{tip}</p>
          </motion.div>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Testimonial chip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.45 }}
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

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between mt-5 flex-shrink-0">
        <div className="flex items-center gap-4">
          {['256-bit encrypted', 'SOC 2 compliant', '99.9% uptime'].map(s => (
            <span key={s} style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)' }}>{s}</span>
          ))}
        </div>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.12)' }}>© 2026 Tera SM</p>
      </div>
    </div>
  )
}

// ─── Reset password page ──────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState('')

  const confirmError = confirm && password !== confirm ? 'Passwords do not match' : undefined
  const score        = PW_CHECKS.filter(c => c.test(password)).length
  const canSubmit    = !loading && !!token && score >= 3 && password === confirm && !!confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8)   { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm)   { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message ?? 'Something went wrong.'); return }
      setSuccess(true)
      setTimeout(() => router.push('/login'), 4000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <BrandingPanel />

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col bg-white" style={{ borderLeft: '1px solid #e8e8ed' }}>

        {/* Mobile header */}
        <div className="lg:hidden flex items-center px-6 py-4" style={{ borderBottom: '1px solid #f0f0f5' }}>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">T</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">Tera SM</span>
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[340px]"
          >
            <AnimatePresence mode="wait">

              {/* ── Invalid / missing token ── */}
              {!token ? (
                <motion.div
                  key="invalid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="text-center"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
                    style={{ background: '#fef2f2' }}
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </div>
                  <h1 className="font-semibold text-slate-900 tracking-tight" style={{ fontSize: 22 }}>
                    Link invalid or expired
                  </h1>
                  <p className="text-slate-400 mt-2 leading-relaxed" style={{ fontSize: 13 }}>
                    This reset link is no longer valid. Request a new one from the login page.
                  </p>
                  <Link
                    href="/login"
                    className="mt-6 w-full h-11 flex items-center justify-center rounded-lg font-medium transition-colors"
                    style={{ fontSize: 13, background: '#6366f1', color: '#fff' }}
                  >
                    Back to sign in
                  </Link>
                </motion.div>

              ) : success ? (

                /* ── Success ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="text-center"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
                    style={{ background: '#6366f1' }}
                  >
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="font-semibold text-slate-900 tracking-tight" style={{ fontSize: 22 }}>
                    Password updated
                  </h1>
                  <p className="text-slate-400 mt-2 leading-relaxed" style={{ fontSize: 13 }}>
                    Your password has been changed successfully.<br />Redirecting you to sign in…
                  </p>
                  <Link
                    href="/login"
                    className="mt-6 w-full h-11 flex items-center justify-center rounded-lg font-medium transition-colors"
                    style={{ fontSize: 13, background: '#6366f1', color: '#fff' }}
                  >
                    Sign in now →
                  </Link>
                </motion.div>

              ) : (

                /* ── Form ── */
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4"
                >
                  {/* Heading */}
                  <div className="mb-7">
                    <div className="lg:hidden w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center mb-5 shadow-md shadow-indigo-600/20">
                      <span className="text-white font-black text-base">T</span>
                    </div>
                    <h1 className="font-bold tracking-tight text-slate-900" style={{ fontSize: 24 }}>
                      Set new password
                    </h1>
                    <p className="text-slate-400 mt-1" style={{ fontSize: 13 }}>
                      Choose a strong password for your account.
                    </p>
                  </div>

                  {/* New password + strength */}
                  <div>
                    <FloatingInput
                      label="New password"
                      type="password"
                      value={password}
                      onChange={setPassword}
                      required
                      autoComplete="new-password"
                    />
                    <PasswordStrength password={password} />
                  </div>

                  {/* Confirm password */}
                  <div>
                    <FloatingInput
                      label="Confirm password"
                      type="password"
                      value={confirm}
                      onChange={setConfirm}
                      required
                      autoComplete="new-password"
                      error={confirmError}
                    />
                    <AnimatePresence>
                      {confirm && !confirmError && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="flex items-center gap-1.5 mt-1.5"
                        >
                          <Check className="w-3 h-3 text-indigo-600" />
                          <span className="text-indigo-600 font-medium" style={{ fontSize: 11 }}>Passwords match</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5"
                      style={{ fontSize: 12 }}
                    >
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                    </motion.div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg font-medium text-sm transition-all group"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Update password <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>
                    )}
                  </button>

                  {/* Back link */}
                  <p className="text-center" style={{ fontSize: 12 }}>
                    <Link href="/login" className="text-slate-400 hover:text-slate-700 transition-colors">
                      ← Back to sign in
                    </Link>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
