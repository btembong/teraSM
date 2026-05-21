import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Code2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Integrations — Tera SM' }

const categories = [
  {
    name: 'Payments',
    integrations: [
      { name: 'Paystack', desc: 'Card, bank transfer, and USSD payments. Nigeria, Ghana, Kenya, South Africa.', status: 'Live', color: 'bg-blue-50 border-blue-100' },
      { name: 'Flutterwave', desc: 'Payments across 30+ African countries. Cards, mobile money, bank transfer.', status: 'Live', color: 'bg-orange-50 border-orange-100' },
      { name: 'MTN Mobile Money', desc: 'Students pay fees directly from their MTN MoMo wallet. Cameroon, Ghana, Uganda, Rwanda.', status: 'Live', color: 'bg-yellow-50 border-yellow-100' },
      { name: 'Orange Money', desc: 'Mobile money for Francophone Africa. Cameroon, Côte d\'Ivoire, Senegal, Mali.', status: 'Live', color: 'bg-orange-50 border-orange-100' },
      { name: 'Stripe', desc: 'International card payments for schools with global student bases.', status: 'Live', color: 'bg-purple-50 border-purple-100' },
    ],
  },
  {
    name: 'Communications',
    integrations: [
      { name: "Africa's Talking", desc: 'Bulk SMS to 40+ African mobile networks. Low cost, high delivery rates.', status: 'Live', color: 'bg-green-50 border-green-100' },
      { name: 'Twilio', desc: 'SMS and WhatsApp messaging for global reach.', status: 'Live', color: 'bg-red-50 border-red-100' },
      { name: 'WhatsApp Business API', desc: 'Send fee reminders, results, and alerts directly to WhatsApp.', status: 'Live', color: 'bg-green-50 border-green-100' },
      { name: 'Resend', desc: 'Transactional email for receipts, invitations, and notifications.', status: 'Live', color: 'bg-gray-50 border-gray-200' },
      { name: 'Firebase FCM', desc: 'Push notifications for iOS and Android mobile apps.', status: 'Live', color: 'bg-yellow-50 border-yellow-100' },
    ],
  },
  {
    name: 'Identity & Auth',
    integrations: [
      { name: 'Google SSO', desc: 'Sign in with Google for students and staff. Works with GSuite school domains.', status: 'Live', color: 'bg-blue-50 border-blue-100' },
      { name: 'Microsoft SSO', desc: 'Azure AD integration for Microsoft 365 institutions.', status: 'Coming soon', color: 'bg-blue-50 border-blue-100' },
      { name: 'SAML 2.0', desc: 'Enterprise SSO for institutions with existing identity providers.', status: 'Enterprise', color: 'bg-gray-50 border-gray-200' },
    ],
  },
  {
    name: 'Storage & Media',
    integrations: [
      { name: 'Cloudflare R2', desc: 'Zero-egress file storage for documents, images, and videos.', status: 'Live', color: 'bg-orange-50 border-orange-100' },
      { name: 'Cloudflare Stream', desc: 'Video delivery and adaptive streaming for lecture recordings.', status: 'Live', color: 'bg-orange-50 border-orange-100' },
    ],
  },
  {
    name: 'Live Classes',
    integrations: [
      { name: 'LiveKit', desc: 'Built-in WebRTC video conferencing. No external accounts needed.', status: 'Live', color: 'bg-blue-50 border-blue-100' },
      { name: 'Zoom (via webhook)', desc: 'Sync Zoom class schedules into the Tera SM timetable.', status: 'Coming soon', color: 'bg-blue-50 border-blue-100' },
    ],
  },
  {
    name: 'Analytics & Monitoring',
    integrations: [
      { name: 'Sentry', desc: 'Error monitoring and performance tracking.', status: 'Live', color: 'bg-purple-50 border-purple-100' },
      { name: 'Axiom', desc: 'Log management and analytics pipeline.', status: 'Live', color: 'bg-gray-50 border-gray-200' },
      { name: 'Google Analytics', desc: 'Web analytics for the school\'s public pages.', status: 'Live', color: 'bg-blue-50 border-blue-100' },
    ],
  },
]

const statusBadge: Record<string, string> = {
  'Live': 'bg-green-100 text-green-700',
  'Coming soon': 'bg-yellow-100 text-yellow-700',
  'Enterprise': 'bg-purple-100 text-purple-700',
}

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Integrations</h1>
          <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
            Tera SM connects with the tools and payment rails African institutions actually use.
            No workarounds, no adapters — native integrations built for the continent.
          </p>
          <div className="flex items-center justify-center gap-4 mt-10">
            <Link href="/register" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all text-sm">
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/docs#api" className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm">
              <Code2 className="w-4 h-4" /> API reference
            </Link>
          </div>
        </div>
      </section>

      {/* Integrations by category */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          {categories.map((cat) => (
            <div key={cat.name}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{cat.name}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.integrations.map((intg) => (
                  <div key={intg.name} className={`rounded-2xl p-5 border ${intg.color}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center font-bold text-gray-700 text-sm shadow-sm">
                        {intg.name[0]}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadge[intg.status]}`}>
                        {intg.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{intg.name}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{intg.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Build your own */}
      <section className="py-24 bg-gray-900">
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
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/docs#api" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold hover:bg-gray-100 transition-all">
            Read API docs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
