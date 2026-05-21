import Link from 'next/link'
import { Shield, Lock, Eye, Server, RefreshCw, FileCheck, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'

const PILLARS = [
  {
    icon: Lock,
    title: 'Data Encryption',
    color: 'bg-blue-100 text-blue-700',
    points: [
      'All data encrypted at rest using AES-256',
      'All data in transit encrypted via TLS 1.3',
      'Database-level encryption on PostgreSQL (Neon)',
      'File storage encrypted on Cloudflare R2',
    ],
  },
  {
    icon: Shield,
    title: 'Access Control',
    color: 'bg-purple-100 text-purple-700',
    points: [
      'Role-based access control (RBAC) with granular permissions',
      'Row-level security — every record scoped to a tenant',
      'IP whitelisting for Admin Portal (Enterprise+)',
      'Two-factor authentication (2FA) for staff and admin',
      'Session timeout and single-session enforcement',
    ],
  },
  {
    icon: Eye,
    title: 'Audit & Monitoring',
    color: 'bg-amber-100 text-amber-700',
    points: [
      'Full audit trail — every action logged with user, timestamp and IP',
      'Real-time error monitoring via Sentry',
      'Log aggregation via Axiom',
      'Uptime monitoring with BetterUptime',
      'Automated alerts on anomalies',
    ],
  },
  {
    icon: Server,
    title: 'Infrastructure',
    color: 'bg-emerald-100 text-emerald-700',
    points: [
      'Hosted on Vercel (frontend) and Railway (API) — enterprise-grade cloud',
      'PostgreSQL on Neon — serverless, auto-scaling, geo-distributed',
      'Redis via Upstash for caching and job queues',
      'Cloudflare CDN for static assets and DDoS protection',
      'Isolated tenant data — no cross-tenant access possible',
    ],
  },
  {
    icon: RefreshCw,
    title: 'Backup & Recovery',
    color: 'bg-teal-100 text-teal-700',
    points: [
      'Automated daily backups with 30-day retention',
      'Point-in-time recovery (PITR) — restore to any moment',
      'Database branching for zero-downtime migrations',
      'Disaster recovery plan with RTO < 4 hours',
      'Data export available at any time from Admin → Settings',
    ],
  },
  {
    icon: FileCheck,
    title: 'Compliance',
    color: 'bg-pink-100 text-pink-700',
    points: [
      'GDPR compliant — consent management, data export, right to erasure',
      'FERPA compliant for US institutions',
      'Data Processing Agreement (DPA) available on request',
      'Cookie consent banner on all public pages',
      'Privacy Policy and Terms of Service published',
    ],
  },
]

const CERTS = [
  { label: 'TLS 1.3', desc: 'All traffic encrypted in transit' },
  { label: 'AES-256', desc: 'Data encrypted at rest' },
  { label: 'GDPR', desc: 'EU data regulation compliant' },
  { label: 'FERPA', desc: 'US student privacy compliant' },
  { label: '99.9% SLA', desc: 'Uptime guarantee' },
  { label: 'SOC 2 (planned)', desc: 'Type II audit in roadmap' },
]

export default function SecurityPage() {
  return (
    <div className="bg-white">

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-14 max-w-3xl mx-auto">
        <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
          Security you can trust
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed">
          Your school's data is among the most sensitive information in existence. We treat it that way — with enterprise-grade security at every layer.
        </p>
      </section>

      {/* Cert badges */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 md:grid-cols-6 gap-4">
          {CERTS.map(c => (
            <div key={c.label} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl mb-2 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-gray-900">{c.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PILLARS.map(p => {
            const Icon = p.icon
            return (
              <div key={p.title} className="bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${p.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">{p.title}</h3>
                <ul className="space-y-2">
                  {p.points.map(pt => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* Responsible disclosure */}
      <section className="bg-gray-50 border-y border-gray-100 py-12">
        <div className="max-w-3xl mx-auto px-6 flex items-start gap-5">
          <div className="w-11 h-11 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Responsible disclosure</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Found a security vulnerability? We take security reports seriously and respond within 24 hours.
              Please email <a href="mailto:security@terasms.com" className="text-blue-600 hover:underline font-medium">security@terasms.com</a> with details.
              We operate a responsible disclosure policy and will never take legal action against good-faith researchers.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center py-16 px-6">
        <h2 className="text-2xl font-black text-gray-900 mb-3">Have security questions?</h2>
        <p className="text-gray-500 text-sm mb-6">Our team can walk you through our architecture and answer any compliance questions.</p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-sm transition-colors"
        >
          Talk to our security team <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

    </div>
  )
}
