'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, GraduationCap, Building2, BookOpen, Users,
  DollarSign, UserCog, RotateCcw, CheckCircle, Network,
} from 'lucide-react'

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '50+',   label: 'Institutions',    sub: 'across Africa' },
  { value: '100k+', label: 'Students',        sub: 'on the platform' },
  { value: '8',     label: 'Countries',       sub: 'and growing' },
  { value: '19',    label: 'Modules',         sub: 'one platform' },
]

const byType = [
  {
    id: 'secondary',
    icon: GraduationCap,
    title: 'Primary & Secondary Schools',
    desc: 'Manage the full student lifecycle from enrolment to graduation. Attendance, grades, fee collection, and parent communication — all in one place.',
    features: ['Student registration & ID cards', 'Class attendance (QR + manual)', 'Term results & report cards', 'Fee invoicing with MoMo support', 'Parent portal with SMS alerts', 'Timetable & exam scheduling'],
    cta: 'Perfect fit for Starter plan',
    href: '/pricing',
    gradient: 'from-blue-500 via-blue-600 to-cyan-600',
    accent: 'text-cyan-200',
  },
  {
    id: 'colleges',
    icon: Building2,
    title: 'Colleges & Polytechnics',
    desc: 'Handle course registration, credit units, GPA tracking, and departmental management for growing institutions.',
    features: ['Credit-unit course registration', 'GPA / CGPA calculator', 'Department & faculty management', 'Full LMS with assignments & quizzes', 'HR + payroll for staff', 'Official transcript generation'],
    cta: 'Best on Pro plan',
    href: '/pricing',
    gradient: 'from-indigo-500 via-indigo-600 to-blue-700',
    accent: 'text-indigo-200',
  },
  {
    id: 'universities',
    icon: BookOpen,
    title: 'Universities',
    desc: 'Full-scale academic management for multi-faculty, multi-campus institutions. Thesis portals, accreditation reports, and AI-powered analytics.',
    features: ['Multi-campus management', 'Thesis & dissertation portal', 'Accreditation report generator', 'AI early warning & dropout detection', 'Custom branding per faculty', 'REST API + webhooks for integration'],
    cta: 'Enterprise & University plans',
    href: '/pricing',
    gradient: 'from-purple-500 via-purple-600 to-violet-800',
    accent: 'text-purple-200',
  },
  {
    id: 'vocational',
    icon: Building2,
    title: 'Vocational & Training Institutes',
    desc: 'Shorter cohorts, practical assessments, and certification issuance — designed for skills-based training programs.',
    features: ['Short-course & cohort management', 'Practical assessment tracking', 'Digital certificate issuance', 'Employer partnership portal', 'Job board integration', 'Alumni & placement tracking'],
    cta: 'Starter or Pro plan',
    href: '/pricing',
    gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
    accent: 'text-emerald-200',
  },
  {
    id: 'multicampus',
    icon: Network,
    title: 'Multi-Campus Groups',
    desc: 'Manage multiple campuses from a single admin panel. Unified branding, consolidated reporting, and per-campus customization.',
    features: ['Single admin panel for all campuses', 'Per-campus branding & settings', 'Consolidated analytics across sites', 'Cross-campus student transfer', 'Centralized HR and payroll', 'Campus-level feature controls'],
    cta: 'Enterprise & University plans',
    href: '/pricing',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-600',
    accent: 'text-rose-200',
  },
]

