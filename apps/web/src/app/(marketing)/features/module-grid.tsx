'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import {
  GraduationCap, CreditCard, Video, Users, BarChart2,
  BookOpen, Calendar, MessageSquare, Briefcase,
  Brain, Building2, Library, Shield, Globe, Zap,
  ClipboardList, UserCog, Vote, Heart,
} from 'lucide-react'

const MODULES = [
  { icon: Shield,        name: 'Onboarding & Authentication',  desc: 'Gmail SSO, email/password login, 2FA for staff and admin, multi-step onboarding wizard with progress bar, RBAC with granular permissions.', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300', href: '/features/auth' },
  { icon: ClipboardList, name: 'Admissions & Registration',    desc: 'Online application portal, application tracking, admission letter generation, course registration with prerequisite validation, clash detection and waitlists.', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400', href: '/features/admissions' },
  { icon: GraduationCap, name: 'Academics',                    desc: 'Academic calendar, AI-assisted timetable generator, grade entry, GPA/CGPA calculator, transcript generation, online proctored exams, question bank.', color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400', href: '/features/academics' },
  { icon: BookOpen,      name: 'Learning Management System',   desc: 'Course content management, adaptive learning paths, SCORM/xAPI, assignments, peer review, AI grading assistant, plagiarism detection.', color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400', href: '/features/lms' },
  { icon: Video,         name: 'Live Classes',                  desc: 'Built-in WebRTC video conferencing, breakout rooms, auto-recording, virtual whiteboard, live polls, screen sharing, attendance auto-mark.', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400', href: '/features/live-classes' },
  { icon: CreditCard,    name: 'Finance',                       desc: 'Fee structures, student invoicing, Paystack/Flutterwave/Stripe integration, installment plans, scholarships, automated late fees, revenue analytics.', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400', href: '/features/finance' },
  { icon: UserCog,       name: 'HR Management',                 desc: 'Employee records, recruitment pipeline, contract management, leave management, payroll & payslips, 360-degree performance reviews.', color: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400', href: '/features/hr' },
  { icon: MessageSquare, name: 'Communication & Engagement',   desc: 'In-app chat, class group chats, announcements, push/email/SMS/WhatsApp notifications, school social feed, email newsletter builder.', color: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400', href: '/features/communication' },
  { icon: Users,         name: 'Student Portal',                desc: 'Personalised dashboard, course registration, results & grades, transcripts, fee payments, timetable, notifications, and direct messaging.', color: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400', href: '/features/student-portal' },
  { icon: Heart,         name: 'Parent Portal',                 desc: 'Real-time child academic progress, fee payment, report card downloads, direct messaging with teachers, parent-teacher appointment booking.', color: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-400', href: '/features/parent-portal' },
  { icon: Calendar,      name: 'Student Life',                  desc: 'Clubs & societies, sports teams, hostel allocation, maintenance requests, cafeteria & meal plans, campus events, mental health booking.', color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400', href: '/features/student-life' },
  { icon: Vote,          name: 'Elections & Governance',        desc: 'Student government elections, verified one-person-one-vote, live result tallying, polls & surveys, formal petition system, SRC portal.', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400', href: '/features/elections' },
  { icon: Library,       name: 'Digital Library',               desc: 'E-library catalog, digital borrowing with due dates, research paper repository, JSTOR/Google Scholar integration, per-course reading lists.', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400', href: '/features/library' },
  { icon: Briefcase,     name: 'Career & Alumni',               desc: 'Job board, internship management, CV builder, career counselor booking, employer partner profiles, alumni network, mentorship matching.', color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400', href: '/features/career' },
  { icon: BarChart2,     name: 'Analytics & Reporting',         desc: 'Role-specific dashboards, custom report builder, enrollment forecasting, AI-powered dropout risk flags, accreditation report generation.', color: 'bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-400', href: '/features/analytics' },
  { icon: Brain,         name: 'AI & Intelligence',             desc: 'AI academic advisor, 24/7 chatbot, smart timetable generator, predictive analytics, NLP search, essay feedback, attendance anomaly detection.', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400', href: '/features/ai' },
  { icon: Building2,     name: 'Operations & Facilities',       desc: 'Asset management, QR code attendance, maintenance tracking, facility and room booking calendar, equipment depreciation tracking.', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400', href: '/features/operations' },
  { icon: Shield,        name: 'Security & Compliance',         desc: 'RBAC, IP whitelisting, full audit trail, GDPR compliance tools, automated daily backups, data encryption at rest and in transit.', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400', href: '/features/security' },
  { icon: Globe,         name: 'SaaS Infrastructure',           desc: 'Multi-tenant architecture, custom branding per school, open REST API, webhooks, multi-language support, offline-first PWA, mobile apps.', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300', href: '/features/infrastructure' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
}

const cardVariant = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } },
}

export function ModuleGrid() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-5% 0px' })

  return (
    <motion.div
      ref={ref}
      variants={container}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className="grid md:grid-cols-3 gap-5"
    >
      {MODULES.map(m => {
        const Icon = m.icon
        const card = (
          <motion.div
            key={m.name}
            variants={cardVariant}
            whileHover={{ y: -4, transition: { duration: 0.18 } }}
            className="group bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-gray-100 dark:hover:shadow-gray-900 cursor-pointer"
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${m.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {m.name}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{m.desc}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              Learn more <ArrowRight className="w-3 h-3" />
            </p>
          </motion.div>
        )
        return m.href ? <Link key={m.name} href={m.href}>{card}</Link> : card
      })}
    </motion.div>
  )
}
