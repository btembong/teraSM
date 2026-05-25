import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Target, Heart, Zap, Shield, Users, Globe, LinkedinIcon, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About — Tera SM',
  description: 'Learn about Tera SM — the team, mission, and story behind the operating system for African education.',
  openGraph: {
    title: 'About Tera SM',
    description: 'Built by Africans, for African schools. Our mission, team, and story.',
    url: 'https://terasms.com/about',
  },
  alternates: { canonical: 'https://terasms.com/about' },
}

const STATS = [
  { value: '50+',    label: 'Institutions' },
  { value: '100k+',  label: 'Students' },
  { value: '8',      label: 'Countries' },
  { value: '2022',   label: 'Founded' },
]

const VALUES = [
  {
    icon: Target,
    title: 'Africa-first',
    desc: 'Every decision is made with African schools, infrastructure, and payment rails in mind. Not adapted — built.',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    accent: 'border-t-indigo-400',
  },
  {
    icon: Heart,
    title: 'Student outcomes first',
    desc: 'Our north star is whether students learn better, graduate faster, and find opportunities with our platform.',
    iconBg: 'bg-rose-50 dark:bg-rose-950',
    iconColor: 'text-rose-600 dark:text-rose-400',
    accent: 'border-t-rose-400',
  },
  {
    icon: Zap,
    title: 'Move fast, ship value',
    desc: 'We ship weekly. Schools need working software today, not a roadmap for 2026.',
    iconBg: 'bg-amber-50 dark:bg-amber-950',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accent: 'border-t-amber-400',
  },
  {
    icon: Shield,
    title: 'Trust through transparency',
    desc: 'Data privacy, audit logs, and honest pricing. No hidden fees, no dark patterns.',
    iconBg: 'bg-blue-50 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
    accent: 'border-t-blue-400',
  },
  {
    icon: Users,
    title: 'Partner, not vendor',
    desc: 'We embed with schools, train staff, and treat every institution like our only customer.',
    iconBg: 'bg-teal-50 dark:bg-teal-950',
    iconColor: 'text-teal-600 dark:text-teal-400',
    accent: 'border-t-teal-400',
  },
  {
    icon: Globe,
    title: 'Think continental',
    desc: 'We build for all 54 countries. Multilingual, multi-currency, multi-regulation.',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accent: 'border-t-emerald-400',
  },
]

const TIMELINE = [
  {
    year: '2022',
    title: 'The problem spotted',
    desc: 'Founders witnessed African universities running on WhatsApp groups and Excel sheets for critical operations.',
    status: 'past',
  },
  {
    year: '2023',
    title: 'First version shipped',
    desc: 'Beta launched with 3 partner institutions in Nigeria and Ghana. 800 students. Lots of bugs.',
    status: 'past',
  },
  {
    year: '2024',
    title: 'Product-market fit',
    desc: 'Expanded to 20+ institutions across 8 countries. Launched finance module — fee collection rates jumped 40%.',
    status: 'past',
  },
  {
    year: '2025',
    title: 'AI & scale',
    desc: 'Launched AI advisor, early warning system, and live classes. 50+ institutions, 100,000+ students.',
    status: 'current',
  },
  {
    year: '2026',
    title: 'Continental push',
    desc: 'Expanding to Francophone Africa with full French support. Mobile apps live on iOS and Android.',
    status: 'future',
  },
]

