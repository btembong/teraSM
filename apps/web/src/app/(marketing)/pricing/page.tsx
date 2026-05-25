'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Zap, ArrowRight, ChevronDown, Server, Database, Globe, Mail, Video, Brain, MessageSquare, Shield } from 'lucide-react'

/* ─── Tiers ──────────────────────────────────────── */
const TIERS = [
  {
    name: 'Starter',
    desc: 'Core modules for small schools and primary/secondary institutions.',
    monthly: 89,
    annual: 75,
    students: '500 students',
    admins: '5 admin seats',
    storage: '10 GB storage',
    tier: 'starter',
    cta: 'Start free trial',
    href: '/register',
    popular: false,
    infraCost: 22,
    highlight: [],
  },
  {
    name: 'Pro',
    desc: 'Everything growing colleges and institutions need — LMS, HR, live classes.',
    monthly: 229,
    annual: 194,
    students: '3,000 students',
    admins: '20 admin seats',
    storage: '100 GB storage',
    tier: 'pro',
    cta: 'Start free trial',
    href: '/register',
    popular: true,
    infraCost: 65,
    highlight: ['Full LMS & live classes', 'HR & payroll', 'Parent portal'],
  },
  {
    name: 'Enterprise',
    desc: 'For large schools and multi-campus institutions with AI and full API access.',
    monthly: 599,
    annual: 509,
    students: '10,000 students',
    admins: 'Unlimited seats',
    storage: '500 GB storage',
    tier: 'enterprise',
    cta: 'Start free trial',
    href: '/register',
    popular: false,
    infraCost: 165,
    highlight: ['AI advisor & chatbot', 'Advanced analytics', 'Full API access'],
  },
  {
    name: 'University',
    desc: 'Unlimited scale, dedicated infrastructure, and a committed account team.',
    monthly: null,
    annual: null,
    students: 'Unlimited students',
    admins: 'Unlimited seats',
    storage: 'Unlimited storage',
    tier: 'university',
    cta: 'Contact sales',
    href: '/contact',
    popular: false,
    infraCost: 400,
    highlight: ['Dedicated infrastructure', 'On-premise option', '24/7 phone support'],
  },
]

/* ─── Features ───────────────────────────────────── */
const FEATURE_SECTIONS = [
  {
    label: 'Core academics',
    features: [
      { label: 'Student management',           starter: true,  pro: true,  enterprise: true,  university: true  },
      { label: 'Academics & timetable',        starter: true,  pro: true,  enterprise: true,  university: true  },
      { label: 'Attendance tracking',          starter: true,  pro: true,  enterprise: true,  university: true  },
      { label: 'Results & transcripts',        starter: true,  pro: true,  enterprise: true,  university: true  },
      { label: 'Basic finance & invoicing',    starter: true,  pro: true,  enterprise: true,  university: true  },
      { label: 'Student portal',               starter: true,  pro: true,  enterprise: true,  university: true  },
      { label: 'Email notifications',          starter: true,  pro: true,  enterprise: true,  university: true  },
      { label: 'Standard reports (PDF/Excel)', starter: true,  pro: true,  enterprise: true,  university: true  },
    ],
  },
  {
    label: 'LMS & Teaching',
    features: [
      { label: 'Full LMS (content, assignments)', starter: false, pro: true,  enterprise: true,  university: true  },
      { label: 'Built-in live classes',           starter: false, pro: true,  enterprise: true,  university: true  },
      { label: 'HR & payroll',                    starter: false, pro: true,  enterprise: true,  university: true  },
      { label: 'Parent portal',                   starter: false, pro: true,  enterprise: true,  university: true  },
      { label: 'Student life & clubs',            starter: false, pro: true,  enterprise: true,  university: true  },
      { label: 'SMS & WhatsApp notifications',    starter: false, pro: true,  enterprise: true,  university: true  },
      { label: 'Push notifications',              starter: false, pro: true,  enterprise: true,  university: true  },
      { label: 'Digital e-library',               starter: false, pro: true,  enterprise: true,  university: true  },
      { label: 'Elections & voting',              starter: false, pro: true,  enterprise: true,  university: true  },
      { label: 'Custom branding & domain',        starter: false, pro: true,  enterprise: true,  university: true  },
    ],
  },
  {
    label: 'AI & Advanced',
    features: [
      { label: 'REST API access',          starter: false, pro: false, enterprise: true,  university: true  },
      { label: 'AI advisor & chatbot',     starter: false, pro: false, enterprise: true,  university: true  },
      { label: 'Advanced analytics',       starter: false, pro: false, enterprise: true,  university: true  },
      { label: 'Career center & alumni',   starter: false, pro: false, enterprise: true,  university: true  },
      { label: 'Online proctored exams',   starter: false, pro: false, enterprise: true,  university: true  },
      { label: 'Multi-language support',   starter: false, pro: false, enterprise: true,  university: true  },
    ],
  },
  {
    label: 'University tier',
    features: [
      { label: 'Thesis & dissertation portal',  starter: false, pro: false, enterprise: false, university: true  },
      { label: 'Multi-campus management',        starter: false, pro: false, enterprise: false, university: true  },
      { label: 'Dedicated infrastructure',       starter: false, pro: false, enterprise: false, university: true  },
      { label: 'On-premise deployment',          starter: false, pro: false, enterprise: false, university: true  },
      { label: '24/7 phone & Slack support',     starter: false, pro: false, enterprise: false, university: true  },
    ],
  },
]