const byRole = [
  {
    icon: Users,
    title: 'School Administrators',
    desc: 'One dashboard for the whole institution. Enrolment stats, fee collection rates, attendance trends, and pending approvals — all in real time.',
    points: ['Real-time enrolment and fee dashboards', 'Leave request approvals', 'Announcement broadcasting', 'Audit logs for all actions', 'Custom report builder'],
    gradient: 'from-slate-600 via-slate-700 to-gray-900',
    accent: 'text-slate-300',
    dayOne: ['Enrollment count by department', 'Fee collection rate today', 'Pending leave requests', 'Unread announcements', 'Recent audit activity'],
  },
  {
    icon: BookOpen,
    title: 'Teachers & Lecturers',
    desc: 'Focus on teaching, not paperwork. Manage courses, mark attendance, grade assignments, and host live classes from one screen.',
    points: ['Course materials upload & management', 'One-click attendance marking', 'AI grading assistant', 'Live classes with recording', 'Student progress at a glance'],
    gradient: 'from-amber-500 via-orange-500 to-orange-600',
    accent: 'text-amber-200',
    dayOne: ['My courses this semester', 'Upcoming class in 45 min', 'Ungraded submissions: 12', 'Attendance sheet open', 'Student at-risk alerts'],
  },
  {
    icon: GraduationCap,
    title: 'Students',
    desc: 'A personalized portal with everything in one place — schedule, results, fees, messages, and AI-powered academic support.',
    points: ['Personalized dashboard & schedule', 'Grade history & GPA tracker', 'Pay fees via MoMo / Paystack', 'AI academic advisor', 'Digital transcript download'],
    gradient: 'from-sky-500 via-blue-500 to-blue-600',
    accent: 'text-sky-200',
    dayOne: ['GPA: 3.7 · Semester 1', 'Next class: CS 301 10am', 'Fee balance: $0 (paid)', 'AI advisor recommendation', 'Assignment due tomorrow'],
  },
  {
    icon: Users,
    title: 'Parents',
    desc: "Stay connected to your child's academic journey. View grades, attendance, and pay fees — all from your phone.",
    points: ['Real-time grade and attendance updates', 'Fee payment on behalf of child', 'Direct message to teachers', 'Result and report card download', 'Absence notifications'],
    gradient: 'from-rose-400 via-pink-500 to-pink-600',
    accent: 'text-rose-200',
    dayOne: ["Child's current GPA", 'Attendance: 95% this term', 'Fee status: fully paid', 'Message from Dr. Osei', 'Semester results published'],
  },
  {
    icon: DollarSign,
    title: 'Finance Offices',
    desc: 'End the spreadsheet chaos. Automated invoicing, payment tracking, scholarship management, and revenue reports.',
    points: ['Automated fee invoicing', 'Payment reconciliation dashboard', 'Scholarship and bursary management', 'Overdue fee reminders', 'Revenue analytics by program/term'],
    gradient: 'from-green-500 via-emerald-500 to-emerald-700',
    accent: 'text-green-200',
    dayOne: ['Collection rate: 94%', 'Outstanding: $4,800', 'Payments today: 37', 'Scholarships pending: 5', 'Reconciliation status: done'],
  },
  {
    icon: UserCog,
    title: 'HR Departments',
    desc: 'From recruitment to payslips. Manage the full employee lifecycle without leaving the platform.',
    points: ['Employee records and contracts', 'Leave application and approval', 'Payroll calculation and payslips', '360-degree performance reviews', 'Substitute teacher management'],
    gradient: 'from-violet-500 via-purple-500 to-purple-700',
    accent: 'text-violet-200',
    dayOne: ['Headcount: 86 staff', 'Leave requests: 3 pending', 'Payroll due in 5 days', 'Contract renewals: 2', 'Open job postings: 1'],
  },
]

// ── Flip cards ────────────────────────────────────────────────────────────────

