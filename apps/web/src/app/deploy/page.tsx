'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Check, Copy, ArrowRight, Users, XCircle,
  Sparkles, Globe, Shield, Zap, BookOpen,
  CreditCard, Palette, Bell, CheckCircle2,
  Server, Key,
} from 'lucide-react'

/* ─── Brand defaults ─────────────────────────────────────── */
const DEFAULT_COLOR_A = '#10B981'
const DEFAULT_COLOR_B = '#2563EB'

/* ─── Steps ─────────────────────────────────────────────── */
const DEPLOY_STEPS = [
  { id: 1,  label: 'Account created',        delay: 0,    icon: Shield,    hint: 'Your admin credentials have been created and secured with bcrypt hashing.' },
  { id: 2,  label: 'School profile saved',   delay: 900,  icon: BookOpen,  hint: 'Your institution name, country, timezone and currency have been stored.' },
  { id: 3,  label: 'Provisioning workspace', delay: 1900, icon: Server,    hint: 'A dedicated multi-tenant environment is being initialised for your school.' },
  { id: 4,  label: 'Configuring subdomain',  delay: 3100, icon: Globe,     isDynamic: true, hint: 'Your unique subdomain is being registered and DNS routing configured.' },
  { id: 5,  label: 'Roles & permissions',    delay: 4100, icon: Key,       hint: "Role-based access control applied — staff only see what they're authorised for." },
  { id: 6,  label: 'Academic modules',       delay: 5000, icon: BookOpen,  hint: 'Timetable, attendance, grades, transcripts and LMS modules activated.' },
  { id: 7,  label: 'Payment gateway',        delay: 5800, icon: CreditCard, hint: 'Paystack and Stripe are linked and ready to collect school fees.' },
  { id: 8,  label: 'School branding',        delay: 6600, icon: Palette,   hint: 'Your logo and brand colours are being applied across all portals.' },
  { id: 9,  label: 'Welcome notification',   delay: 7400, icon: Bell,      hint: 'A welcome email with your login details is being dispatched now.' },
  { id: 10, label: 'Finalising setup',       delay: 8200, icon: Zap,       hint: 'Running final checks and verifying all systems are operational.' },
]

const STEP_HEADLINES: Record<number, string> = {
  1:  'Creating your admin account…',
  2:  'Saving school profile…',
  3:  'Provisioning workspace…',
  4:  'Configuring your subdomain…',
  5:  'Applying role permissions…',
  6:  'Activating academic modules…',
  7:  'Connecting payment gateway…',
  8:  'Applying school branding…',
  9:  'Sending welcome email…',
  10: 'Running final checks…',
}

const TOTAL_DURATION    = 9200
const READY_BEAT_DELAY  = 700   // ms between all-done and done card
const REDIRECT_COUNTDOWN = 5

/* ─── Confetti ───────────────────────────────────────────── */
interface ConfettiDot { id: number; color: string; size: number; angle: number; distance: number }

function ConfettiBurst({ colorA, colorB }: { colorA: string; colorB: string }) {
  const dots: ConfettiDot[] = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: i % 3 === 0 ? colorA : i % 3 === 1 ? colorB : '#f1f5f9',
    size: 4 + Math.random() * 6,
    angle: (i / 28) * 360 + Math.random() * 15,
    distance: 80 + Math.random() * 120,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {dots.map(d => {
        const rad = (d.angle * Math.PI) / 180
        return (
          <motion.div
            key={d.id}
            className="absolute rounded-full"
            style={{ left: '50%', top: '30%', width: d.size, height: d.size, backgroundColor: d.color, marginLeft: -d.size / 2, marginTop: -d.size / 2 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(rad) * d.distance, y: Math.sin(rad) * d.distance, opacity: 0, scale: 0.3 }}
            transition={{ duration: 1.2 + Math.random() * 0.6, ease: [0.22, 1, 0.36, 1], delay: Math.random() * 0.15 }}
          />
        )
      })}
    </div>
  )
}