/* ─── Infrastructure breakdown ───────────────────── */
const INFRA = [
  { icon: Globe,         label: 'Frontend hosting',    detail: 'Vercel — global CDN, edge functions',          cost: '$20' },
  { icon: Database,      label: 'PostgreSQL database', detail: 'Neon — serverless, auto-scaling, backups',     cost: '$69' },
  { icon: Server,        label: 'Backend API',         detail: 'Railway — NestJS, always-on, auto-scaling',    cost: '$60' },
  { icon: Server,        label: 'Redis cache & queue', detail: 'Upstash — drip emails, rate limiting',         cost: '$20' },
  { icon: Globe,         label: 'File storage (R2)',   detail: 'Cloudflare — uploads, LMS content, photos',    cost: '$25' },
  { icon: Mail,          label: 'Email delivery',      detail: 'Resend — transactional + drip (50k/mo)',        cost: '$20' },
  { icon: Video,         label: 'Live classes',        detail: 'LiveKit — WebRTC video, recording, rooms',     cost: '$100' },
  { icon: Brain,         label: 'AI (Claude API)',     detail: 'Anthropic — advisor, essay feedback, chatbot', cost: '$80' },
  { icon: MessageSquare, label: 'SMS notifications',   detail: "Africa's Talking — student/parent alerts",     cost: '$30' },
  { icon: Shield,        label: 'Domain & monitoring', detail: 'terasms.com, Sentry, logging',                 cost: '$10' },
]

/* ─── Add-ons ────────────────────────────────────── */
const ADDONS = [
  { name: 'Extra Storage',       desc: '+100 GB per billing cycle',                      price: '$9/mo'      },
  { name: 'SMS Credits Pack',    desc: '1,000 SMS credits',                               price: '$12'        },
  { name: 'Extra Admin Seats',   desc: 'Additional admin/staff seats beyond plan limit',  price: '$5/seat/mo' },
  { name: 'Branded Mobile App',  desc: 'School-branded iOS & Android app',                price: 'Custom'     },
  { name: 'Priority Onboarding', desc: 'Dedicated setup specialist for 30 days',          price: '$199'       },
  { name: 'Proctored Exams',     desc: 'Pay-per-exam online proctoring',                  price: '$2/exam'    },
]

