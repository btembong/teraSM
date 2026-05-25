'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BookingSection from './_components/BookingSection'
import ROICalculator from './_components/ROICalculator'
import IntegrationsSection from './_components/IntegrationsSection'
import SwitchingSection from './_components/SwitchingSection'
import WhatsAppShowcase from './_components/WhatsAppShowcase'
import MobileAppSection from './_components/MobileAppSection'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle, ArrowRight, Star, Zap, Shield, Globe,
  GraduationCap, CreditCard, Video, Users, Bell,
  ChevronDown, BarChart2, BookOpen, Calendar, MessageSquare,
  Briefcase, Palette, ExternalLink, TrendingUp,
  Smartphone, Wifi, Languages, FileSpreadsheet,
  Brain, Award, Building2, ChevronRight, Library, X,
} from 'lucide-react'

// ─── DATA ────────────────────────────────────────────────────────────────────

const schools = [
  'University of Lagos', 'Ashesi University', 'Strathmore University',
  'KNUST', 'University of Nairobi', 'Daystar University',
  'INES-Ruhengeri', 'GIMPA', 'UDBS Tanzania', 'ALU Rwanda',
  'Covenant University', 'Makerere University',
]

const portalTabs = ['Student', 'Teacher', 'Admin', 'Parent'] as const
type PortalTab = typeof portalTabs[number]