const TEAM = [
  {
    name: 'Chidera Okafor',
    role: 'CEO & Co-founder',
    bio: 'Former EdTech product lead at Andela. Built products used by 500,000+ Africans.',
    location: 'Lagos, Nigeria',
    flag: '🇳🇬',
    gradient: 'from-blue-500 to-indigo-600',
    initials: 'CO',
  },
  {
    name: 'Amina Diallo',
    role: 'CTO & Co-founder',
    bio: 'Ex-AWS engineer. Architected systems at scale for Paystack and Flutterwave.',
    location: 'Accra, Ghana',
    flag: '🇬🇭',
    gradient: 'from-teal-500 to-emerald-600',
    initials: 'AD',
  },
  {
    name: 'Jean-Baptiste Ngom',
    role: 'Head of Growth',
    bio: 'Scaled B2B SaaS in Francophone Africa. Former Jumia and Wave.',
    location: 'Dakar, Senegal',
    flag: '🇸🇳',
    gradient: 'from-amber-500 to-orange-500',
    initials: 'JN',
  },
  {
    name: 'Dr. Funmilayo Adeyemi',
    role: 'Head of Education',
    bio: '15 years in university administration. Former Deputy Registrar, University of Lagos.',
    location: 'Lagos, Nigeria',
    flag: '🇳🇬',
    gradient: 'from-purple-500 to-violet-600',
    initials: 'FA',
  },
]

