'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Check, Copy, ArrowRight, Users, XCircle,
  Sparkles, Globe, Shield, Zap, BookOpen,
  CreditCard, Palette, Bell, Settings, CheckCircle2,
} from 'lucide-react'

/* ─── Colors (swapped per school from sessionStorage) ────── */
const DEFAULT_COLOR_A = '#10B981'
const DEFAULT_COLOR_B = '#2563EB'

/* ─── Steps ─────────────────────────────────────────────── */
const DEPLOY_STEPS = [
  { id: 1,  label: 'Account created',                delay: 0,    icon: Shield     },
  { id: 2,  label: 'School profile saved',           delay: 900,  icon: BookOpen   },
  { id: 3,  label: 'Provisioning workspace',         delay: 1900, icon: Settings   },
  { id: 4,  label: 'Configuring subdomain',          delay: 3100, icon: Globe,      isDynamic: true },
  { id: 5,  label: 'Roles & permissions',            delay: 4100, icon: Shield     },
  { id: 6,  label: 'Academic modules',               delay: 5000, icon: BookOpen   },
  { id: 7,  label: 'Payment gateway',                delay: 5800, icon: CreditCard },
  { id: 8,  label: 'School branding',                delay: 6600, icon: Palette    },
  { id: 9,  label: 'Welcome notification',           delay: 7400, icon: Bell       },
  { id: 10, label: 'Finalising setup',               delay: 8200, icon: Zap        },
]
const TOTAL_DURATION = 9200

/* ─── Particle (client-only) ────────────────────────────── */
interface ParticleDatum { x: string; y: string; s: number; t: number; dl: number; color: string }

function Particles({ colorA, colorB }: { colorA: string; colorB: string }) {
  const [pts, setPts] = useState<ParticleDatum[]>([])
  useEffect(() => {
    setPts(Array.from({ length: 14 }, () => ({
      x:     `${Math.random() * 100}%`,
      y:     `${Math.random() * 100}%`,
      s:     3 + Math.random() * 5,
      t:     6 + Math.random() * 8,
      dl:    Math.random() * 5,
      color: Math.random() > 0.5 ? colorA : colorB,
    })))
  }, [colorA, colorB])
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pts.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ left: p.x, top: p.y, width: p.s, height: p.s, backgroundColor: p.color, opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0], scale: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: p.t, delay: p.dl, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
/* ─── Promo slides ──────────────────────────────────────── */
const PROMO_SLIDES = [
  {
    type: 'feature',
    badge: 'Built-in',
    logo: '🎥',
    title: 'Live classes — no Zoom needed',
    body: 'Host video lessons, breakout rooms, whiteboards and auto-recorded replays directly inside Tera SM.',
    cta: null,
  },
  {
    type: 'feature',
    badge: 'AI-powered',
    logo: '🤖',
    title: 'AI academic advisor included',
    body: 'Students get 24/7 course recommendations, essay feedback, and an early-warning system that flags at-risk learners.',
    cta: null,
  },
  {
    type: 'feature',
    badge: 'Finance',
    logo: '💳',
    title: 'Collect fees online in minutes',
    body: 'Paystack, Flutterwave & Stripe built in. Students pay by card, bank transfer or mobile money from their portal.',
    cta: null,
  },
  {
    type: 'sponsored',
    badge: 'Sponsored',
    logo: '🏦',
    title: 'School banking made simple',
    body: 'Open a dedicated school account, manage salaries and vendor payments — all in one place.',
    cta: { label: 'Learn more', href: '#' },
  },
  {
    type: 'feature',
    badge: 'Coming soon',
    logo: '📱',
    title: 'Branded mobile app for your school',
    body: 'Your own iOS & Android app with your logo and colours — available as an add-on on any plan.',
    cta: null,
  },
]

