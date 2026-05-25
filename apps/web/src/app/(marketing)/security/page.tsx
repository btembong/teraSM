import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Lock, Eye, Server, RefreshCw, FileCheck, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Security — Tera SM',
  description: 'Enterprise-grade security at every layer. AES-256 encryption, RBAC, GDPR compliance, automated backups, and full audit trails.',
  openGraph: {
    title: 'Security — Tera SM',
    description: 'Your school data is protected with AES-256 encryption, RBAC, GDPR compliance, and 99.9% uptime SLA.',
    url: 'https://terasms.com/security',
  },
  alternates: { canonical: 'https://terasms.com/security' },
}

const PILLARS = [
  {
    icon: Lock,
    title: 'Data Encryption',
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
  { label: 'TLS 1.3',        desc: 'All traffic encrypted in transit' },
  { label: 'AES-256',        desc: 'Data encrypted at rest' },
  { label: 'GDPR',           desc: 'EU data regulation compliant' },
  { label: 'FERPA',          desc: 'US student privacy compliant' },
  { label: '99.9% SLA',      desc: 'Uptime guarantee' },
  { label: 'SOC 2 (planned)', desc: 'Type II audit in roadmap' },
]

export default function SecurityPage() {
  return (
    <div className="bg-white dark:bg-gray-950">

      {/* Hero — dark */}
      <section className="bg-gray-950 text-center px-6 pt-24 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-600/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Security you can trust
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            Your school&apos;s data is among the most sensitive information in existence. We treat it that way — with enterprise-grade security at every layer, from the database to the browser.
          </p>
        </div>
      </section>

      {/* Cert badge bar */}
      <section className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 md:grid-cols-6 gap-4">
          {CERTS.map(c => (
            <div key={c.label} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl mb-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{c.label}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security pillars */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
            Security at every layer
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
            We don&apos;t bolt on security as an afterthought. It is baked into the architecture from day one.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map(p => {
            const Icon = p.icon
            return (
              <div
                key={p.title}
                className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-lg hover:shadow-blue-50 dark:hover:shadow-blue-950/20 transition-all"
              >
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">{p.title}</h3>
                <ul className="space-y-2">
                  {p.points.map(pt => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
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
      <section className="bg-blue-50 dark:bg-blue-950/20 border-y border-blue-100 dark:border-blue-900/40 py-12">
        <div className="max-w-3xl mx-auto px-6 flex items-start gap-5">
          <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Responsible disclosure</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Found a security vulnerability? We take security reports seriously and respond within 24 hours.
              Please email{' '}
              <a href="mailto:security@terasms.com" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                security@terasms.com
              </a>{' '}
              with full details. We operate a responsible disclosure policy and will never take legal action against good-faith researchers.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gray-950 py-20 text-center px-6">
        <h2 className="text-3xl font-black text-white mb-3">Have security questions?</h2>
        <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
          Our team can walk you through our full architecture, compliance posture, and answer any questions your IT or legal team has.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold text-sm transition-colors"
          >
            Talk to our security team <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dpa"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-2xl font-semibold text-sm transition-colors"
          >
            Download DPA
          </Link>
        </div>
      </section>

    </div>
  )
}