const portalData: Record<PortalTab, {
  color: string; accent: string; label: string;
  nav: { icon: typeof BarChart2; label: string; active: boolean }[];
  stats: { label: string; value: string; color: string; bg: string }[];
  items: { dot: string; title: string; sub: string }[];
}> = {
  Student: {
    color: 'bg-blue-600', accent: 'text-blue-600', label: 'Student Portal',
    nav: [
      { icon: BarChart2, label: 'Dashboard', active: true },
      { icon: BookOpen, label: 'My Courses', active: false },
      { icon: CreditCard, label: 'Fees', active: false },
      { icon: Calendar, label: 'Timetable', active: false },
      { icon: GraduationCap, label: 'Grades', active: false },
    ],
    stats: [
      { label: 'Courses', value: '6', color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'GPA', value: '3.7', color: 'text-blue-500', bg: 'bg-blue-50' },
      { label: 'Balance', value: '$0', color: 'text-blue-700', bg: 'bg-blue-100' },
    ],
    items: [
      { dot: 'bg-blue-500', title: 'CS 301 — Live Class', sub: 'Today 10:00 AM' },
      { dot: 'bg-blue-400', title: 'Assignment: Data Structures', sub: 'Due tomorrow' },
      { dot: 'bg-blue-700', title: 'Exam: Database Systems', sub: 'Fri, 14 Jun' },
    ],
  },
  Teacher: {
    color: 'bg-blue-600', accent: 'text-blue-600', label: 'Staff Portal',
    nav: [
      { icon: BarChart2, label: 'Dashboard', active: true },
      { icon: BookOpen, label: 'My Courses', active: false },
      { icon: Users, label: 'Students', active: false },
      { icon: Video, label: 'Live Classes', active: false },
      { icon: GraduationCap, label: 'Grades', active: false },
    ],
    stats: [
      { label: 'Courses', value: '4', color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Students', value: '142', color: 'text-blue-500', bg: 'bg-blue-50' },
      { label: 'Pending', value: '7', color: 'text-blue-700', bg: 'bg-blue-100' },
    ],
    items: [
      { dot: 'bg-blue-600', title: 'Grade submissions due', sub: '12 ungraded essays' },
      { dot: 'bg-blue-400', title: 'Live class: CS 301', sub: 'Starts in 45 min' },
      { dot: 'bg-blue-300', title: 'Leave request approved', sub: '3 days — next week' },
    ],
  },
  Admin: {
    color: 'bg-blue-600', accent: 'text-blue-600', label: 'Admin Portal',
    nav: [
      { icon: BarChart2, label: 'Dashboard', active: true },
      { icon: Users, label: 'Students', active: false },
      { icon: CreditCard, label: 'Finance', active: false },
      { icon: GraduationCap, label: 'Academics', active: false },
      { icon: Briefcase, label: 'HR', active: false },
    ],
    stats: [
      { label: 'Students', value: '1,240', color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Staff', value: '86', color: 'text-blue-500', bg: 'bg-blue-50' },
      { label: 'Collected', value: '$48k', color: 'text-blue-700', bg: 'bg-blue-100' },
    ],
    items: [
      { dot: 'bg-blue-400', title: '3 leave requests pending', sub: 'HR · Needs review' },
      { dot: 'bg-blue-600', title: 'Semester 2 registration open', sub: '340 enrolled so far' },
      { dot: 'bg-blue-500', title: 'Fee collection 94%', sub: 'Up from 60% last term' },
    ],
  },
  Parent: {
    color: 'bg-blue-600', accent: 'text-blue-600', label: 'Parent Portal',
    nav: [
      { icon: BarChart2, label: 'Dashboard', active: true },
      { icon: GraduationCap, label: 'Grades', active: false },
      { icon: CreditCard, label: 'Fees', active: false },
      { icon: MessageSquare, label: 'Messages', active: false },
      { icon: Calendar, label: 'Attendance', active: false },
    ],
    stats: [
      { label: 'GPA', value: '3.7', color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Attend.', value: '95%', color: 'text-blue-500', bg: 'bg-blue-50' },
      { label: 'Balance', value: '$0', color: 'text-blue-700', bg: 'bg-blue-100' },
    ],
    items: [
      { dot: 'bg-blue-500', title: 'Semester 1 fees — Paid', sub: 'Receipt available' },
      { dot: 'bg-blue-600', title: 'Results published', sub: 'GPA: 3.7 · View now' },
      { dot: 'bg-blue-400', title: 'Message from Dr. Osei', sub: '"Amara\'s progress is excellent"' },
    ],
  },
}

const faqs = [
  { q: "Is my school's data kept separate from other schools?", a: "Yes. Every school is a fully isolated tenant. We use row-level security at the database level — no school can ever access another school's data." },
  { q: 'Can students pay with mobile money?', a: 'Yes. MTN Mobile Money and Orange Money are supported across Francophone and Anglophone Africa. Paystack handles card and bank transfers.' },
  { q: 'Can we use our own domain?', a: "Yes. Point your DNS to us, we handle the SSL certificate, and your portal is live on your own domain in under 30 minutes." },
  { q: 'Do you support French?', a: 'Yes. The platform is fully bilingual — English and French. More languages (Arabic, Swahili, Portuguese) are on the roadmap.' },
  { q: 'What happens after the trial?', a: "You'll be prompted to choose a plan. Your data is safely retained. If you don't subscribe, your data is kept for 30 days before deletion (exported on request)." },
  { q: 'Is there a student mobile app?', a: 'Yes. iOS and Android apps are available for students, parents, and staff. Schools on Pro+ plans get push notifications.' },
  { q: 'Can we import existing student data?', a: 'Yes. We support bulk CSV import for students, staff, and courses. Our migration wizard guides you through field mapping step by step.' },
]

const WINS = [
  {
    label: 'Records', icon: FileSpreadsheet,
    before: 'Student records scattered across separate Excel files per department — impossible to reconcile or audit.',
    after: 'Every student record in one searchable platform, fully auditable and accessible in seconds.',
    metric: '80% less admin time on records',
  },
  {
    label: 'Finance', icon: CreditCard,
    before: 'Bursar spends hours every Friday chasing fee payments over WhatsApp messages and phone calls.',
    after: 'Automated invoices sent on the due date with a one-tap MoMo or Paystack payment link.',
    metric: '60% → 94% avg. collection rate',
  },
  {
    label: 'Results', icon: Bell,
    before: 'Results printed and pinned to the notice board — parents find out days or weeks later.',
    after: 'Results published in one click, parents and students notified instantly via SMS and push.',
    metric: 'Delivery: weeks → seconds',
  },
  {
    label: 'Timetable', icon: Calendar,
    before: 'Timetable clashes only discovered when two classes show up in the same room on day one.',
    after: 'AI scheduler builds a fully conflict-free timetable and catches every clash before it happens.',
    metric: '100% clash-free scheduling',
  },
  {
    label: 'Payroll', icon: Briefcase,
    before: 'Staff payroll calculated manually in Excel every month — prone to errors and constant delays.',
    after: 'Payroll runs in minutes, payslips auto-generated and emailed to every staff member.',
    metric: '3 hours → 8 minutes',
  },
  {
    label: 'Retention', icon: Brain,
    before: 'No way to identify students at risk of dropping out until it is already too late to help.',
    after: 'AI flags dropout risk weeks early based on attendance, grades, and engagement patterns.',
    metric: '30% fewer student dropouts',
  },
]

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function PortalMockup({ portal }: { portal: PortalTab }) {
  const d = portalData[portal]
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-full">
      {/* Browser bar */}
      <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 text-center">
          portal.greenfield.cm/{portal.toLowerCase()}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
          <Shield className="w-3 h-3" /> Secure
        </div>
      </div>
      {/* Content */}
      <div className="flex" style={{ height: '460px' }}>
        {/* Sidebar */}
        <div className="w-48 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-gray-100 flex items-center gap-2">
            <div className={`w-7 h-7 ${d.color} rounded-lg flex items-center justify-center`}>
              <span className="text-white font-bold text-xs">G</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-none">Greenfield</p>
              <p className={`text-[10px] ${d.accent}`}>{d.label}</p>
            </div>
          </div>
          <nav className="p-2 space-y-0.5 flex-1">
            {d.nav.map((item) => (
              <div key={item.label} className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs ${item.active ? `bg-blue-50 ${d.accent} font-semibold` : 'text-gray-500'}`}>
                <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${item.active ? d.accent : 'text-gray-400'}`} />
                {item.label}
              </div>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-100 flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full ${d.color} flex items-center justify-center text-white text-[10px] font-bold`}>A</div>
            <div>
              <p className="text-[10px] font-semibold text-gray-700">Amara Mensah</p>
              <p className="text-[9px] text-gray-400">Year 3 · CS</p>
            </div>
          </div>
        </div>
        {/* Main */}
        <div className="flex-1 bg-gray-50 p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-gray-900">Good morning, Amara</p>
              <p className="text-[10px] text-gray-400">Monday, 25 May 2026</p>
            </div>
            <div className={`w-8 h-8 ${d.color} rounded-xl flex items-center justify-center`}>
              <Bell className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {d.stats.map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                <div className={`w-6 h-6 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <div className={`w-2 h-2 rounded-full ${s.color.replace('text-', 'bg-')}`} />
                </div>
                <p className={`text-lg font-bold leading-none ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Activity</p>
            {d.items.map((item) => (
              <div key={item.title} className="flex items-start gap-2.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${item.dot}`} />
                <div>
                  <p className="text-xs font-medium text-gray-800">{item.title}</p>
                  <p className="text-[10px] text-gray-400">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border-b transition-colors ${open ? 'border-blue-100 dark:border-blue-900' : 'border-gray-100 dark:border-gray-800'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between py-5 text-left gap-4 group"
      >
        <span className={`font-semibold text-sm leading-snug transition-colors ${open ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
          {q}
        </span>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${open ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="pb-5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed pr-10">
          {a}
        </div>
      )}
    </div>
  )
}

// ─── FEATURE SECTION ─────────────────────────────────────────────────────────

const featureTabs = [
  {
    id: 'finance',
    label: 'Finance',
    icon: CreditCard,
    title: 'Collect fees on time. Every time.',
    description: 'Automated invoicing, real-time payment tracking, scholarship management, and multi-gateway support — so you spend less time chasing money.',
    points: [
      'Paystack, Flutterwave, Stripe, MTN MoMo & Orange Money',
      'Auto-reminders at 7-day, 3-day, and 1-day before due date',
      'Scholarship and bursary deductions applied automatically',
      'Installment plans with per-student schedules',
      'PDF receipts and invoices on every transaction',
    ],
    mockup: (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">Fee Collection — Semester 1 2026</span>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">94% avg</span>
        </div>
        <div className="px-5 py-4 space-y-3">
          {[
            { name: 'BSc Computer Science', pct: 96, amount: '$18,240' },
            { name: 'BA Economics', pct: 88, amount: '$14,080' },
            { name: 'BSc Engineering', pct: 74, amount: '$15,880' },
          ].map((r) => (
            <div key={r.name}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-600">{r.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-800">{r.pct}%</span>
                  <span className="text-[10px] text-gray-400">{r.amount}</span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-1.5 bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${r.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 px-5 py-3 grid grid-cols-3 divide-x divide-gray-100">
          {[
            { label: 'Collected', value: '$48,200', color: 'text-gray-900' },
            { label: 'Outstanding', value: '$4,800', color: 'text-orange-600' },
            { label: 'Scholarships', value: '$3,600', color: 'text-blue-600' },
          ].map((s) => (
            <div key={s.label} className="text-center px-3">
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'lms',
    label: 'LMS & Live Classes',
    icon: Video,
    title: 'Teach, learn, and assess — all in one place.',
    description: 'A full learning management system with built-in live video. No Zoom subscription, no third-party integrations, no extra cost.',
    points: [
      'Upload slides, PDFs, videos, and SCORM content per course',
      'Built-in WebRTC video — breakout rooms, whiteboard, recording',
      'Assignment submission with deadline enforcement and late penalties',
      'AI grading assistant for objective tasks; feedback on written essays',
      'Plagiarism detection on every submission',
    ],
    mockup: (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-gray-700">CS 301 · Live Class</span>
          </div>
          <span className="text-[10px] text-gray-400">37 attending</span>
        </div>
        <div className="bg-gray-950 h-28 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-blue-950" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 bg-white/10 rounded-full border border-white/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-white/70" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Dr. Mensah · Sharing screen</p>
              <p className="text-white/50 text-[10px] mt-0.5">Data Structures — Lecture 9</p>
            </div>
          </div>
          <div className="absolute bottom-2 right-3 flex gap-1.5">
            {['Whiteboard', 'Q&A', 'Record'].map((a) => (
              <span key={a} className="text-[9px] bg-white/10 text-white/70 px-2 py-1 rounded-md font-medium">{a}</span>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-2">Course Materials</p>
          {[
            { name: 'Lecture 9 — Slides.pdf', type: 'PDF', size: '2.4 MB' },
            { name: 'Assignment 3', type: 'Task', size: 'Due Nov 14' },
          ].map((f) => (
            <div key={f.name} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-700">{f.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">{f.size}</span>
                <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{f.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'ai',
    label: 'AI Features',
    icon: Brain,
    title: 'Intelligent support for every stakeholder.',
    description: 'Powered by Claude. AI that actually understands educational context — not a generic chatbot bolted on top.',
    points: [
      'Early warning system flags at-risk students weeks in advance',
      'AI advisor recommends courses based on GPA, goals, and prerequisites',
      'Smart timetable generator resolves all conflicts automatically',
      'Essay feedback before teacher review — students improve before submission',
      'Natural language search across the entire platform',
    ],
    mockup: (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3 flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-gray-700">AI Academic Advisor</span>
          <span className="ml-auto text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">Claude</span>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex justify-end">
            <div className="bg-gray-100 rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[75%]">
              <p className="text-xs text-gray-700">"Which courses should I take next semester?"</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5">
              <Brain className="w-3 h-3 text-white" />
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
              <p className="text-xs text-gray-700 leading-relaxed">Based on your CGPA of 3.7 and remaining requirements, I recommend <strong>CS 401</strong> and <strong>MATH 302</strong>. This keeps you on track for May 2027 graduation.</p>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-3.5 py-2.5">
            <p className="text-[10px] text-orange-700 font-semibold mb-0.5">Early Warning — 3 students flagged</p>
            <p className="text-[10px] text-orange-600">Attendance below 60% in CS 301. Recommend outreach.</p>
          </div>
        </div>
        <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-2">
          <input disabled className="flex-1 text-xs text-gray-400 bg-transparent outline-none" placeholder="Ask anything..." />
          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>
    ),
  },
  {
    id: 'academics',
    label: 'Academics',
    icon: GraduationCap,
    title: 'From registration to transcript — fully digital.',
    description: 'Replace paper-based processes with a complete academic management system that students and staff can access from anywhere.',
    points: [
      'Course registration with prerequisite validation and clash detection',
      'AI-assisted timetable generator — conflict-free in minutes',
      'Grade entry, GPA calculation, and result publication controls',
      'Official transcripts with QR authentication code',
      'Attendance tracking via QR code, manual, or auto-mark on class join',
    ],
    mockup: (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">My Courses — Semester 1 2026</span>
          <span className="text-xs text-blue-600 font-medium">18 credits</span>
        </div>
        <div className="px-5 py-3 space-y-2">
          {[
            { code: 'CS 301', name: 'Data Structures', grade: 'A', attendance: 91 },
            { code: 'MATH 201', name: 'Linear Algebra', grade: 'B+', attendance: 84 },
            { code: 'CS 310', name: 'Algorithms', grade: 'A-', attendance: 96 },
          ].map((c) => (
            <div key={c.code} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800">{c.code} · {c.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Attendance {c.attendance}%</p>
              </div>
              <span className="text-sm font-bold text-gray-800">{c.grade}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 px-5 py-3 grid grid-cols-3 divide-x divide-gray-100">
          {[
            { label: 'CGPA', value: '3.71' },
            { label: 'Credits', value: '84 / 120' },
            { label: 'Standing', value: 'Honors' },
          ].map((s) => (
            <div key={s.label} className="text-center px-2">
              <p className="text-sm font-bold text-gray-900">{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

const secondaryFeatures = [
  {
    icon: Briefcase,
    title: 'HR & Payroll',
    description: 'Staff records, payroll, leave management, performance reviews, and recruitment pipelines.',
  },
  {
    icon: Palette,
    title: 'Custom Branding',
    description: 'White-label portals on your own domain — students only ever see your school name.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'SMS, WhatsApp, push, and email alerts — all automated, with per-user preferences.',
  },
  {
    icon: Building2,
    title: 'Student Life',
    description: 'Clubs, hostel allocation, elections, cafeteria, and campus events in one place.',
  },
  {
    icon: Award,
    title: 'Career & Alumni',
    description: 'Job board, internship tracking, CV builder, and an active alumni network.',
  },
  {
    icon: Library,
    title: 'Digital Library',
    description: 'E-books, journals, research papers, digital borrowing, and course reading lists.',
  },
]

function FeatureSection() {
  const [activeTab, setActiveTab] = useState<number>(0)
  const active = featureTabs[activeTab]
  const ActiveIcon = active.icon

  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="outline" className="mb-4 px-3 py-1 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 font-medium">
            19 integrated modules
          </Badge>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Everything your school needs</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            One platform. All under your school&apos;s brand.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {featureTabs.map((tab, i) => {
            const Icon = tab.icon
            const isActive = activeTab === i
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40 scale-[1.03]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg shadow-gray-100 dark:shadow-gray-900 overflow-hidden mb-6 border-t-2 border-t-blue-500"
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left — text */}
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
                  <ActiveIcon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-snug">{active.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">{active.description}</p>
                <ul className="space-y-3">
                  {active.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Right — mockup */}
              <div className="bg-blue-50/40 dark:bg-gray-900 border-t md:border-t-0 md:border-l border-blue-100 dark:border-gray-700 p-8 flex items-center justify-center">
                <div className="w-full max-w-sm">
                  {active.mockup}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Secondary features grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={{ visible: { transition: { staggerChildren: 0.06 } }, hidden: {} }}
        >
          {secondaryFeatures.map((f) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-blue-50 dark:hover:shadow-blue-950/20 transition-all cursor-default"
              >
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">{f.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.description}</p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href="/features"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:text-blue-600 transition-colors bg-white dark:bg-gray-800"
          >
            See all 19 modules <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  )
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function submit(e: React.SyntheticEvent) {
    e.preventDefault()
    setSent(true)
  }

  if (sent) {
    return (
      <div className="inline-flex items-center gap-2 bg-white/15 text-white rounded-2xl px-6 py-3 font-semibold text-sm">
        <CheckCircle className="w-4 h-4" /> You are subscribed — welcome aboard!
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
      <input
        type="email" required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 px-4 py-3 rounded-xl text-sm bg-white/15 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/40"
      />
      <button
        type="submit"
        className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl text-sm hover:bg-blue-50 transition-colors flex-shrink-0"
      >
        Subscribe
      </button>
    </form>
  )
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [activePortal, setActivePortal] = useState<PortalTab>('Student')
  const [annual, setAnnual] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startAutoSwipe = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActivePortal(prev => {
        const idx = portalTabs.indexOf(prev)
        return portalTabs[(idx + 1) % portalTabs.length]
      })
    }, 3500)
  }, [])

  useEffect(() => {
    startAutoSwipe()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [startAutoSwipe])

  const [activeWin, setActiveWin] = useState(0)
  const winIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startWinAutoSwipe = useCallback(() => {
    if (winIntervalRef.current) clearInterval(winIntervalRef.current)
    winIntervalRef.current = setInterval(() => {
      setActiveWin(prev => (prev + 1) % WINS.length)
    }, 4000)
  }, [])

  useEffect(() => {
    startWinAutoSwipe()
    return () => { if (winIntervalRef.current) clearInterval(winIntervalRef.current) }
  }, [startWinAutoSwipe])

  const pricingPlans = [
    {
      name: 'Starter', limit: '500 students',
      monthly: 2, desc: 'Core modules for small institutions',
      color: 'border-gray-200', badge: null,
      features: ['All core academic modules', 'Finance & fee collection', 'Student & parent portals', 'Email notifications', '5 GB storage', '14-day free trial'],
      cta: 'Start Free Trial', href: '/register',
      ctaStyle: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
    },
    {
      name: 'Growth', limit: '5,000 students',
      monthly: 1.5, desc: 'LMS, live classes, and priority support',
      color: 'border-blue-500 ring-2 ring-blue-500', badge: 'Most Popular',
      features: ['Everything in Starter', 'Full LMS + live classes', 'HR management + payroll', 'WhatsApp & SMS alerts', 'Parent portal', '50 GB storage', 'Priority support'],
      cta: 'Start Free Trial', href: '/register',
      ctaStyle: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200',
    },
    {
      name: 'Institution', limit: 'Unlimited students',
      monthly: 1, desc: 'Custom domain, AI, and dedicated support',
      color: 'border-gray-200', badge: null,
      features: ['Everything in Growth', 'Custom domain + branding', 'AI features (advisor, early warning)', 'REST API + webhooks', 'Advanced analytics', '500 GB storage', 'Dedicated support'],
      cta: 'Start Free Trial', href: '/register',
      ctaStyle: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-12 pb-0 lg:pt-20">
        {/* Background mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#dbeafe,transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.15),transparent)] pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6">
          {/* Pill badge */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-full px-4 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              Now live in 15+ countries across Africa
            </div>
          </div>

          {/* Headline — centred */}
          <div className="text-center mb-8 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-[72px] font-bold text-gray-900 dark:text-white leading-[1.05] tracking-tight mb-6">
              The school platform<br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                built for Africa
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Replace the WhatsApp groups and Excel sheets. Run your whole institution — academics, finance, HR, and live classes — from one platform under your school's brand.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link href="/register" className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-base font-semibold transition-all shadow-xl shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0">
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="/contact" className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:-translate-y-0.5 active:translate-y-0">
              Book a demo
            </a>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-gray-500 mb-16">
            <span className="text-gray-400 dark:text-gray-500">14-day free trial · No credit card</span>
            <span className="w-px h-4 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['A','F','J','K','M'].map((l, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold ${['bg-blue-500','bg-indigo-500','bg-teal-500','bg-violet-500','bg-blue-600'][i]}`}>{l}</div>
                ))}
              </div>
              <span><strong className="text-gray-900 dark:text-white">50+</strong> institutions trust Tera SM</span>
            </div>
            <span className="w-px h-4 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
              <span className="ml-1 text-gray-600 dark:text-gray-400">4.9 / 5 from 200+ reviews</span>
            </div>
          </div>

          {/* Portal tab switcher */}
          <div className="flex items-center justify-center gap-1.5 mb-8">
            {portalTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActivePortal(tab); startAutoSwipe() }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activePortal === tab
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Dashboard mockup — 3D tilted, fades into next section */}
          <div className="relative max-w-6xl mx-auto" style={{ perspective: '1400px' }}>
            {/* Glow behind */}
            <div className="absolute inset-x-0 -top-8 h-56 bg-blue-200/50 dark:bg-blue-900/25 blur-3xl rounded-full pointer-events-none" />

            {/* Floating badges — counter-tilted so they appear flat */}
            <div className="absolute -left-4 lg:-left-8 top-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3 z-20 hidden md:flex" style={{ transform: 'rotateX(-5deg) rotateY(4deg)' }}>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-950/50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">Fee paid</p>
                <p className="text-[10px] text-gray-400">via MTN MoMo</p>
              </div>
            </div>
            <div className="absolute -right-4 lg:-right-8 top-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3 z-20 hidden md:flex" style={{ transform: 'rotateX(-5deg) rotateY(-4deg)' }}>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950/50 rounded-xl flex items-center justify-center">
                <Video className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">Class starting</p>
                <p className="text-[10px] text-gray-400">CS 301 · 2 min</p>
              </div>
            </div>

            {/* 3D tilt wrapper */}
            <div
              className="relative rounded-2xl"
              style={{
                transform: 'rotateX(8deg) rotateY(-3deg)',
                transformStyle: 'preserve-3d',
                boxShadow: '0 40px 80px -20px rgba(59,130,246,0.25), 0 24px 48px -12px rgba(0,0,0,0.18)',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePortal}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <PortalMockup portal={activePortal} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Fade to white at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none rounded-b-2xl" />
          </div>
        </div>
      </section>

      {/* ── Logo Cloud ── */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800 overflow-hidden">
        <p className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-8">
          Trusted by institutions across Africa
        </p>
        <div
          className="relative"
          style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
        >
          <div className="flex animate-marquee gap-12 whitespace-nowrap">
            {[...schools, ...schools].map((school, i) => (
              <div key={i} className="flex items-center gap-2.5 flex-shrink-0">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{school}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats row ── */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '50+', label: 'Institutions', sub: 'across 15 countries', color: 'text-blue-600' },
              { value: '100k+', label: 'Students', sub: 'on the platform', color: 'text-indigo-600' },
              { value: '94%', label: 'Fee collection rate', sub: 'avg. after switch', color: 'text-green-600' },
              { value: '40%', label: 'Admin time saved', sub: 'reported by schools', color: 'text-orange-500' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center hover:shadow-sm transition-shadow">
                <p className={`text-4xl font-bold ${s.color} mb-1`}>{s.value}</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why choose Tera SM ── */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-4xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-800/50 rounded-full px-4 py-1.5 text-sm text-blue-400 font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Why choose Tera SM
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Replace the chaos, not just the tools</h2>
            <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
              Most institutions run on WhatsApp groups and Excel sheets. Here is what changes the day you switch.
            </p>
          </div>

          {/* Tab pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {WINS.map((w, i) => {
              const Icon = w.icon
              return (
                <button
                  key={i}
                  onClick={() => { setActiveWin(i); startWinAutoSwipe() }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeWin === i
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {w.label}
                </button>
              )
            })}
          </div>

          {/* Comparison card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeWin}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Before */}
                <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-7 h-7 bg-red-500/15 rounded-lg flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Before</span>
                  </div>
                  <p className="text-slate-300 text-base leading-relaxed">{WINS[activeWin].before}</p>
                </div>

                {/* After */}
                <div className="bg-blue-600 rounded-3xl p-8">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">With Tera SM</span>
                  </div>
                  <p className="text-white text-base leading-relaxed">{WINS[activeWin].after}</p>
                </div>
              </div>

              {/* Metric callout */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-3 bg-blue-950/70 border border-blue-500/25 rounded-2xl px-8 py-4">
                  <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-xl font-bold text-white">{WINS[activeWin].metric}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-8">
            {WINS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActiveWin(i); startWinAutoSwipe() }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeWin === i ? 'w-8 bg-blue-500' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold transition-colors"
            >
              Stop the chaos — start your free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-slate-600 text-sm mt-3">14-day trial · No credit card required</p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <FeatureSection />


      {/* ── Portal Preview ── */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">A portal for everyone</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Tailored experiences for every role — all under your institution's brand.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
            {portalTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActivePortal(tab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activePortal === tab
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <PortalMockup portal={activePortal} />
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-6">
            All portals are white-labelled — students only see your school's name and logo.
          </p>
        </div>
      </section>

      {/* ── Mobile App ── */}
      <MobileAppSection />

      {/* ── Africa-First ── */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-full px-4 py-1.5 text-sm text-blue-700 dark:text-blue-400 font-medium mb-6">
                <Globe className="w-3.5 h-3.5" />
                Africa-first design
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Built for how Africa pays, communicates, and connects
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
                We didn't adapt a Western product for Africa — we built from the ground up
                for the infrastructure, payment rails, and languages of African institutions.
              </p>
              <div className="space-y-4">
                {[
                  { label: 'MTN Mobile Money', desc: 'Students pay fees directly via MoMo', color: 'bg-yellow-400' },
                  { label: 'Orange Money', desc: 'Supported across Francophone Africa', color: 'bg-orange-500' },
                  { label: 'Paystack', desc: 'Cards + bank transfers, Nigeria & beyond', color: 'bg-blue-600' },
                  { label: "Africa's Talking SMS", desc: 'Bulk SMS to 40+ African networks', color: 'bg-blue-500' },
                  { label: 'French + English', desc: 'Fully bilingual — more languages coming', color: 'bg-indigo-600' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.color}`} />
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">— {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Smartphone, title: 'Mobile-first PWA', desc: 'Works on 2G/3G. Offline mode for low-connectivity areas.' },
                { icon: Wifi, title: 'Low-bandwidth LMS', desc: 'Video streaming optimized for African internet speeds.' },
                { icon: Globe, title: 'Cloudflare CDN', desc: 'African PoPs in Lagos, Nairobi, Cape Town, and Cairo.' },
                { icon: Languages, title: 'Bilingual support', desc: 'Switch between English and French in one click.' },
              ].map((card) => (
                <div key={card.title} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-shadow">
                  <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center mb-3">
                    <card.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{card.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WhatsApp ── */}
      <WhatsAppShowcase />

      {/* ── Integrations ── */}
      <IntegrationsSection />

      {/* ── Custom Domain ── */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — branded portal preview */}
            <div>
              {/* Mini browser mockup */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mb-6" style={{ boxShadow: '0 32px 64px -16px rgba(0,0,0,0.5)' }}>
                {/* Browser bar */}
                <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1.5 flex items-center gap-2 border border-gray-200">
                    <Shield className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-gray-700 font-medium">portal.ubuea.cm</span>
                    <span className="ml-auto text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-semibold">SSL ✓</span>
                  </div>
                </div>
                {/* Portal preview content */}
                <div className="flex" style={{ height: '240px' }}>
                  {/* Sidebar */}
                  <div className="w-44 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
                    <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">UB</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-none">Univ. of Buea</p>
                        <p className="text-[10px] text-blue-600">Student Portal</p>
                      </div>
                    </div>
                    <nav className="p-2 space-y-0.5 flex-1">
                      {[
                        { icon: BarChart2, label: 'Dashboard', active: true },
                        { icon: BookOpen, label: 'My Courses', active: false },
                        { icon: CreditCard, label: 'Fees', active: false },
                        { icon: GraduationCap, label: 'Grades', active: false },
                      ].map((item) => (
                        <div key={item.label} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${item.active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-400'}`}>
                          <item.icon className={`w-3 h-3 flex-shrink-0 ${item.active ? 'text-blue-600' : 'text-gray-300'}`} />
                          {item.label}
                        </div>
                      ))}
                    </nav>
                    <div className="p-3 border-t border-gray-100">
                      <p className="text-[9px] text-gray-300">© 2026 Univ. of Buea</p>
                    </div>
                  </div>
                  {/* Main */}
                  <div className="flex-1 bg-gray-50 p-4 overflow-hidden">
                    <p className="text-xs font-bold text-gray-800 mb-1">Welcome back, Amara</p>
                    <p className="text-[10px] text-gray-400 mb-4">portal.ubuea.cm · Powered by Tera SM</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Courses', value: '6', bg: 'bg-blue-50', color: 'text-blue-600' },
                        { label: 'GPA', value: '3.7', bg: 'bg-blue-50', color: 'text-blue-500' },
                      ].map((s) => (
                        <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
                          <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-[9px] text-gray-400">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 bg-white rounded-xl border border-gray-100 p-3">
                      <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Upcoming</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <p className="text-[10px] text-gray-700">CS 301 — Live Class · Today 10:00 AM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Domain flip */}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-500 line-through">ubuea.terasms.com</span>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 flex items-center gap-2 bg-blue-600/10 border border-blue-500/30 rounded-xl px-4 py-3">
                  <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-blue-300 font-semibold">portal.ubuea.cm</span>
                </div>
              </div>
            </div>

            {/* Right — value prop + steps */}
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-800/50 rounded-full px-4 py-1.5 text-sm text-blue-400 font-medium mb-6">
                <Palette className="w-3.5 h-3.5" />
                White-label branding
              </div>
              <h2 className="text-4xl font-bold text-white mb-3 leading-tight">
                Your logo.<br />
                Your colors.<br />
                Your domain.
              </h2>
              <p className="text-slate-400 mb-10 leading-relaxed">
                Students, parents, and staff only ever see your institution's name. Tera SM is invisible — it's your product.
              </p>

              {/* Timeline steps */}
              <div className="relative space-y-0">
                <div className="absolute left-4 top-5 bottom-5 w-px bg-blue-900" />
                {[
                  { title: 'Enter your domain', desc: 'Type your domain (e.g. portal.yourschool.cm) in the branding settings panel.' },
                  { title: 'Add a CNAME record', desc: 'Point it to our servers — takes 2 minutes in any domain registrar.' },
                  { title: 'Go live instantly', desc: 'SSL certificate issued automatically. Your branded portal is live within minutes.' },
                ].map((s, i) => (
                  <div key={s.title} className="relative flex gap-5 pb-8 last:pb-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0 relative z-10 border-2 border-gray-950">
                      {i + 1}
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold text-white mb-1">{s.title}</h4>
                      <p className="text-sm text-slate-400">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Badge */}
              <div className="mt-8 inline-flex items-center gap-2.5 bg-blue-600/15 border border-blue-500/25 rounded-2xl px-5 py-3">
                <Zap className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-blue-300">Average setup time: under 30 minutes</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-full px-4 py-1.5 text-sm text-blue-700 dark:text-blue-400 font-medium mb-5">
              <Zap className="w-3.5 h-3.5" />
              Quick setup
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Up and running in 3 steps</h2>
            <p className="text-gray-500 dark:text-gray-400">No IT team required. No lengthy onboarding.</p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-6">

            {/* Step 1 */}
            <div className="rounded-3xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-7 flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold text-sm">1</div>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Set up</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Sign up &amp; customise</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">Add your school's logo, brand colors, custom domain, and choose which modules to enable — all in a guided wizard.</p>
              {/* Micro-visual: branding panel */}
              <div className="mt-auto bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-blue-900/50 p-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Branding setup</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xs">UB</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-white">Univ. of Buea</p>
                    <p className="text-[10px] text-gray-400">portal.ubuea.cm</p>
                  </div>
                  <div className="ml-auto w-5 h-5 bg-blue-600 rounded-md border-2 border-white dark:border-gray-900 shadow" title="Brand color" />
                </div>
                <div className="h-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
                  <div className="h-1.5 bg-blue-500 rounded-full w-2/3" />
                </div>
                <p className="text-[9px] text-gray-400 mt-1.5">Setup — 66% complete</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-3xl border border-blue-200 dark:border-blue-800/60 bg-blue-100/40 dark:bg-blue-900/20 p-7 flex flex-col md:mt-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-xl flex items-center justify-center font-bold text-sm">2</div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Import</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Import your data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">Upload your existing students, staff, and courses via CSV — or start fresh. Our migration wizard maps every field.</p>
              {/* Micro-visual: import progress */}
              <div className="mt-auto bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-blue-800/50 p-4 space-y-2.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Importing data</p>
                {[
                  { label: 'Students', count: '1,240', pct: 100 },
                  { label: 'Staff', count: '86', pct: 100 },
                  { label: 'Courses', count: '42', pct: 78 },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">{r.label}</span>
                      <span className="text-gray-400">{r.count}</span>
                    </div>
                    <div className="h-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
                      <div className="h-1.5 bg-blue-500 rounded-full transition-all" style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-3xl border border-blue-300 dark:border-blue-700/60 bg-blue-600 p-7 flex flex-col md:mt-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-white/20 text-white rounded-xl flex items-center justify-center font-bold text-sm">3</div>
                <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">Go live</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Share &amp; go live</h3>
              <p className="text-sm text-blue-100 leading-relaxed mb-6">Share login links with students and staff. They onboard themselves with guided flows — you're live from day one.</p>
              {/* Micro-visual: live screen */}
              <div className="mt-auto bg-white/15 rounded-2xl border border-white/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
                  <p className="text-[10px] font-semibold text-white">portal.ubuea.cm is live</p>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Students online', value: '340' },
                    { label: 'Classes today', value: '12' },
                    { label: 'Fees collected', value: '$8,400' },
                  ].map((s) => (
                    <div key={s.label} className="flex justify-between text-[10px]">
                      <span className="text-blue-200">{s.label}</span>
                      <span className="font-bold text-white">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* CTA */}
          <div className="text-center mt-14">
            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 dark:shadow-blue-900/40">
              Start your free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-3 flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              Most schools are live within 1 hour
            </p>
          </div>

        </div>
      </section>

      {/* ── Switching ── */}
      <SwitchingSection />

      {/* ── ROI Calculator ── */}
      <ROICalculator />

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Simple, per-student pricing</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Pay only for active enrolled students. Free 14-day trial on all plans.</p>
            <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-1.5">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${!annual ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${annual ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Annual
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start mb-8">
            {pricingPlans.map((tier) => {
              const price = annual ? (tier.monthly * 0.8).toFixed(2) : tier.monthly.toFixed(2)
              return (
                <div key={tier.name} className={`rounded-3xl border-2 p-8 relative bg-white dark:bg-gray-800 ${tier.color}`}>
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                      {tier.badge}
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{tier.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{tier.desc}</p>
                  </div>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">${price}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm"> /student/month</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-6">{tier.limit}{annual ? ' · billed annually' : ''}</p>
                  <Link href={tier.href} className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all mb-8 ${tier.ctaStyle}`}>
                    {tier.cta}
                  </Link>
                  <ul className="space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          <div className="bg-gray-900 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-white text-lg mb-1">Enterprise</h3>
              <p className="text-gray-400 text-sm">Unlimited students · Custom SLA · On-premise option · Dedicated account manager</p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="text-white font-bold text-lg">Custom pricing</span>
              <a href="/contact" className="px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2">
                Talk to us <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-gray-400">All plans include a 14-day free trial — no credit card required.</p>
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              View full pricing & feature comparison <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Trusted by educators across Africa</h2>
            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-10">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
              <span className="text-gray-600 text-sm ml-2">4.9 / 5 from 200+ reviews</span>
            </div>
            {/* Metrics callout */}
            <div className="grid grid-cols-3 max-w-2xl mx-auto gap-4">
              {[
                { value: '94%', label: 'avg. fee collection rate' },
                { value: '30%', label: 'fewer student dropouts' },
                { value: '40%', label: 'less admin time' },
              ].map((m) => (
                <div key={m.label} className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl py-4 px-3">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{m.value}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Dr. Amara Osei', role: 'Principal', inst: 'Accra Academy, Ghana', quote: 'Tera SM transformed how we manage student data. The AI early warning system alone helped us reduce dropouts by 30% in one semester.', init: 'A' },
              { name: 'Prof. Fatima Al-Hassan', role: 'Registrar', inst: 'Lagos University, Nigeria', quote: 'The live classes and LMS replaced three separate tools we were paying for. Our lecturers love the all-in-one experience.', init: 'F' },
              { name: 'Mr. James Kariuki', role: 'Finance Director', inst: 'Nairobi College, Kenya', quote: 'Fee collection went from 60% to 94% after moving to Tera SM. Mobile money integration changed everything.', init: 'J' },
            ].map((t) => (
              <div key={t.name} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm">{t.init}</div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role} · {t.inst}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/case-studies" className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700">
              Read full case studies <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Demo Booking ── */}
      <BookingSection />

      {/* ── FAQ ── */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-[380px_1fr] gap-16 items-start">

            {/* Left — sticky anchor */}
            <div className="lg:sticky lg:top-24">
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-full px-4 py-1.5 text-sm text-blue-700 dark:text-blue-400 font-medium mb-5">
                <MessageSquare className="w-3.5 h-3.5" />
                FAQ
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                Frequently<br />asked questions
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                Everything you need to know before getting started. Can't find your answer?
              </p>

              {/* Escape hatches */}
              <div className="space-y-3 mb-10">
                <a
                  href="/contact"
                  className="flex items-center gap-3 w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
                >
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Chat with our team</p>
                    <p className="text-xs text-gray-400">We reply within a few minutes</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                </a>
                <a
                  href="/docs"
                  className="flex items-center gap-3 w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
                >
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Browse documentation</p>
                    <p className="text-xs text-gray-400">Guides, API reference, tutorials</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                </a>
              </div>

              {/* Trust micro-badges */}
              <div className="space-y-2.5">
                {[
                  { icon: Shield, text: 'Data fully isolated per school' },
                  { icon: CheckCircle, text: '14-day free trial, no credit card' },
                  { icon: Globe, text: 'Cancel or export data anytime' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                    <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — grouped accordion */}
            <div className="space-y-10">

              {/* Group 1 */}
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Data &amp; Security</p>
                <div>
                  {faqs.slice(0, 1).map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
                </div>
              </div>

              {/* Group 2 */}
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Payments &amp; Setup</p>
                <div>
                  {faqs.slice(1, 4).map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
                </div>
              </div>

              {/* Group 3 */}
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Product &amp; Plans</p>
                <div>
                  {faqs.slice(4).map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
                </div>
              </div>

              {/* Bottom strip */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Still have questions?</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Our team is happy to walk you through anything.</p>
                </div>
                <Link
                  href="/contact"
                  className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  Talk to us <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-3">Stay in the loop</p>
          <h2 className="text-2xl font-bold text-white mb-2">EdTech insights for African school leaders</h2>
          <p className="text-blue-100 text-sm mb-8">Product updates, best practices, and case studies — delivered monthly. No spam.</p>
          <NewsletterForm />
        </div>
      </section>

      {/* ── Trust badges ── */}
      <section className="py-16 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Shield, title: 'SOC 2 Compliant', desc: 'Enterprise-grade security' },
              { icon: Globe, title: 'GDPR Ready', desc: 'Data privacy built-in' },
              { icon: Zap, title: '99.9% Uptime', desc: 'Always-on reliability' },
              { icon: CheckCircle, title: 'Daily Backups', desc: 'Point-in-time recovery' },
            ].map((b) => (
              <div key={b.title}>
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 border border-gray-100 dark:border-gray-700">
                  <b.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{b.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section id="contact" className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-white font-medium mb-8">
            <TrendingUp className="w-3.5 h-3.5" />
            50+ institutions already modernised
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to modernise your institution?</h2>
          <p className="text-blue-100 text-lg mb-10">
            Get started in minutes — no credit card needed. Our team will help you go live in your first week.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-2xl font-semibold hover:bg-blue-50 transition-all shadow-lg">
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="mailto:hello@terasms.com" className="px-8 py-4 border border-white/30 text-white rounded-2xl font-semibold hover:bg-white/10 transition-all">
              Talk to us
            </a>
          </div>
          <p className="text-blue-200 text-sm mt-6">14-day free trial · No credit card · Cancel anytime</p>
        </div>
      </section>
    </div>
  )
}
