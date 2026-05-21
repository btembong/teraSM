'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Zap, ArrowRight, HelpCircle } from 'lucide-react'

const TIERS = [
  {
    name: 'Starter',
    desc: 'Perfect for small schools and primary/secondary institutions.',
    monthly: 49,
    annual: 42,
    students: '500 students',
    admins: '5 admin seats',
    storage: '10 GB',
    color: 'gray',
    cta: 'Start free trial',
    href: '/register',
    popular: false,
  },
  {
    name: 'Pro',
    desc: 'Everything growing colleges and institutions need.',
    monthly: 149,
    annual: 127,
    students: '3,000 students',
    admins: '20 admin seats',
    storage: '100 GB',
    color: 'blue',
    cta: 'Start free trial',
    href: '/register',
    popular: true,
  },
  {
    name: 'Enterprise',
    desc: 'For large schools and multi-campus institutions.',
    monthly: 399,
    annual: 339,
    students: '10,000 students',
    admins: 'Unlimited seats',
    storage: '500 GB',
    color: 'purple',
    cta: 'Start free trial',
    href: '/register',
    popular: false,
  },
  {
    name: 'University',
    desc: 'Unlimited scale with dedicated infrastructure.',
    monthly: null,
    annual: null,
    students: 'Unlimited',
    admins: 'Unlimited seats',
    storage: 'Unlimited',
    color: 'amber',
    cta: 'Contact sales',
    href: '/contact',
    popular: false,
  },
]