const PRESS = [
  'TechCabal',
  'Disrupt Africa',
  'Tech in Africa',
  'The Africa Report',
  'Ventures Africa',
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* ── Hero ───────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-gray-950 py-24">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.045] dark:opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Glow blobs */}
        <div className="absolute -top-40 -left-40 w-[480px] h-[480px] bg-blue-400/10 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-40 w-[400px] h-[400px] bg-indigo-400/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-full px-4 py-1.5 text-sm text-blue-700 dark:text-blue-400 font-semibold mb-8">
            Our story
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-[1.1]">
            Built by Africans,<br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              for African schools
            </span>
          </h1>

          <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto mb-14">
            We started Tera SM after watching brilliant students fail because their institutions
            were drowning in paperwork, missing fee payments, and losing records. There had to be a better way.
          </p>

          {/* Stat strip */}
          <div className="inline-grid grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900">
            {STATS.map(s => (
              <div key={s.label} className="px-8 py-5 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Mission */}
            <div className="relative bg-blue-600 rounded-3xl p-10 text-white overflow-hidden">
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
              <div className="absolute -bottom-12 -left-6 w-52 h-52 bg-white/5 rounded-full" />
              <div className="relative">
                <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center mb-5">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-3">Mission</p>
                <h2 className="text-2xl font-bold mb-4 leading-snug">
                  Give every African institution world-class infrastructure
                </h2>
                <p className="text-blue-100 leading-relaxed text-sm">
                  No school — whether a rural secondary school in Cameroon or a 20,000-student
                  university in Nigeria — should have to choose between good education and good technology.
                </p>
              </div>
            </div>

            {/* Vision */}
            <div className="relative bg-gray-950 dark:bg-gray-800 rounded-3xl p-10 text-white overflow-hidden">
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
              <div className="absolute -bottom-12 -left-6 w-52 h-52 bg-white/5 rounded-full" />
              <div className="relative">
                <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center mb-5">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Vision</p>
                <h2 className="text-2xl font-bold mb-4 leading-snug">
                  The operating system for African education
                </h2>
                <p className="text-gray-300 leading-relaxed text-sm">
                  A future where every student on the continent has a digital ID, verified transcript,
                  and career network — all starting from the platform their institution runs on.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
              What we believe
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Our principles</h2>
            <p className="text-gray-500 dark:text-gray-400">The values that guide every product decision we make.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map((v) => {
              const Icon = v.icon
              return (
                <div
                  key={v.title}
                  className={`bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 border-t-2 ${v.accent} hover:shadow-md hover:shadow-gray-100 dark:hover:shadow-gray-900 transition-all`}
                >
                  <div className={`w-12 h-12 ${v.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${v.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{v.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Timeline ───────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
              Our journey
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">From idea to 100k students</h2>
          </div>

          <div className="relative">
            {/* Gradient connector line */}
            <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-blue-400 via-indigo-400 to-gray-200 dark:to-gray-700" />

            <div className="space-y-0">
              {TIMELINE.map((t, i) => (
                <div key={t.year} className="relative flex gap-6 pb-10 last:pb-0">
                  {/* Dot */}
                  <div className="flex-shrink-0 relative z-10 mt-1">
                    {t.status === 'current' ? (
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900 ring-4 ring-white dark:ring-gray-900">
                        <span className="text-white text-[10px] font-bold">{t.year.slice(2)}</span>
                      </div>
                    ) : t.status === 'future' ? (
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center ring-4 ring-white dark:ring-gray-900">
                        <span className="text-gray-400 dark:text-gray-500 text-[10px] font-bold">{t.year.slice(2)}</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm ring-4 ring-white dark:ring-gray-900">
                        <span className="text-white text-[10px] font-bold">{t.year.slice(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Card */}
                  <div className={`flex-1 rounded-2xl p-5 border transition-all ${
                    t.status === 'current'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-100 dark:shadow-blue-900/40'
                      : t.status === 'future'
                      ? 'bg-white dark:bg-gray-800 border-dashed border-gray-200 dark:border-gray-700'
                      : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        t.status === 'current'
                          ? 'bg-white/20 text-white'
                          : t.status === 'future'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                          : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                      }`}>{t.year}</span>
                      {t.status === 'current' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping inline-flex" />
                          Now
                        </span>
                      )}
                      {t.status === 'future' && (
                        <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Upcoming</span>
                      )}
                    </div>
                    <h3 className={`font-bold mb-1.5 ${t.status === 'current' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {t.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${
                      t.status === 'current'
                        ? 'text-blue-100'
                        : t.status === 'future'
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {t.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ───────────────────────────────────────────────────────────────── */}
      <section id="team" className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
              The team
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Operators &amp; builders</h2>
            <p className="text-gray-500 dark:text-gray-400">Engineers, educators, and operators who have lived the problem.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEAM.map((t) => (
              <div
                key={t.name}
                className="group bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-gray-100 dark:hover:shadow-gray-900 transition-all text-center"
              >
                {/* Gradient avatar */}
                <div className={`w-16 h-16 bg-gradient-to-br ${t.gradient} rounded-2xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 shadow-md`}>
                  {t.initials}
                </div>

                <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{t.name}</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 mb-3">{t.role}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{t.bio}</p>

                {/* Location */}
                <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 mb-4">
                  <MapPin className="w-3 h-3" />
                  <span>{t.flag} {t.location}</span>
                </div>

                {/* LinkedIn on hover */}
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <LinkedinIcon className="w-3.5 h-3.5" /> LinkedIn
                </a>
              </div>
            ))}
          </div>

          {/* Join the team card */}
          <div className="mt-5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {['bg-orange-500', 'bg-lime-600', 'bg-sky-500', 'bg-fuchsia-500'].map((c, i) => (
                  <div key={i} className={`w-9 h-9 rounded-full ${c} border-2 border-white dark:border-gray-900`} />
                ))}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">40+ people across 12 countries</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">We are always looking for exceptional people to join the mission.</p>
              </div>
            </div>
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200 dark:shadow-none flex-shrink-0"
            >
              View open roles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Press ──────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">As seen in</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {PRESS.map((p) => (
              <span
                key={p}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 transition-all cursor-default"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-2xl mx-auto px-6 text-center">
          {/* Avatar strip */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex -space-x-2">
              {['bg-blue-400', 'bg-indigo-400', 'bg-teal-400', 'bg-purple-400', 'bg-amber-400'].map((c, idx) => (
                <div key={idx} className={`w-9 h-9 rounded-full ${c} border-2 border-blue-600`} />
              ))}
            </div>
            <p className="text-blue-100 text-sm font-medium">Join 40+ people building the future</p>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4">Join us on the mission</h2>
          <p className="text-blue-100 mb-10">
            We are hiring engineers, designers, and education specialists across Africa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-2xl font-semibold hover:bg-blue-50 transition-all shadow-lg"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/careers"
              className="px-8 py-4 border border-white/30 text-white rounded-2xl font-semibold hover:bg-white/10 transition-all"
            >
              View open roles
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
