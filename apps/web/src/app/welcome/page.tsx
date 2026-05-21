'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  ArrowRight, CheckCircle2, Shield, Zap, HeartHandshake,
  BookOpen, LifeBuoy, AlertTriangle, Check,
} from 'lucide-react'

/* ─── Letter sections ───────────────────────────────────── */
const SECTIONS = [
  {
    id: 'welcome',
    icon: HeartHandshake,
    heading: 'Welcome to Tera SM',
    body: `On behalf of the entire Tera SM team, I want to personally welcome you and your institution to our platform. The fact that you're here means you've taken a bold step toward modernising how your school operates — and that matters enormously to us.

We built Tera SM because we believe every school, regardless of size or location, deserves world-class tools. Not patchwork software, not spreadsheets held together with formulas — but a complete, intelligent operating system built specifically for education.

Today, that system is yours.`,
  },
  {
    id: 'built',
    icon: Zap,
    heading: 'What we built for you',
    body: `Your workspace has been provisioned with everything you need to run your institution — academics, finance, HR, admissions, live classes, communication, and more — all in one place.

Over the coming days, explore at your own pace. Start with what matters most to you today: set up your academic calendar, add your first students, or invite your staff. The platform grows with you.`,
    bullets: [
      'Student & staff management with role-based access',
      'Online fee collection via Paystack, Flutterwave & Stripe',
      'Built-in video classes — no third-party tool required',
      'AI-powered advisor, grading assistant & early-warning system',
      'Custom branding — your logo, your colours, your domain',
    ],
  },
  {
    id: 'start',
    icon: BookOpen,
    heading: 'Getting started in 3 steps',
    steps: [
      { n: '01', title: 'Complete your school profile', desc: 'Add your academic calendar, departments, and grading system under Admin → Academics.' },
      { n: '02', title: 'Invite your staff & students', desc: 'Go to Admin → HR → Employees to add staff, or share your school registration link with students.' },
      { n: '03', title: 'Set up fees & payment', desc: 'Under Admin → Finance, configure your fee structures and connect your payment gateway.' },
    ],
  },
  {
    id: 'trial',
    icon: Shield,
    heading: 'Your 14-day free trial',
    body: `Your account is currently on a 14-day free trial — no credit card required, no automatic charges. At the end of your trial you will receive a reminder email with options to upgrade to a paid plan.

If you choose not to upgrade, your account will be downgraded to a read-only state and your data will be retained for 30 days before permanent deletion. You may export all your data at any time from Admin → Settings → Data Export.

Upgrading mid-trial retains all data and activates your chosen plan immediately.`,
  },
  {
    id: 'privacy',
    icon: Shield,
    heading: 'Data security & privacy',
    body: `Your institution's data is encrypted at rest and in transit. We do not sell, share, or monetise your data or your students' data in any way. Tera SM is compliant with GDPR principles and applicable data protection laws.

Each school's data is logically isolated — no other institution can access your records. You retain full ownership of all data you upload or create on the platform.

For a full breakdown of how we handle your data, please review our Privacy Policy and Data Processing Agreement at terasms.com/privacy.`,
  },
  {
    id: 'support',
    icon: LifeBuoy,
    heading: 'We are here for you',
    body: `Our support team is available to help you get the most out of Tera SM. During your trial, you have access to our help centre, onboarding documentation, and email support.

If you ever feel stuck, lost, or just want a guided walkthrough, reach out — we respond within 24 hours on all plans and within 8 hours on Enterprise and above.`,
    contact: [
      { label: 'Help centre', value: 'help.terasms.com' },
      { label: 'Email support', value: 'support@terasms.com' },
      { label: 'WhatsApp', value: '+1 (000) 000-0000' },
    ],
  },
  {
    id: 'disclaimer',
    icon: AlertTriangle,
    heading: 'Important notices',
    body: `By proceeding to your dashboard you confirm that you have read and understood the following:

The platform is provided "as is" during the trial period. While we maintain 99.9% uptime on paid plans, trial accounts are not covered by an SLA. We recommend not using trial accounts for live student examinations or critical financial transactions.

Tera SM reserves the right to modify features, pricing, and terms with 30 days' notice to registered account holders. Continued use of the platform after such notice constitutes acceptance of the updated terms.

All school administrators are responsible for ensuring that their use of the platform complies with applicable local laws, including student data protection regulations in their jurisdiction.`,
  },
]

