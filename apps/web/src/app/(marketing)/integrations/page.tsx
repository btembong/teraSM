import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight, Code2, CreditCard, MessageSquare, ShieldCheck,
  HardDrive, Video, BarChart2, Zap, PlusCircle,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Integrations — Tera SM',
  description: 'Tera SM connects with payment gateways, SMS providers, SSO, storage, and monitoring tools built for African institutions.',
  alternates: { canonical: 'https://terasms.com/integrations' },
}

// Each category gets a distinct shade within blue/indigo only
const categories = [
  {
    id: 'payments',
    name: 'Payments',
    icon: CreditCard,
    accent: 'bg-blue-600',
    lightBg: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    integrations: [
      { name: 'Paystack',           initial: 'P', desc: 'Card, bank transfer, and USSD payments. Nigeria, Ghana, Kenya, South Africa.',              status: 'Live' as const },
      { name: 'Flutterwave',        initial: 'F', desc: 'Payments across 30+ African countries. Cards, mobile money, bank transfer.',                  status: 'Live' as const },
      { name: 'MTN Mobile Money',   initial: 'M', desc: 'Students pay fees directly from their MTN MoMo wallet. Cameroon, Ghana, Uganda, Rwanda.',     status: 'Live' as const },
      { name: 'Orange Money',       initial: 'O', desc: "Mobile money for Francophone Africa. Cameroon, Côte d'Ivoire, Senegal, Mali.",               status: 'Live' as const },
      { name: 'Stripe',             initial: 'S', desc: 'International card payments for schools with global student bases.',                          status: 'Live' as const },
    ],
  },
  {
    id: 'communications',
    name: 'Communications',
    icon: MessageSquare,
    accent: 'bg-indigo-600',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    integrations: [
      { name: "Africa's Talking",    initial: 'A', desc: 'Bulk SMS to 40+ African mobile networks. Low cost, high delivery rates.',                     status: 'Live' as const },
      { name: 'Twilio',              initial: 'T', desc: 'SMS and WhatsApp messaging for global reach.',                                                status: 'Live' as const },
      { name: 'WhatsApp Business API', initial: 'W', desc: 'Send fee reminders, results, and alerts directly to WhatsApp.',                            status: 'Live' as const },
      { name: 'Resend',              initial: 'R', desc: 'Transactional email for receipts, invitations, and notifications.',                           status: 'Live' as const },
      { name: 'Firebase FCM',        initial: 'F', desc: 'Push notifications for iOS and Android mobile apps.',                                         status: 'Live' as const },
    ],
  },
  {
    id: 'auth',
    name: 'Identity & Auth',
    icon: ShieldCheck,
    accent: 'bg-blue-700',
    lightBg: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-700 dark:text-blue-400',
    integrations: [
      { name: 'Google SSO',  initial: 'G', desc: 'Sign in with Google for students and staff. Works with GSuite school domains.',      status: 'Live' as const },
      { name: 'Microsoft SSO', initial: 'M', desc: 'Azure AD integration for Microsoft 365 institutions.',                             status: 'Coming soon' as const },
      { name: 'SAML 2.0',   initial: 'S', desc: 'Enterprise SSO for institutions with existing identity providers.',                  status: 'Enterprise' as const },
    ],
  },
  {
    id: 'storage',
    name: 'Storage & Media',
    icon: HardDrive,
    accent: 'bg-indigo-500',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    iconColor: 'text-indigo-500 dark:text-indigo-400',
    integrations: [
      { name: 'Cloudflare R2',     initial: 'R', desc: 'Zero-egress file storage for documents, images, and videos.',          status: 'Live' as const },
      { name: 'Cloudflare Stream', initial: 'S', desc: 'Video delivery and adaptive streaming for lecture recordings.',         status: 'Live' as const },
    ],
  },
  {
    id: 'live-classes',
    name: 'Live Classes',
    icon: Video,
    accent: 'bg-blue-500',
    lightBg: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-500 dark:text-blue-400',
    integrations: [
      { name: 'LiveKit',           initial: 'L', desc: 'Built-in WebRTC video conferencing. No external accounts needed.', status: 'Live' as const },
      { name: 'Zoom (via webhook)', initial: 'Z', desc: 'Sync Zoom class schedules into the Tera SM timetable.',           status: 'Coming soon' as const },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics & Monitoring',
    icon: BarChart2,
    accent: 'bg-indigo-700',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    iconColor: 'text-indigo-700 dark:text-indigo-400',
    integrations: [
      { name: 'Sentry',           initial: 'S', desc: 'Error monitoring and performance tracking.',             status: 'Live' as const },
      { name: 'Axiom',            initial: 'A', desc: 'Log management and analytics pipeline.',                 status: 'Live' as const },
      { name: 'Google Analytics', initial: 'G', desc: "Web analytics for the school's public pages.",          status: 'Live' as const },
    ],
  },
]

const STATUS_CONFIG = {
  'Live':        { dot: 'bg-green-500',  badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' },
  'Coming soon': { dot: 'bg-yellow-400', badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' },
  'Enterprise':  { dot: 'bg-purple-500', badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400' },
}

const totalIntegrations = categories.reduce((sum, c) => sum + c.integrations.length, 0)
const liveCount = categories.flatMap(c => c.integrations).filter(i => i.status === 'Live').length

const STATS = [
  { value: String(totalIntegrations), label: 'Integrations' },
  { value: String(categories.length), label: 'Categories' },
  { value: '5', label: 'Payment gateways' },
  { value: String(liveCount), label: 'Live today' },
]

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/40 dark:via-gray-950 dark:to-indigo-950/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <Zap className="w-3.5 h-3.5" /> Native integrations — no middleware needed
          </div>
          <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-5 leading-tight">
            Connect everything<br />your school already uses
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10">
            Tera SM connects with the payment rails, SMS providers, and tools African institutions actually use.
            No workarounds — native integrations built for the continent.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/register" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors text-sm">
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/docs#api" className="flex items-center gap-2 px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">
              <Code2 className="w-4 h-4" /> API reference
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 py-7 grid grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Category jump links */}
      <section className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex gap-1 overflow-x-auto">
          {categories.map(cat => {
            const Icon = cat.icon
            return (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name}
              </a>
            )
          })}
        </div>
      </section>

      {/* Integrations by category */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 space-y-20">
          {categories.map((cat) => {
            const CatIcon = cat.icon
            return (
              <div key={cat.id} id={cat.id}>
                {/* Category header */}
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className={`w-9 h-9 rounded-xl ${cat.lightBg} flex items-center justify-center`}>
                    <CatIcon className={`w-[18px] h-[18px] ${cat.iconColor}`} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{cat.name}</h2>
                  <span className="ml-1 text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {cat.integrations.length}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.integrations.map((intg) => {
                    const sc = STATUS_CONFIG[intg.status]
                    return (
                      <div
                        key={intg.name}
                        className={`group relative bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-indigo-800 hover:shadow-lg hover:shadow-blue-50 dark:hover:shadow-indigo-950/30 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden`}
                      >
                        {/* Top accent line on hover */}
                        <div className={`absolute top-0 left-0 right-0 h-0.5 ${cat.accent} scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left`} />

                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-10 h-10 ${cat.accent} rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-sm`}>
                            {intg.initial}
                          </div>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {intg.status}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 text-sm group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-colors">
                          {intg.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{intg.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Request integration */}
      <section className="py-16 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PlusCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Don't see yours?</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            We're constantly adding integrations. Tell us what your institution needs and we'll prioritise it on the roadmap.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Request an integration <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Build your own */}
      <section className="py-24 bg-gray-900 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-white font-medium mb-6">
            <Code2 className="w-3.5 h-3.5" />
            Open REST API
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Build your own integration</h2>
          <p className="text-gray-400 text-lg mb-10">
            Full REST API with OpenAPI docs, webhook support, and a sandbox environment.
            Pro plans get read access, Enterprise gets full read + write.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mb-10 text-left">
            {[
              { title: 'REST API', desc: 'Paginated endpoints for students, enrollments, grades, fees, and more.' },
              { title: 'Webhooks', desc: 'Subscribe to events like payment.received, enrollment.created, grade.published.' },
              { title: 'Sandbox', desc: 'Test against real schema with mock data. No production impact.' },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/docs#api" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold hover:bg-gray-100 transition-all text-sm">
            Read API docs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
