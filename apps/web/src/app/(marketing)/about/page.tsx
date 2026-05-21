import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Target, Heart, Zap, Shield, Users, Globe } from 'lucide-react'

export const metadata: Metadata = { title: 'About — Tera SM' }

const values = [
  { icon: Target, title: 'Africa-first', desc: 'Every decision is made with African schools, infrastructure, and payment rails in mind. Not adapted — built.' },
  { icon: Heart, title: 'Student outcomes first', desc: 'Our north star is whether students learn better, graduate faster, and find opportunities with our platform.' },
  { icon: Zap, title: 'Move fast, ship value', desc: 'We ship weekly. Schools need working software today, not a roadmap for 2026.' },
  { icon: Shield, title: 'Trust through transparency', desc: 'Data privacy, audit logs, and honest pricing. No hidden fees, no dark patterns.' },
  { icon: Users, title: 'Partner, not vendor', desc: 'We embed with schools, train staff, and treat every institution like our only customer.' },
  { icon: Globe, title: 'Think continental', desc: 'We build for all 54 countries. Multilingual, multi-currency, multi-regulation.' },
]

const timeline = [
  { year: '2022', title: 'The problem spotted', desc: 'Founders witnessed African universities running on WhatsApp groups and Excel sheets for critical operations.' },
  { year: '2023', title: 'First version shipped', desc: 'Beta launched with 3 partner institutions in Nigeria and Ghana. 800 students. Lots of bugs.' },
  { year: '2024', title: 'Product-market fit', desc: 'Expanded to 20+ institutions across 8 countries. Launched finance module — fee collection rates jumped 40%.' },
  { year: '2025', title: 'AI & scale', desc: 'Launched AI advisor, early warning system, and live classes. 50+ institutions, 100,000+ students.' },
  { year: '2026', title: 'Continental push', desc: 'Expanding to Francophone Africa with full French support. Mobile apps live on iOS and Android.' },
]

const team = [
  { name: 'Chidera Okafor', role: 'CEO & Co-founder', bio: 'Former EdTech product lead at Andela. Built products used by 500,000+ Africans.' },
  { name: 'Amina Diallo', role: 'CTO & Co-founder', bio: 'Ex-AWS engineer. Architected systems at scale for Paystack and Flutterwave.' },
  { name: 'Jean-Baptiste Ngom', role: 'Head of Growth', bio: 'Scaled B2B SaaS in Francophone Africa. Former Jumia and Wave.' },
  { name: 'Dr. Funmilayo Adeyemi', role: 'Head of Education', bio: '15 years in university administration. Former Deputy Registrar, University of Lagos.' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/30 dark:via-gray-950 dark:to-indigo-950/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-full px-4 py-1.5 text-sm text-blue-700 dark:text-blue-400 font-medium mb-8">
            Our story
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Built by Africans, for African schools
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
            We started Tera SM after watching brilliant students fail because their institutions
            were drowning in paperwork, missing fee payments, and losing records. There had to be a better way.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-blue-600 rounded-3xl p-10 text-white">
              <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-4">Mission</p>
              <h2 className="text-3xl font-bold mb-4">Give every African institution world-class infrastructure</h2>
              <p className="text-blue-100 leading-relaxed">
                No school — whether a rural secondary school in Cameroon or a 20,000-student university
                in Nigeria — should have to choose between good education and good technology.
              </p>
            </div>
            <div className="bg-gray-900 dark:bg-gray-800 rounded-3xl p-10 text-white">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-4">Vision</p>
              <h2 className="text-3xl font-bold mb-4">The operating system for African education</h2>
              <p className="text-gray-300 leading-relaxed">
                A future where every student on the continent has a digital ID, verified transcript,
                and career network — all starting from the platform their institution runs on.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">What we believe</h2>
            <p className="text-gray-500 dark:text-gray-400">The principles that guide every product decision we make.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center mb-4">
                  <v.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Our journey</h2>
          </div>
          <div className="space-y-8">
            {timeline.map((t, i) => (
              <div key={t.year} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {t.year.slice(2)}
                  </div>
                  {i < timeline.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-3" />}
                </div>
                <div className="pb-8">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">{t.year}</p>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">The team</h2>
            <p className="text-gray-500 dark:text-gray-400">Operators, engineers, and educators who've lived the problem.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((t) => (
              <div key={t.name} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xl mx-auto mb-4">
                  {t.name[0]}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{t.name}</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-3">{t.role}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press */}
      <section className="py-16 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">As seen in</p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400 dark:text-gray-500 font-semibold">
            {['TechCabal', 'Disrupt Africa', 'Tech in Africa', 'The Africa Report', 'Ventures Africa'].map((p) => (
              <span key={p} className="text-lg hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-default">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Join us on the mission</h2>
          <p className="text-blue-100 mb-8">We're hiring engineers, designers, and education specialists across Africa.</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-2xl font-semibold hover:bg-blue-50 transition-all">
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="mailto:jobs@terasms.com" className="px-8 py-4 border border-white/30 text-white rounded-2xl font-semibold hover:bg-white/10 transition-all">
              View open roles
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