/* ─── FAQ ────────────────────────────────────────── */
const FAQS = [
  { q: 'Is there a free trial?',                              a: 'Yes — Starter and Pro plans include a 14-day free trial. No credit card required.' },
  { q: 'Can I upgrade or downgrade at any time?',            a: 'Yes. Upgrades take effect immediately and are pro-rated. Downgrades take effect at the next billing cycle.' },
  { q: 'What happens to my data if I cancel?',               a: 'Your data is retained for 30 days after cancellation. You can export everything via Admin → Settings → Data Export at any time.' },
  { q: 'How is student count measured?',                     a: 'Only active (enrolled) students count toward your limit. Alumni, suspended and archived accounts are not counted.' },
  { q: 'Do you offer discounts for NGOs or government schools?', a: 'Yes — contact our sales team for non-profit and government pricing.' },
  { q: "Is my school's data isolated from other schools?",   a: 'Yes. Every school is a separate tenant with fully isolated data, enforced by row-level security in the database.' },
  { q: 'Why are your prices lower than competitors?',        a: 'We built on modern serverless infrastructure (Neon, Vercel, Cloudflare R2) which costs significantly less than legacy cloud setups. We pass those savings on while maintaining healthy margins to sustain the product long-term.' },
]

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border-b transition-colors ${open ? 'border-blue-100 dark:border-blue-900' : 'border-gray-100 dark:border-gray-800'}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-start justify-between py-5 text-left gap-4 group">
        <span className={`font-semibold text-sm leading-snug transition-colors ${open ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
          {q}
        </span>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${open ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && <div className="pb-5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed pr-10">{a}</div>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════ */
export default function PricingPage() {
  const [annual, setAnnual] = useState(true)

  const totalInfra = INFRA.reduce((sum, i) => sum + parseInt(i.cost.replace('$', '')), 0)

  return (
    <div className="bg-white dark:bg-gray-950">

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-14 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-blue-100 dark:border-blue-900">
          <Zap className="w-3.5 h-3.5" /> 14-day free trial · No credit card required
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-8">
          One platform for your entire institution. Pick the plan that fits — upgrade anytime as you grow.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${!annual ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${annual ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Annual
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-bold">Save 15%</span>
          </button>
        </div>
      </section>

      {/* Plan cards */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-4 gap-5 items-start">
          {TIERS.map(tier => {
            const price = annual ? tier.annual : tier.monthly
            const isPopular = tier.popular

            return (
              <div
                key={tier.name}
                className={`relative rounded-3xl p-6 flex flex-col transition-all ${
                  isPopular
                    ? 'bg-blue-600 shadow-2xl shadow-blue-200 dark:shadow-blue-900/50 -translate-y-3 ring-0'
                    : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full shadow-md">Most Popular</span>
                  </div>
                )}

                {/* Badge + desc */}
                <div className="mb-5">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isPopular ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}>{tier.name}</span>
                  <p className={`text-sm mt-3 leading-relaxed ${isPopular ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{tier.desc}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {price !== null ? (
                    <>
                      <div className="flex items-end gap-1">
                        <span className={`text-4xl font-bold ${isPopular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>${price}</span>
                        <span className={`text-sm mb-1.5 ${isPopular ? 'text-blue-200' : 'text-gray-400'}`}>/mo</span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isPopular ? 'text-blue-200' : 'text-gray-400'}`}>
                        {annual ? `Billed annually · $${price * 12}/yr` : `or $${tier.annual}/mo billed annually`}
                      </p>
                    </>
                  ) : (
                    <div className={`text-2xl font-bold ${isPopular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>Custom pricing</div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {[tier.students, tier.admins, tier.storage, ...tier.highlight].map(item => (
                    <li key={item} className={`flex items-center gap-2 text-sm ${isPopular ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      <Check className={`w-4 h-4 flex-shrink-0 ${isPopular ? 'text-white' : 'text-blue-500'}`} strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={tier.href}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm transition-all ${
                    isPopular
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {tier.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )
          })}
        </div>

        {!annual && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8">
            Switch to annual billing and save up to <strong className="text-gray-600 dark:text-gray-300">$1,080/year</strong> on the Enterprise plan.
          </p>
        )}
      </section>

      {/* Infrastructure cost transparency */}
      <section className="bg-gray-950 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">Transparent pricing</span>
            <h2 className="text-2xl font-bold text-white mb-3">Where your money goes</h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xl mx-auto">
              We believe in full transparency. Here is exactly what we spend to run Tera SM for 10,000 students — and what we keep to build, maintain, and support the platform.
            </p>
          </div>

          <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden mb-6">
            <div className="grid grid-cols-3 bg-gray-800/60 border-b border-gray-700 px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Service</p>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">What it powers</p>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 text-right">Monthly cost</p>
            </div>
            {INFRA.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className={`grid grid-cols-3 items-center px-5 py-4 border-b border-gray-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-gray-400" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-semibold text-gray-200">{item.label}</p>
                  </div>
                  <p className="text-xs text-gray-500">{item.detail}</p>
                  <p className="text-sm font-bold text-gray-200 text-right">{item.cost}</p>
                </div>
              )
            })}
            <div className="grid grid-cols-3 items-center px-5 py-4 bg-gray-800/50 border-t-2 border-gray-700">
              <p className="text-sm font-bold text-white col-span-2">Total infrastructure (10k students)</p>
              <p className="text-lg font-bold text-white text-right">${totalInfra}<span className="text-sm font-normal text-gray-400">/mo</span></p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {TIERS.filter(t => t.monthly !== null).map(tier => {
              const revenue = annual ? tier.annual! : tier.monthly!
              const profit = revenue - tier.infraCost
              const margin = Math.round((profit / revenue) * 100)
              return (
                <div key={tier.name} className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-900/50 text-blue-300 mb-4 inline-block">{tier.name}</span>
                  <div className="space-y-3 mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Revenue per school</span>
                      <span className="font-bold text-white">${revenue}/mo</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Infrastructure cost</span>
                      <span className="font-bold text-red-400">−${tier.infraCost}/mo</span>
                    </div>
                    <div className="h-px bg-gray-700" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300 font-semibold">Gross profit</span>
                      <span className="font-bold text-blue-400">${profit}/mo</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${margin}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 text-right">{margin}% gross margin</p>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-center text-xs text-gray-600 mt-6">
            Infrastructure costs are shared across all tenants and scale efficiently. Per-school costs decrease as the platform grows.
          </p>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">Full feature comparison</h2>
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
            <div className="col-span-1 px-5 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Feature</div>
            {['Starter', 'Pro', 'Enterprise', 'University'].map(t => (
              <div key={t} className="px-3 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300">{t}</div>
            ))}
          </div>

          {FEATURE_SECTIONS.map((section) => (
            <div key={section.label}>
              {/* Section header */}
              <div className="grid grid-cols-5 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/50">
                <div className="col-span-5 px-5 py-2">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{section.label}</span>
                </div>
              </div>
              {section.features.map((f, i) => (
                <div key={i} className={`grid grid-cols-5 border-b border-gray-100 dark:border-gray-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-gray-800/20'}`}>
                  <div className="col-span-1 px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{f.label}</div>
                  {[f.starter, f.pro, f.enterprise, f.university].map((has, j) => (
                    <div key={j} className="flex items-center justify-center py-3">
                      {has
                        ? <Check className="w-4 h-4 text-blue-500 dark:text-blue-400" strokeWidth={2.5} />
                        : <X className="w-4 h-4 text-gray-200 dark:text-gray-700" />
                      }
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Add-ons */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">Add-ons</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-10">Available on all plans</p>
          <div className="grid md:grid-cols-3 gap-4">
            {ADDONS.map(a => (
              <div key={a.name} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{a.name}</p>
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-sm flex-shrink-0 ml-2">{a.price}</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">Frequently asked questions</h2>
        <div>
          {FAQS.map((faq, i) => <FaqRow key={i} q={faq.q} a={faq.a} />)}
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Still have questions?</p>
          <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            Talk to our team <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-blue-600 py-16 text-center px-6">
        <h2 className="text-3xl font-bold text-white mb-3">Ready to get started?</h2>
        <p className="text-blue-100 mb-8 text-sm">14-day free trial. No credit card. Cancel anytime.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/register" className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-2xl font-semibold text-sm transition-colors">
            Start Free Trial
          </Link>
          <Link href="/contact" className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl font-semibold text-sm transition-colors flex items-center gap-2">
            Book a Demo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  )
}