/* ─── Fade-in wrapper ───────────────────────────────────── */
function FadeSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export default function WelcomePage() {
  const router  = useRouter()
  const { data: session } = useSession()
  const [agreed,      setAgreed]      = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [schoolName,  setSchoolName]  = useState('Your Institution')
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!session?.user?.tenantId) return
    fetch(`/api/tenants/current`)
      .then(r => r.json())
      .then(d => { if (d.name) setSchoolName(d.name) })
      .catch(() => {/* use default */})
  }, [session?.user?.tenantId])

  const handleEnter = async () => {
    if (!agreed) return
    setLoading(true)
    try {
      await fetch('/api/onboarding/complete', { method: 'POST' })
    } catch { /* proceed anyway */ }
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xs">T</span>
          </div>
          <span className="text-slate-700 font-semibold text-sm">Tera SM</span>
        </div>
        <span className="text-xs text-slate-400">Welcome letter · {today}</span>
      </div>

      {/* Page */}
      <div className="max-w-2xl mx-auto px-6 py-14 pb-40">

        {/* Letterhead */}
        <FadeSection>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            {/* Header band */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
                    <span className="text-white font-black text-sm">T</span>
                  </div>
                  <span className="text-white font-bold text-base">Tera SM</span>
                </div>
                <p className="text-slate-400 text-xs">Office of the Chief Executive Officer</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs">{today}</p>
                <p className="text-slate-500 text-xs mt-0.5">Ref: WELCOME-2026</p>
              </div>
            </div>

            {/* Addressed to */}
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">To</p>
              <p className="text-slate-700 font-semibold text-sm">The Administrator & Team</p>
              <p className="text-slate-500 text-sm">{schoolName}</p>
            </div>

            {/* Subject */}
            <div className="px-8 py-4 border-b border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Re</p>
              <p className="text-slate-800 font-bold text-sm">Welcome to Tera SM — Your School Management System is Ready</p>
            </div>
          </div>
        </FadeSection>

        {/* Letter sections */}
        <div className="space-y-6">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon
            return (
              <FadeSection key={s.id} delay={i * 0.05}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Section heading */}
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                    <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-slate-600" strokeWidth={2} />
                    </div>
                    <h2 className="text-sm font-bold text-slate-800">{s.heading}</h2>
                  </div>

                  <div className="px-6 py-5 space-y-4">
                    {/* Body text */}
                    {'body' in s && s.body && (
                      <div className="space-y-3">
                        {s.body.split('\n\n').map((para, pi) => (
                          <p key={pi} className="text-sm text-slate-600 leading-relaxed">{para}</p>
                        ))}
                      </div>
                    )}

                    {/* Bullet list */}
                    {'bullets' in s && s.bullets && (
                      <ul className="space-y-2">
                        {s.bullets.map((b, bi) => (
                          <li key={bi} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                            <span className="text-sm text-slate-600">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Numbered steps */}
                    {'steps' in s && s.steps && (
                      <div className="space-y-3">
                        {s.steps.map((step) => (
                          <div key={step.n} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-xl font-black text-slate-200 leading-none flex-shrink-0 font-mono">{step.n}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-700 mb-0.5">{step.title}</p>
                              <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Contact list */}
                    {'contact' in s && s.contact && (
                      <div className="grid grid-cols-3 gap-3 mt-1">
                        {s.contact.map((c) => (
                          <div key={c.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">{c.label}</p>
                            <p className="text-xs text-slate-600 font-medium">{c.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </FadeSection>
            )
          })}

          {/* Closing & Signature */}
          <FadeSection delay={0.3}>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-7">
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                We are genuinely excited to have you on board. This platform was built with schools like yours in mind, and every feature you'll discover was designed with care, purpose, and the needs of real educators and administrators.

                If there is anything we can do to make your experience better, we want to hear from you. Your feedback shapes what we build next.
              </p>

              <p className="text-sm text-slate-600 mb-6">With respect and excitement,</p>

              {/* Signature block */}
              <div className="flex items-end gap-5 pb-6 border-b border-slate-100">
                {/* Avatar placeholder */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white font-black text-lg">BT</span>
                </div>
                <div>
                  {/* Handwriting-style signature */}
                  <p
                    className="text-2xl text-slate-800 mb-1"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', letterSpacing: '-0.02em' }}
                  >
                    Bejumeh Tembong 
                  </p>
                  <p className="text-xs font-semibold text-slate-600">Chief Executive Officer</p>
                  <p className="text-xs text-slate-400">Tera SM · terasms.com</p>
                </div>
              </div>

              {/* Disclaimer footer */}
              <p className="text-xs text-slate-400 leading-relaxed pt-5">
                This letter is auto-generated on account activation and is intended for the primary account administrator. It does not constitute a legal contract. For full terms please visit{' '}
                <a href="/terms" className="underline hover:text-slate-600 transition-colors">terasms.com/terms</a>.
              </p>
            </div>
          </FadeSection>
        </div>
      </div>

      {/* ── Sticky action bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          {/* Checkbox */}
          <button
            onClick={() => setAgreed(a => !a)}
            className="flex items-start gap-3 flex-1 text-left"
          >
            <div
              className="w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
              style={{
                borderColor: agreed ? '#2563EB' : '#cbd5e1',
                background:  agreed ? '#2563EB' : '#fff',
              }}
            >
              {agreed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              I have read and understood this letter, including the trial terms, data privacy notice, and disclaimers.
            </p>
          </button>

          {/* CTA */}
          <motion.button
            onClick={handleEnter}
            disabled={!agreed || loading}
            whileTap={agreed ? { scale: 0.97 } : {}}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white flex-shrink-0 transition-all"
            style={{
              background: agreed ? 'linear-gradient(135deg, #1d4ed8, #2563EB)' : '#e2e8f0',
              color: agreed ? '#fff' : '#94a3b8',
              boxShadow: agreed ? '0 4px 20px rgba(37,99,235,0.35)' : 'none',
              cursor: agreed ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Loading…' : 'Enter my dashboard'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