function TypeCard({ card }: { card: typeof byType[number] }) {
  const [flipped, setFlipped] = useState(false)
  const Icon = card.icon

  return (
    <div
      className="relative cursor-pointer h-[420px]"
      style={{ perspective: '1200px' }}
      onClick={() => setFlipped(f => !f)}
    >
      <div
        className="relative w-full h-full transition-transform duration-700 ease-in-out"
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Front */}
        <div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${card.gradient} p-8 flex flex-col justify-between`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{card.title}</h3>
            <p className={`text-sm leading-relaxed ${card.accent}`}>{card.desc}</p>
          </div>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <RotateCcw className="w-4 h-4" />
            Tap to explore features
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-8 flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">{card.title}</h3>
            </div>
            <ul className="space-y-3">
              {card.features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between">
            <Link
              href={card.href}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
              onClick={e => e.stopPropagation()}
            >
              {card.cta} <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Tap to flip back
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function RoleSelector() {
  const [active, setActive] = useState(0)
  const role = byRole[active]
  const Icon = role.icon

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
      <div className="grid lg:grid-cols-[280px_1fr]">

        {/* ── Left: role list ── */}
        <div className="border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-3 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible">
          {byRole.map((r, i) => {
            const RIcon = r.icon
            const isActive = active === i
            return (
              <button
                key={r.title}
                onClick={() => setActive(i)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all flex-shrink-0 lg:flex-shrink w-full ${
                  isActive
                    ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700'
                    : 'hover:bg-white/60 dark:hover:bg-gray-800/40'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  isActive
                    ? `bg-gradient-to-br ${r.gradient}`
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <RIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                </div>
                <div className="min-w-0 hidden sm:block">
                  <p className={`text-sm font-semibold leading-tight truncate ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    {r.title}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Right: detail panel ── */}
        <div className="flex flex-col">
          {/* Gradient header */}
          <div className={`bg-gradient-to-br ${role.gradient} p-8`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">For</p>
                <h3 className="text-2xl font-bold text-white leading-tight">{role.title}</h3>
                <p className={`text-sm mt-2 leading-relaxed ${role.accent}`}>{role.desc}</p>
              </div>
            </div>
          </div>

          {/* Features + day-one */}
          <div className="p-8 flex-1 grid sm:grid-cols-[1fr_auto] gap-8 items-start">
            {/* Feature list */}
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                What is included
              </p>
              <ul className="space-y-3">
                {role.points.map(pt => (
                  <li key={pt} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Day-one callout */}
            <div className="sm:w-52 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                Day one view
              </p>
              <div className="space-y-2">
                {role.dayOne.map(d => (
                  <div key={d} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white dark:bg-gray-950 py-24 px-6">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="absolute -top-40 -right-40 w-[480px] h-[480px] bg-blue-400/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-full px-4 py-1.5 text-sm text-blue-700 dark:text-blue-400 font-semibold mb-6">
            Solutions for every institution
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-[1.1]">
            One platform.<br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Every institution.
            </span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto mb-6">
            Whether you are a 200-student secondary school or a 20,000-student university,
            Tera SM scales to fit your institution exactly.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Tap any card to flip it and explore the features</p>
        </div>

        {/* Stats strip */}
        <div className="relative max-w-3xl mx-auto mt-14">
          <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900">
            {STATS.map(s => (
              <div key={s.label} className="py-5 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{s.label}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── By institution type ── */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">By institution type</h2>
            <p className="text-gray-500 dark:text-gray-400">Find the setup that matches your institution structure.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {byType.map((s) => <TypeCard key={s.id} card={s} />)}
          </div>
        </div>
      </section>

      {/* ── By role ── */}
      <section className="py-24 bg-white dark:bg-gray-950 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">By role</h2>
            <p className="text-gray-500 dark:text-gray-400">Tailored experiences for every person in your institution.</p>
          </div>
          <RoleSelector />
        </div>
      </section>

      {/* ── Why Tera SM ── */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Why institutions choose Tera SM</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Not just software — a partner that embeds with your institution and ensures adoption from day one.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { title: 'Africa-first payments', desc: 'MTN MoMo, Orange Money, Paystack, Flutterwave, and Stripe — all supported. No workarounds needed for African payment rails.', accent: 'border-t-green-400' },
              { title: 'Low-bandwidth ready', desc: 'The PWA works on 2G/3G. LMS content is optimized for slow connections. Students in rural areas are not left behind.', accent: 'border-t-blue-400' },
              { title: 'Guided onboarding', desc: 'A dedicated specialist helps your institution go live. Data migration, staff training, and first-week support are all included.', accent: 'border-t-indigo-400' },
              { title: 'Built for your language', desc: 'Full English and French support. Arabic, Swahili, and Portuguese on the roadmap. Switch languages in one click.', accent: 'border-t-amber-400' },
              { title: 'No vendor lock-in', desc: 'Export all your data at any time in CSV or Excel. Your data is yours — always. We hold no data hostage.', accent: 'border-t-teal-400' },
              { title: 'Scales with you', desc: 'Start on Starter with 500 students. Upgrade to University tier at 20,000+. The platform grows with your institution.', accent: 'border-t-purple-400' },
            ].map(item => (
              <div key={item.title} className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 border-t-2 ${item.accent}`}>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-blue-600 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Not sure which plan fits?</h2>
          <p className="text-blue-100 mb-10">
            Book a 30-minute demo and we will recommend the right setup for your institution.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register" className="flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-2xl font-semibold hover:bg-blue-50 transition-all shadow-lg">
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="px-8 py-4 border border-white/30 text-white rounded-2xl font-semibold hover:bg-white/10 transition-all">
              Book a demo
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