/* ─── Feature Reveal Panel ───────────────────────────────── */
const REVEAL_FEATURES = [
  { stepId: 1,  icon: Shield,     label: 'Credentials secured',   sub: 'bcrypt-hashed, zero plaintext' },
  { stepId: 2,  icon: BookOpen,   label: 'School profile saved',  sub: 'timezone, currency, locale' },
  { stepId: 3,  icon: Server,     label: 'Workspace provisioned', sub: 'isolated multi-tenant env' },
  { stepId: 4,  icon: Globe,      label: 'Subdomain live',        sub: 'DNS routing confirmed' },
  { stepId: 5,  icon: Key,        label: 'RBAC applied',          sub: '9 granular permission tiers' },
  { stepId: 6,  icon: BookOpen,   label: 'Academic modules on',   sub: 'grades, timetable, transcripts' },
  { stepId: 7,  icon: CreditCard, label: 'Payments ready',        sub: 'Paystack · Stripe · Flutterwave' },
  { stepId: 8,  icon: Palette,    label: 'Branding applied',      sub: 'logo, colours, custom domain' },
  { stepId: 9,  icon: Bell,       label: 'Welcome email sent',    sub: 'check your inbox' },
  { stepId: 10, icon: Zap,        label: 'All systems go',        sub: '99.9% uptime SLA active' },
]