function PromoCarousel() {
  const [index, setIndex] = useState(0)
  const [dir,   setDir]   = useState(1)

  useEffect(() => {
    const t = setInterval(() => {
      setDir(1)
      setIndex(i => (i + 1) % PROMO_SLIDES.length)
    }, 3500)
    return () => clearInterval(t)
  }, [])

  const slide = PROMO_SLIDES[index]
  const isSponsored = slide.type === 'sponsored'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="mt-4 relative"
    >
      {/* Card */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-md shadow-slate-200/50 overflow-hidden">

        {/* Top strip */}
        <div className="flex items-center justify-between px-5 pt-4 pb-0">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
            isSponsored
              ? 'bg-amber-50 text-amber-500 border border-amber-200'
              : 'bg-slate-100 text-slate-400'
          }`}>
            {slide.badge}
          </span>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {PROMO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDir(i > index ? 1 : -1); setIndex(i) }}
                className="rounded-full transition-all duration-300"
                style={{
                  width:  i === index ? 16 : 6,
                  height: 6,
                  background: i === index ? '#334155' : '#e2e8f0',
                }}
              />
            ))}
          </div>
        </div>

        {/* Slide content */}
        <div className="relative overflow-hidden" style={{ minHeight: 88 }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={index}
              custom={dir}
              initial={{ opacity: 0, x: dir * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="px-5 pt-3 pb-5 flex items-start gap-4"
            >
              <div className="text-2xl flex-shrink-0 mt-0.5">{slide.logo}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 mb-1 leading-snug">{slide.title}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{slide.body}</p>
                {slide.cta && (
                  <a
                    href={slide.cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    {slide.cta.label} <ArrowRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress bar at bottom of card */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 rounded-b-2xl overflow-hidden">
        <motion.div
          className="h-full bg-slate-300 rounded-full"
          key={index}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 3.5, ease: 'linear' }}
        />
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
function DeployInner() {
  const [schoolName, setSchoolName] = useState('Greenfield Academy')
  const [subdomain,  setSubdomain]  = useState('greenfield')
  const [colorA,     setColorA]     = useState(DEFAULT_COLOR_A)
  const [colorB]                    = useState(DEFAULT_COLOR_B)
  const [logo,       setLogo]       = useState('')
  const [formData,   setFormData]   = useState<Record<string, unknown> | null>(null)

  const [completed,  setCompleted]  = useState<number[]>([])
  const [done,       setDone]       = useState(false)
  const [copied,     setCopied]     = useState(false)
  const [apiError,   setApiError]   = useState('')
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

  /* Provision */
  useEffect(() => {
    if (!formData || apiCalled.current) return
    apiCalled.current = true
    ;(async () => {
      try {
        const res  = await fetch('/api/auth/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (!res.ok) setApiError(data.error ?? 'Provisioning failed.')
      } catch { setApiError('Network error during provisioning.') }
    })()
  }, [formData])

  /* Step timers */
  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = []
    DEPLOY_STEPS.forEach(s => t.push(setTimeout(() => setCompleted(p => [...p, s.id]), s.delay)))
    t.push(setTimeout(() => setDone(true), TOTAL_DURATION))
    return () => t.forEach(clearTimeout)
  }, [])

  const dashUrl     = `https://${subdomain}.terasms.com`
  const progress    = Math.round((completed.length / DEPLOY_STEPS.length) * 100)
  const activeStep  = DEPLOY_STEPS.find(s => !completed.includes(s.id))
  const activeLabel = activeStep
    ? (activeStep.isDynamic ? `Configuring ${subdomain}.terasms.com` : activeStep.label)
    : 'Finalising…'

  const initials = schoolName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const copyUrl  = () => { navigator.clipboard.writeText(dashUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const grad     = `linear-gradient(135deg, ${colorA}, ${colorB})`
  const gradSoft = `linear-gradient(135deg, ${colorA}18, ${colorB}18)`

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #f0f4ff 0%, #fafcff 50%, #f0faf5 100%)' }}
    >
      {/* Soft background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[700px] h-[700px] rounded-full -top-48 -left-48"
          style={{ background: `radial-gradient(circle, ${colorA}18 0%, transparent 65%)` }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full -bottom-32 -right-32"
          style={{ background: `radial-gradient(circle, ${colorB}14 0%, transparent 65%)` }}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 8, delay: 1.5, ease: 'easeInOut' }}
        />
      </div>

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #94a3b820 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <Particles colorA={colorA} colorB={colorB} />

      {/* Top logo */}
      <div className="absolute top-7 left-7 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: grad }}>
          <span className="text-white font-black text-sm">T</span>
        </div>
        <span className="text-slate-400 font-semibold text-sm">Tera SM</span>
      </div>

      {/* Status pill */}
      <div className="absolute top-7 right-7 flex items-center gap-1.5 bg-white/70 border border-slate-200 rounded-full px-3 py-1.5 shadow-sm backdrop-blur-sm">
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

      {/* ── Card ── */}
      <div className="w-full max-w-xl relative z-10">
        <AnimatePresence mode="wait">

          {/* ══ DEPLOYING ══ */}
          {!done && (
            <motion.div
              key="deploying"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/60 border border-white/80 overflow-hidden"
            >
              {/* Header band */}
              <div className="px-8 pt-8 pb-7 border-b border-slate-100">
                <div className="flex items-center gap-5">
                  {/* Monochrome school avatar */}
                  <div className="relative flex-shrink-0">
                    <motion.div
                      className="absolute -inset-1.5 rounded-2xl"
                      style={{ background: grad, filter: 'blur(10px)', opacity: 0.35 }}
                      animate={{ opacity: [0.25, 0.5, 0.25] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                    />
                    <div
                      className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg overflow-hidden shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}
                    >
                      {logo
                        ? <img src={logo} alt="logo" className="w-10 h-10 object-contain brightness-0 invert" />
                        : <span className="tracking-tight">{initials}</span>
                      }
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-slate-800 truncate">{schoolName}</h1>
                    <p className="text-sm text-slate-400 font-mono mt-0.5">{subdomain}.terasms.com</p>
                  </div>

                  {/* Percentage counter */}
                  <div className="flex-shrink-0 text-right">
                    <motion.p
                      className="text-4xl font-black leading-none"
                      style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                    >
                      {progress}
                    </motion.p>
                    <p className="text-xs text-slate-400 font-medium mt-1">percent</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-8 py-7 space-y-7">

                {/* ── Horizontal progress bar ── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-0.5">
                    <span>Setting up your system</span>
                    <span>{completed.length} / {DEPLOY_STEPS.length} steps</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full relative overflow-hidden"
                      style={{ background: grad }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.div
                        className="absolute inset-y-0 right-0 w-16"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55))' }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* ── Horizontal step timeline ── */}
                <div className="relative pt-2 pb-1">
                  {/* Track line */}
                  <div className="absolute top-6 left-4 right-4 h-px bg-slate-100" />
                  {/* Filled line */}
                  <motion.div
                    className="absolute top-6 left-4 h-px"
                    style={{ background: grad }}
                    animate={{ width: progress > 0 ? `calc(${progress}% - 2rem)` : '0%' }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />

                  <div className="relative flex items-start justify-between">
                    {DEPLOY_STEPS.map(s => {
                      const isDone   = completed.includes(s.id)
                      const isActive = activeStep?.id === s.id
                      const Icon     = s.icon
                      return (
                        <div key={s.id} className="flex flex-col items-center gap-2" style={{ width: '10%' }}>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 relative"
                            style={{
                              background: isDone
                                ? grad
                                : isActive
                                  ? '#fff'
                                  : '#f8fafc',
                              border: isDone
                                ? 'none'
                                : isActive
                                  ? `2px solid ${colorA}`
                                  : '1.5px solid #e2e8f0',
                              boxShadow: isActive
                                ? `0 0 0 4px ${colorA}18, 0 4px 12px ${colorA}30`
                                : isDone
                                  ? `0 2px 8px ${colorA}30`
                                  : 'none',
                            }}
                          >
                            {/* Active pulse ring */}
                            {isActive && (
                              <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{ border: `2px solid ${colorA}` }}
                                animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
                                transition={{ repeat: Infinity, duration: 1.3 }}
                              />
                            )}
                            {isDone
                              ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
                                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                </motion.div>
                              : <Icon
                                  className="w-3.5 h-3.5 transition-all"
                                  style={{ color: isActive ? colorA : '#cbd5e1' }}
                                  strokeWidth={2}
                                />
                            }
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Active step label */}
                <div
                  className="flex items-center gap-3 rounded-2xl px-5 py-4 border"
                  style={{ background: gradSoft, borderColor: `${colorA}25` }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: grad }}
                  >
                    {activeStep
                      ? <activeStep.icon className="w-4 h-4 text-white" strokeWidth={2} />
                      : <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">
                      {activeStep ? 'Currently running' : 'Completed'}
                    </p>
                    <p className="text-sm font-semibold text-slate-700">{activeLabel}</p>
                  </div>
                  <motion.div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colorA }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                </div>

                <p className="text-center text-xs text-slate-300 pb-1">Please keep this window open</p>
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
              className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/60 border border-white/80 overflow-hidden"
            >
              {apiError ? (
                <div className="p-10 text-center space-y-5">
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
                <>
                  {/* Success header */}
                  <div
                    className="relative px-10 pt-10 pb-9 text-center overflow-hidden"
                    style={{ background: `linear-gradient(160deg, ${colorA}12, ${colorB}10)` }}
                  >
                    {/* Burst rings */}
                    <div className="relative inline-block mb-6">
                      {[1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 rounded-3xl"
                          style={{ border: `1.5px solid ${colorA}40` }}
                          initial={{ scale: 1, opacity: 0.7 }}
                          animate={{ scale: 1 + i * 0.45, opacity: 0 }}
                          transition={{ duration: 2, delay: i * 0.2, ease: 'easeOut' }}
                        />
                      ))}
                      <motion.div
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
                        className="relative w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg"
                        style={{ background: grad, boxShadow: `0 16px 48px ${colorA}40` }}
                      >
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                      <h1 className="text-2xl font-black text-slate-800 mb-2">{schoolName} is live!</h1>
                      <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
                        Your school management system has been provisioned successfully. Welcome aboard.
                      </p>
                    </motion.div>

                    {/* Live badge */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.45 }}
                      className="inline-flex items-center gap-2 mt-5 rounded-full px-3.5 py-1.5 border"
                      style={{ background: `${colorA}12`, borderColor: `${colorA}30` }}
                    >
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: colorA }}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                      <span className="text-xs font-semibold" style={{ color: colorA }}>System active</span>
                    </motion.div>
                  </div>

                  {/* Body */}
                  <div className="px-8 py-7 space-y-4">
                    {/* Stats */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="grid grid-cols-3 gap-3"
                    >
                      {[
                        { label: 'Modules ready', value: '11' },
                        { label: 'Status',         value: 'Trial' },
                        { label: 'Uptime SLA',     value: '99.9%' },
                      ].map(s => (
                        <div key={s.label} className="rounded-2xl py-4 px-3 text-center bg-slate-50 border border-slate-100">
                          <p className="font-black text-lg text-slate-800">{s.value}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </motion.div>

                    {/* URL row */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="flex items-center gap-3 rounded-2xl p-4 bg-slate-50 border border-slate-100"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: gradSoft }}>
                        <Globe className="w-4 h-4" style={{ color: colorA }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Dashboard URL</p>
                        <p className="text-sm font-mono text-slate-600 truncate">{dashUrl}</p>
                      </div>
                      <button
                        onClick={copyUrl}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all border flex-shrink-0"
                        style={{
                          background: copied ? `${colorA}12` : '#fff',
                          borderColor: copied ? `${colorA}30` : '#e2e8f0',
                        }}
                      >
                        {copied
                          ? <Check className="w-3.5 h-3.5" style={{ color: colorA }} strokeWidth={2.5} />
                          : <Copy className="w-3.5 h-3.5 text-slate-400" />
                        }
                      </button>
                    </motion.div>

                    {/* CTAs */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-2.5 pt-1"
                    >
                      <Link
                        href="/admin"
                        className="group flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all"
                        style={{ background: grad, boxShadow: `0 6px 24px ${colorA}35` }}
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
                      transition={{ delay: 0.65 }}
                      className="text-center text-xs text-slate-400 pt-1"
                    >
                      A welcome email is on its way &middot;{' '}
                      <Link href="/docs" className="underline underline-offset-2 hover:text-slate-600 transition-colors">
                        View setup guide
                      </Link>
                    </motion.p>
                  </div>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>

        {/* Promo carousel — only during deployment */}
        {!done && <PromoCarousel />}
      </div>
    </div>
  )
}

export default function DeployPage() {
  return <DeployInner />
}