const COLOR: Record<string, { ring: string; bg: string; text: string; badge: string; btn: string }> = {
  gray:   { ring: 'ring-gray-200 dark:ring-gray-700',    bg: 'bg-gray-50',    text: 'text-gray-700 dark:text-gray-300',    badge: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',    btn: 'bg-gray-900 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white' },
  blue:   { ring: 'ring-blue-500',                       bg: 'bg-blue-600',   text: 'text-blue-600 dark:text-blue-400',    badge: 'bg-blue-600 text-white',                                             btn: 'bg-blue-600 hover:bg-blue-700 text-white' },
  purple: { ring: 'ring-purple-400',                     bg: 'bg-purple-600', text: 'text-purple-600 dark:text-purple-400',badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400', btn: 'bg-purple-600 hover:bg-purple-700 text-white' },
  amber:  { ring: 'ring-amber-400',                      bg: 'bg-amber-500',  text: 'text-amber-600 dark:text-amber-400',  badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',   btn: 'bg-amber-500 hover:bg-amber-600 text-white' },
}

const FEATURES = [
  { label: 'Student management',              starter: true,  pro: true,  enterprise: true,  university: true  },
  { label: 'Academics & timetable',           starter: true,  pro: true,  enterprise: true,  university: true  },
  { label: 'Attendance tracking',             starter: true,  pro: true,  enterprise: true,  university: true  },
  { label: 'Results & transcripts',           starter: true,  pro: true,  enterprise: true,  university: true  },
  { label: 'Basic finance & invoicing',       starter: true,  pro: true,  enterprise: true,  university: true  },
  { label: 'Student portal',                  starter: true,  pro: true,  enterprise: true,  university: true  },
  { label: 'Email notifications',             starter: true,  pro: true,  enterprise: true,  university: true  },
  { label: 'Standard reports (PDF/Excel)',    starter: true,  pro: true,  enterprise: true,  university: true  },
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
  { label: 'REST API access',                 starter: false, pro: false, enterprise: true,  university: true  },
  { label: 'AI advisor & chatbot',            starter: false, pro: false, enterprise: true,  university: true  },
  { label: 'Advanced analytics',              starter: false, pro: false, enterprise: true,  university: true  },
  { label: 'Career center & alumni',          starter: false, pro: false, enterprise: true,  university: true  },
  { label: 'Online proctored exams',          starter: false, pro: false, enterprise: true,  university: true  },
  { label: 'Multi-language support',          starter: false, pro: false, enterprise: true,  university: true  },
  { label: 'Thesis & dissertation portal',    starter: false, pro: false, enterprise: false, university: true  },
  { label: 'Multi-campus management',         starter: false, pro: false, enterprise: false, university: true  },
  { label: 'Dedicated infrastructure',        starter: false, pro: false, enterprise: false, university: true  },
  { label: 'On-premise deployment',           starter: false, pro: false, enterprise: false, university: true  },
  { label: '24/7 phone & Slack support',      starter: false, pro: false, enterprise: false, university: true  },
]

const FAQS = [
  { q: 'Is there a free trial?', a: 'Yes — Starter and Pro plans include a 14-day free trial. No credit card required.' },
  { q: 'Can I upgrade or downgrade at any time?', a: 'Yes. Upgrades take effect immediately and are pro-rated. Downgrades take effect at the next billing cycle.' },
  { q: 'What happens to my data if I cancel?', a: 'Your data is retained for 30 days after cancellation. You can export everything via Admin → Settings → Data Export at any time.' },
  { q: 'How is student count measured?', a: 'Only active (enrolled) students count toward your limit. Alumni, suspended and archived accounts are not counted.' },
  { q: 'Do you offer discounts for NGOs or government schools?', a: 'Yes — contact our sales team for non-profit and government pricing.' },
  { q: "Is my school's data isolated from other schools?", a: 'Yes. Every school is a separate tenant with fully isolated data, enforced by row-level security in the database.' },
]

const ADDONS = [
  { name: 'Extra Storage',       desc: '+100 GB per billing cycle',                     price: '$9/mo'      },
  { name: 'SMS Credits Pack',    desc: '1,000 SMS credits',                              price: '$12'        },
  { name: 'Extra Admin Seats',   desc: 'Additional admin/staff seats beyond plan limit', price: '$5/seat/mo' },
  { name: 'Branded Mobile App',  desc: 'School-branded iOS & Android app',               price: 'Custom'     },
  { name: 'Priority Onboarding', desc: 'Dedicated setup specialist for 30 days',         price: '$199'       },
  { name: 'Proctored Exams',     desc: 'Pay-per-exam online proctoring',                 price: '$2/exam'    },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="bg-white dark:bg-gray-950">

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-14 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Zap className="w-3.5 h-3.5" /> 14-day free trial · No credit card required
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-8">
          One platform for your entire institution. Pick the plan that fits — upgrade anytime as you grow.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!annual ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${annual ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Annual
            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-bold">Save 15%</span>
          </button>
        </div>
      </section>

      {/* Plan cards */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-4 gap-5">
          {TIERS.map(tier => {
            const c = COLOR[tier.color]
            const price = annual ? tier.annual : tier.monthly
            return (
              <div
                key={tier.name}
                className={`relative rounded-3xl border-2 p-6 flex flex-col bg-white dark:bg-gray-900 ${tier.popular ? `${c.ring} ring-2 shadow-xl shadow-blue-100 dark:shadow-blue-950` : 'border-gray-100 dark:border-gray-800'}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                  </div>
                )}

                <div className="mb-5">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.badge}`}>{tier.name}</span>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 leading-relaxed">{tier.desc}</p>
                </div>

                <div className="mb-6">
                  {price !== null ? (
                    <>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">${price}</span>
                        <span className="text-gray-400 text-sm mb-1.5">/mo</span>
                      </div>
                      {annual && <p className="text-xs text-gray-400 mt-0.5">Billed annually</p>}
                    </>
                  ) : (
                    <div className="text-2xl font-black text-gray-900 dark:text-white">Custom pricing</div>
                  )}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {[tier.students, tier.admins, tier.storage].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Check className={`w-4 h-4 flex-shrink-0 ${c.text}`} strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.href}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm transition-all ${c.btn}`}
                >
                  {tier.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* Feature comparison */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-10">Full feature comparison</h2>
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="col-span-1 px-5 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Feature</div>
            {['Starter', 'Pro', 'Enterprise', 'University'].map(t => (
              <div key={t} className="px-3 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300">{t}</div>
            ))}
          </div>
          {FEATURES.map((f, i) => (
            <div key={i} className={`grid grid-cols-5 border-b border-gray-100 dark:border-gray-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/30'}`}>
              <div className="col-span-1 px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{f.label}</div>
              {[f.starter, f.pro, f.enterprise, f.university].map((has, j) => (
                <div key={j} className="flex items-center justify-center py-3">
                  {has
                    ? <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
                    : <X className="w-4 h-4 text-gray-200 dark:text-gray-700" />
                  }
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Add-ons */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-2">Add-ons</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-10">Available on all plans</p>
          <div className="grid md:grid-cols-3 gap-4">
            {ADDONS.map(a => (
              <div key={a.name} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{a.name}</p>
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{a.price}</span>
                </div>
                <p className="text-xs text-gray-400">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-10">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{faq.q}</span>
                <HelpCircle className={`w-4 h-4 flex-shrink-0 transition-colors ${openFaq === i ? 'text-blue-600' : 'text-gray-300 dark:text-gray-600'}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gray-900 dark:bg-gray-800 py-16 text-center px-6">
        <h2 className="text-3xl font-black text-white mb-3">Ready to get started?</h2>
        <p className="text-gray-400 mb-8 text-sm">14-day free trial. No credit card. Cancel anytime.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/register" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold text-sm transition-colors">
            Start Free Trial
          </Link>
          <Link href="/contact" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold text-sm transition-colors">
            Book a Demo
          </Link>
        </div>
      </section>

    </div>
  )
}