function FeatureRevealPanel({
  completed, colorA, activeStepId,
}: { completed: number[]; colorA: string; activeStepId: number | undefined }) {
  const revealed = REVEAL_FEATURES.filter(f => completed.includes(f.stepId))
  const pending  = REVEAL_FEATURES.filter(f => !completed.includes(f.stepId))
  const headline = activeStepId ? STEP_HEADLINES[activeStepId] : completed.length === REVEAL_FEATURES.length ? 'Platform activated!' : 'Activating your platform'

  return (
    <div className="lg:col-span-2 px-6 py-7 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-100">
      {/* Dynamic headline */}
      <AnimatePresence mode="wait">
        <motion.p
          key={headline}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.25 }}
          className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1"
        >
          {headline}
        </motion.p>
      </AnimatePresence>
      <p className="text-[10px] text-slate-300 mb-4">{revealed.length} of {REVEAL_FEATURES.length} activated</p>

      <div className="flex-1 space-y-1.5 overflow-hidden">
        <AnimatePresence>
          {revealed.map(f => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.stepId}
                initial={{ opacity: 0, x: 14, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-slate-50"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${colorA}15` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: colorA }} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 leading-none">{f.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{f.sub}</p>
                </div>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
                  <Check className="w-3.5 h-3.5 text-slate-300" strokeWidth={2.5} />
                </motion.div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Shimmer skeleton rows for pending */}
        {pending.map(f => (
          <div key={f.stepId} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className="deploy-shimmer w-7 h-7 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="deploy-shimmer h-2 rounded w-3/5" />
              <div className="deploy-shimmer h-1.5 rounded w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
function DeployInner() {
  const router = useRouter()

  const [schoolName, setSchoolName] = useState('Greenfield Academy')
  const [subdomain, setSubdomain]   = useState('greenfield')
  const [colorA, setColorA]         = useState(DEFAULT_COLOR_A)
  const [colorB]                    = useState(DEFAULT_COLOR_B)
  const [logo, setLogo]             = useState('')
  const [formData, setFormData]     = useState<Record<string, unknown> | null>(null)

  const [completed, setCompleted]         = useState<number[]>([])
  const [stepDurations, setStepDurations] = useState<Record<number, number>>({})
  const stepStartTimes = useRef<Record<number, number>>({})

  const [readyBeat, setReadyBeat]               = useState(false)  // all steps done, brief interstitial
  const [done, setDone]                         = useState(false)  // show done card
  const [showBurst, setShowBurst]               = useState(false)
  const [copied, setCopied]                     = useState(false)
  const [apiError, setApiError]                 = useState('')
  const [subdomainConfirmed, setSubdomainConfirmed] = useState(false)
  const [hoveredStep, setHoveredStep]           = useState<number | null>(null)
  const [countdown, setCountdown]               = useState(REDIRECT_COUNTDOWN)
  const [redirectCancelled, setRedirectCancelled] = useState(false)

  // Smooth % display
  const [displayPct, setDisplayPct] = useState(0)
  const prevPct = useRef(0)

  const apiCalled = useRef(false)

  /* Load from sessionStorage */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('tera_deploy')
      if (raw) {
        const d = JSON.parse(raw)
        if (d.name)      setSchoolName(d.name)
        if (d.subdomain) setSubdomain(d.subdomain)
        if (d.color)     setColorA(d.color)
        if (d.logo)      setLogo(d.logo)
        setFormData(d)
        sessionStorage.removeItem('tera_deploy')
      }
    } catch { /* ignore */ }
  }, [])

  /* Provision — surface error immediately */
  useEffect(() => {
    if (!formData || apiCalled.current) return
    apiCalled.current = true
    ;(async () => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (!res.ok) {
          setApiError(data.error ?? 'Provisioning failed.')
          setDone(true)  // jump straight to error state
        }
      } catch {
        setApiError('Network error during provisioning.')
        setDone(true)
      }
    })()
  }, [formData])

  /* Step timers */
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    DEPLOY_STEPS.forEach((s, idx) => {
      const prevDelay = idx > 0 ? DEPLOY_STEPS[idx - 1].delay : -1
      if (prevDelay >= 0) {
        timers.push(setTimeout(() => { stepStartTimes.current[s.id] = Date.now() }, prevDelay))
      } else {
        stepStartTimes.current[s.id] = Date.now()
      }
      timers.push(setTimeout(() => {
        const startTime = stepStartTimes.current[s.id] ?? Date.now()
        const duration  = (Date.now() - startTime) / 1000
        setStepDurations(prev => ({ ...prev, [s.id]: duration }))
        setCompleted(prev => [...prev, s.id])
        if (s.isDynamic) setSubdomainConfirmed(true)
      }, s.delay))
    })

    // Ready beat then done card
    timers.push(setTimeout(() => { setReadyBeat(true); setShowBurst(true) }, TOTAL_DURATION))
    timers.push(setTimeout(() => setDone(true), TOTAL_DURATION + READY_BEAT_DELAY))

    return () => timers.forEach(clearTimeout)
  }, [])

  /* Smooth % tween */
  useEffect(() => {
    const progress = Math.round((completed.length / DEPLOY_STEPS.length) * 100)
    const from = prevPct.current
    prevPct.current = progress
    const controls = animate(from, progress, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: v => setDisplayPct(Math.round(v)),
    })
    return () => controls.stop()
  }, [completed.length])

  /* Auto-redirect countdown */
  useEffect(() => {
    if (!done || apiError || redirectCancelled) return
    if (countdown <= 0) { router.push('/admin'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [done, countdown, apiError, redirectCancelled, router])

  const progress   = Math.round((completed.length / DEPLOY_STEPS.length) * 100)
  const activeStep = DEPLOY_STEPS.find(s => !completed.includes(s.id))

  /* Time remaining */
  const secondsLeft = useMemo(() => {
    if (!activeStep) return 0
    return Math.ceil((TOTAL_DURATION - activeStep.delay) / 1000)
  }, [activeStep])

  const initials = schoolName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const dashUrl  = `https://${subdomain}.terasms.com`
  const copyUrl  = () => { navigator.clipboard.writeText(dashUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  const grad     = `linear-gradient(135deg, ${colorA}, ${colorB})`
  const gradSoft = `linear-gradient(135deg, ${colorA}15, ${colorB}15)`

  return (
    <>
      {/* Shimmer keyframes */}
      <style>{`
        @keyframes deploy-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .deploy-shimmer {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: deploy-shimmer 1.6s infinite linear;
        }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #f0f4ff 0%, #fafcff 50%, #f0faf5 100%)' }}
      >
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute w-[700px] h-[700px] rounded-full -top-48 -left-48"
            style={{ background: `radial-gradient(circle, ${colorA}15 0%, transparent 65%)` }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full -bottom-32 -right-32"
            style={{ background: `radial-gradient(circle, ${colorB}10 0%, transparent 65%)` }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 9, delay: 2, ease: 'easeInOut' }}
          />
        </div>

        {/* Top-left logo */}
        <div className="absolute top-7 left-7 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: grad }}>
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="text-slate-400 font-semibold text-sm">Tera SM</span>
        </div>

        {/* Top-right status badge */}
        <div className="absolute top-7 right-7 flex items-center gap-1.5 bg-white/80 border border-slate-200 rounded-full px-3 py-1.5 backdrop-blur-sm">
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: done && !apiError ? colorA : done ? '#ef4444' : colorA }}
            animate={{ opacity: done ? 1 : [1, 0.3, 1] }}
            transition={{ repeat: done ? 0 : Infinity, duration: 1.4 }}
          />
          <span className="text-slate-500 text-xs font-medium">
            {done && !apiError ? 'Complete' : done ? 'Failed' : 'Deploying…'}
          </span>
        </div>

        {/* ── Main layout ── */}
        <div className="w-full max-w-4xl relative z-10">
          <AnimatePresence mode="wait">

            {/* ══ DEPLOYING ══ */}
            {!done && (
              <motion.div
                key="deploying"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="bg-white/85 backdrop-blur-xl rounded-3xl border border-slate-100 overflow-hidden">
                  <div className="h-1 w-full" style={{ background: grad }} />

                  <div className="grid grid-cols-1 lg:grid-cols-5">

                    {/* Left — Steps */}
                    <div className="lg:col-span-3 px-8 py-7">

                      {/* Header */}
                      <div className="flex items-center gap-5 mb-7 pb-6 border-b border-slate-100">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 overflow-hidden"
                          style={{ background: grad }}
                        >
                          {logo
                            ? <img src={logo} alt="logo" className="w-10 h-10 object-contain brightness-0 invert" />
                            : <span className="tracking-tight">{initials}</span>
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          <h1 className="text-base font-bold text-slate-800 truncate">{schoolName}</h1>
                          <p className="text-xs text-slate-400 mt-0.5">{subdomain}.terasms.com</p>
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>{completed.length} / {DEPLOY_STEPS.length} steps</span>
                              <div className="flex items-center gap-2">
                                {/* Time remaining */}
                                {secondsLeft > 0 && !readyBeat && (
                                  <span className="text-slate-300">~{secondsLeft}s left</span>
                                )}
                                <span className="font-semibold" style={{ color: colorA }}>{displayPct}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: grad }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Large smooth % */}
                        <div className="flex-shrink-0 text-right pl-2">
                          <p
                            className="text-5xl font-black leading-none tabular-nums"
                            style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                          >
                            {displayPct}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">percent</p>
                        </div>
                      </div>

                      {/* Steps with vertical timeline */}
                      <div className="relative">
                        <div className="absolute left-[27px] top-[22px] bottom-[22px] w-px bg-slate-100" />
                        <motion.div
                          className="absolute left-[27px] top-[22px] w-px origin-top"
                          style={{ background: grad }}
                          animate={{ height: `${Math.max(0, progress - 5)}%` }}
                          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        />

                        <div className="space-y-0.5">
                          {DEPLOY_STEPS.map(s => {
                            const isDone    = completed.includes(s.id)
                            const isActive  = activeStep?.id === s.id
                            const isHovered = hoveredStep === s.id && isDone
                            const Icon      = s.icon
                            const duration  = stepDurations[s.id]
                            const label     = s.isDynamic ? `Configuring ${subdomain}.terasms.com` : s.label

                            return (
                              <motion.div
                                key={s.id}
                                initial={false}
                                animate={{ backgroundColor: isActive ? `${colorA}08` : isHovered ? '#f8fafc' : 'transparent' }}
                                transition={{ duration: 0.2 }}
                                className="rounded-2xl cursor-default"
                                onMouseEnter={() => isDone && setHoveredStep(s.id)}
                                onMouseLeave={() => setHoveredStep(null)}
                              >
                                <div className="flex items-start gap-4 px-3 py-2.5">
                                  {/* Icon */}
                                  <div className="flex-shrink-0 mt-0.5 relative z-10">
                                    {isActive && (
                                      <motion.div
                                        className="absolute inset-0 rounded-full"
                                        style={{ border: `1.5px solid ${colorA}` }}
                                        animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.4 }}
                                      />
                                    )}
                                    <div
                                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
                                      style={{
                                        background: isDone ? grad : isActive ? `${colorA}15` : '#f1f5f9',
                                        border: isDone ? 'none' : isActive ? `1.5px solid ${colorA}50` : '1.5px solid #e2e8f0',
                                      }}
                                    >
                                      {isDone ? (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
                                          <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                                        </motion.div>
                                      ) : (
                                        <Icon className="w-4 h-4 transition-all" style={{ color: isActive ? colorA : '#cbd5e1' }} strokeWidth={2} />
                                      )}
                                    </div>
                                  </div>

                                  {/* Label + hint */}
                                  <div className="flex-1 min-w-0 pt-1.5">
                                    <p
                                      className="text-sm font-semibold leading-none transition-colors"
                                      style={{ color: isDone ? '#334155' : isActive ? colorA : '#94a3b8' }}
                                    >
                                      {label}
                                    </p>
                                    {/* Active hint */}
                                    <AnimatePresence>
                                      {(isActive || isHovered) && (
                                        <motion.p
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.22 }}
                                          className="text-xs text-slate-400 mt-1 leading-relaxed pr-4"
                                        >
                                          {s.hint}
                                        </motion.p>
                                      )}
                                    </AnimatePresence>
                                  </div>

                                  {/* Timing or pulsing dots */}
                                  <div className="flex-shrink-0 pt-2">
                                    {isDone && duration !== undefined && (
                                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-slate-300 tabular-nums">
                                        {duration.toFixed(1)}s
                                      </motion.span>
                                    )}
                                    {isActive && (
                                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-0.5 mt-0.5">
                                        {[0, 0.15, 0.3].map(delay => (
                                          <motion.div
                                            key={delay}
                                            className="w-1 h-1 rounded-full"
                                            style={{ backgroundColor: colorA }}
                                            animate={{ opacity: [1, 0.25, 1] }}
                                            transition={{ repeat: Infinity, duration: 0.8, delay }}
                                          />
                                        ))}
                                      </motion.div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Subdomain confirmed callout */}
                      <AnimatePresence>
                        {subdomainConfirmed && !readyBeat && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                            className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 border"
                            style={{ background: `${colorA}08`, borderColor: `${colorA}22` }}
                          >
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: grad }}>
                              <Globe className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Subdomain confirmed</p>
                              <p className="text-xs font-semibold text-slate-700 truncate">{subdomain}.terasms.com</p>
                            </div>
                            <div className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: `${colorA}18`, color: colorA }}>
                              Active
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ── Ready beat interstitial ── */}
                      <AnimatePresence>
                        {readyBeat && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                            className="mt-4 flex items-center justify-center gap-3 rounded-2xl px-4 py-3.5 border"
                            style={{ background: `${colorA}08`, borderColor: `${colorA}25` }}
                          >
                            <div className="relative">
                              <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{ border: `1.5px solid ${colorA}` }}
                                animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                                transition={{ repeat: Infinity, duration: 0.9 }}
                              />
                              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: grad }}>
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                              </div>
                            </div>
                            <p className="text-sm font-bold" style={{ color: colorA }}>All systems ready — launching your dashboard</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!readyBeat && <p className="text-center text-xs text-slate-300 mt-5">Please keep this window open</p>}
                    </div>

                    {/* Right — Feature reveal */}
                    <FeatureRevealPanel completed={completed} colorA={colorA} activeStepId={activeStep?.id} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ DONE ══ */}
            {done && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {showBurst && !apiError && <ConfettiBurst colorA={colorA} colorB={colorB} />}

                <div className="bg-white/85 backdrop-blur-xl rounded-3xl border border-slate-100 overflow-hidden">
                  {!apiError && <div className="h-1 w-full" style={{ background: grad }} />}

                  {apiError ? (
                    <div className="p-12 text-center space-y-6">
                      <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-100 mx-auto flex items-center justify-center">
                        <XCircle className="w-9 h-9 text-red-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Setup failed</h2>
                        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{apiError}</p>
                      </div>
                      <Link href="/register" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
                        ← Back to registration
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                      {/* Left — Success */}
                      <div className="lg:col-span-3 px-10 py-10">
                        <div className="relative inline-block mb-6">
                          {[1, 2].map(i => (
                            <motion.div
                              key={i}
                              className="absolute inset-0 rounded-3xl"
                              style={{ border: `1.5px solid ${colorA}35` }}
                              initial={{ scale: 1, opacity: 0.6 }}
                              animate={{ scale: 1 + i * 0.5, opacity: 0 }}
                              transition={{ duration: 2.5, delay: i * 0.2, ease: 'easeOut' }}
                            />
                          ))}
                          <motion.div
                            initial={{ scale: 0, rotate: -15 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
                            className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
                            style={{ background: grad }}
                          >
                            <CheckCircle2 className="w-10 h-10 text-white" />
                          </motion.div>
                        </div>

                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                          <h1 className="text-2xl font-black text-slate-800 mb-2">{schoolName} is live!</h1>
                          <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                            Your school management system has been provisioned successfully. Welcome aboard.
                          </p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 }}
                          className="inline-flex items-center gap-2 mt-4 mb-7 rounded-full px-3.5 py-1.5 border"
                          style={{ background: `${colorA}10`, borderColor: `${colorA}28` }}
                        >
                          <motion.div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: colorA }}
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          />
                          <span className="text-xs font-semibold" style={{ color: colorA }}>System active</span>
                        </motion.div>

                        {/* Staggered stats */}
                        <div className="grid grid-cols-3 gap-3 mb-5">
                          {[
                            { label: 'Modules ready', value: '11' },
                            { label: 'Status',         value: 'Trial' },
                            { label: 'Uptime SLA',     value: '99.9%' },
                          ].map((s, i) => (
                            <motion.div
                              key={s.label}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                              className="rounded-2xl py-4 px-3 text-center bg-slate-50 border border-slate-100"
                            >
                              <p className="font-black text-lg text-slate-800">{s.value}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
                            </motion.div>
                          ))}
                        </div>

                        {/* URL row */}
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.42 }}
                          className="flex items-center gap-3 rounded-2xl p-4 bg-slate-50 border border-slate-100 mb-5"
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: gradSoft }}>
                            <Globe className="w-4 h-4" style={{ color: colorA }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Dashboard URL</p>
                            <p className="text-sm text-slate-600 truncate">{dashUrl}</p>
                          </div>
                          {/* Copy with Copied! label */}
                          <button
                            onClick={copyUrl}
                            className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 transition-all border flex-shrink-0"
                            style={{
                              background: copied ? `${colorA}10` : '#fff',
                              borderColor: copied ? `${colorA}30` : '#e2e8f0',
                            }}
                          >
                            <AnimatePresence mode="wait">
                              {copied ? (
                                <motion.span
                                  key="copied"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="flex items-center gap-1 text-[11px] font-semibold"
                                  style={{ color: colorA }}
                                >
                                  <Check className="w-3 h-3" strokeWidth={2.5} /> Copied!
                                </motion.span>
                              ) : (
                                <motion.span
                                  key="copy"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </button>
                        </motion.div>

                        {/* CTAs */}
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.48 }}
                          className="space-y-2.5"
                        >
                          <Link
                            href="/admin"
                            className="group flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all"
                            style={{ background: grad }}
                          >
                            <Sparkles className="w-4 h-4 opacity-90" />
                            Go to Admin Dashboard
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                          <Link
                            href="/admin/hr/employees"
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-medium text-sm text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all"
                          >
                            <Users className="w-4 h-4" />
                            Invite staff & team members
                          </Link>
                        </motion.div>

                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                          className="text-center text-xs text-slate-400 mt-4"
                        >
                          A welcome email is on its way &middot;{' '}
                          <Link href="/docs" className="underline underline-offset-2 hover:text-slate-600 transition-colors">
                            View setup guide
                          </Link>
                        </motion.p>
                      </div>

                      {/* Right — Auto-redirect */}
                      <div className="lg:col-span-2 px-8 py-10 bg-slate-50/50 flex flex-col">
                        {!redirectCancelled ? (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-col items-center text-center"
                          >
                            <div className="relative w-28 h-28 mb-5">
                              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                                <circle cx="56" cy="56" r="48" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                                <motion.circle
                                  cx="56" cy="56" r="48"
                                  fill="none"
                                  stroke={colorA}
                                  strokeWidth="6"
                                  strokeLinecap="round"
                                  strokeDasharray={`${2 * Math.PI * 48}`}
                                  animate={{ strokeDashoffset: (1 - countdown / REDIRECT_COUNTDOWN) * 2 * Math.PI * 48 }}
                                  transition={{ duration: 0.9, ease: 'linear' }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <motion.span
                                  key={countdown}
                                  initial={{ scale: 1.3, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.25 }}
                                  className="text-4xl font-black tabular-nums"
                                  style={{ color: colorA }}
                                >
                                  {countdown}
                                </motion.span>
                                <span className="text-[10px] text-slate-400 font-medium mt-0.5">seconds</span>
                              </div>
                            </div>

                            <p className="text-sm font-bold text-slate-700 mb-1">Redirecting to your dashboard</p>
                            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                              You'll be taken to your admin panel automatically.
                            </p>
                            <button
                              onClick={() => setRedirectCancelled(true)}
                              className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
                            >
                              Cancel redirect
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center text-center"
                          >
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
                              <CheckCircle2 className="w-7 h-7 text-slate-400" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700 mb-1">Ready when you are</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Click the button on the left to go to your dashboard.
                            </p>
                          </motion.div>
                        )}

                        {/* Summary */}
                        <div className="mt-auto pt-8">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Setup summary</p>
                          <div className="space-y-2.5">
                            {[
                              { label: '10 / 10 steps', value: 'completed' },
                              { label: 'Trial period',   value: '14 days free' },
                              { label: 'Next billing',   value: 'After trial' },
                            ].map(row => (
                              <div key={row.label} className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">{row.label}</span>
                                <span className="text-xs font-semibold text-slate-700">{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </>
  )
}

export default function DeployPage() {
  return <DeployInner />
}
