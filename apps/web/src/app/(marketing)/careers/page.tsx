'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  MapPin, Clock, Briefcase,
  Search, X, Mail,
  Laptop, Gem, HeartHandshake, FlameKindling, TrendingUp, Palmtree,
  DollarSign, Sparkles, CheckCircle2, Users,
  FileText, Phone, MessageSquare, Gift,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '50+',    label: 'Schools using Tera SM' },
  { value: '100k+',  label: 'Students on the platform' },
  { value: '8',      label: 'African countries' },
  { value: 'Remote', label: 'Work from anywhere' },
]

const PERKS = [
  { icon: Laptop,        bg: 'bg-indigo-50', iconCls: 'text-indigo-600', title: 'Remote-first',      desc: 'Work from anywhere in Africa or the world. No HQ bias — output beats presence.' },
  { icon: Gem,           bg: 'bg-indigo-50', iconCls: 'text-indigo-600', title: 'Equity for all',    desc: 'Every full-time employee receives meaningful equity. We grow together.' },
  { icon: HeartHandshake,bg: 'bg-indigo-50', iconCls: 'text-indigo-600', title: 'Health coverage',   desc: 'Comprehensive health insurance for you and your dependants.' },
  { icon: FlameKindling, bg: 'bg-indigo-50', iconCls: 'text-indigo-600', title: 'Learning budget',   desc: '$1,000/year for courses, conferences, and books. We invest in your growth.' },
  { icon: TrendingUp,    bg: 'bg-indigo-50', iconCls: 'text-indigo-600', title: 'Fast career growth', desc: 'We promote from within. Many of our leads started as individual contributors.' },
  { icon: Palmtree,      bg: 'bg-indigo-50', iconCls: 'text-indigo-600', title: 'Generous leave',    desc: '25 days paid leave + public holidays in your country + mental health days.' },
]

const VALUES = [
  { accent: 'border-blue-500',   label: 'Ship with purpose',       desc: 'We build for real schools, not demos. Every feature goes live on institutions that depend on it.' },
  { accent: 'border-green-500',  label: 'Radical transparency',    desc: 'Strategy, financials, and priorities are shared openly. No black boxes.' },
  { accent: 'border-purple-500', label: 'Disagree and commit',     desc: 'We debate hard, decide together, and execute with full alignment.' },
  { accent: 'border-amber-500',  label: 'Africa-first thinking',   desc: 'Every decision considers low bandwidth, mobile-first users, and local payment rails.' },
]

const QUOTES = [
  { name: 'Adaeze Okonkwo', role: 'Senior Full-Stack Engineer', initials: 'AO', color: 'bg-blue-600', quote: 'The pace is unlike anything I have experienced. Features I build on Monday are live in schools by Friday. That feedback loop is addictive.' },
  { name: 'Kwame Asante',   role: 'Customer Success Manager',   initials: 'KA', color: 'bg-teal-600', quote: 'I joined from a fintech company and the mission shift was immediate. When a school admin tells you we saved their semester, that hits differently.' },
  { name: 'Fatima Al-Rashid', role: 'UX Designer',              initials: 'FA', color: 'bg-purple-600', quote: 'Designing for 100,000+ students across 8 countries is a design challenge I could not pass up. No two institutions are the same — and that keeps it interesting.' },
]

const TEAM_GRID = [
  { initials: 'AO', color: 'bg-blue-600',   name: 'Adaeze',   role: 'Engineering', location: 'Lagos 🇳🇬' },
  { initials: 'KA', color: 'bg-teal-600',   name: 'Kwame',    role: 'Growth',      location: 'Accra 🇬🇭' },
  { initials: 'FA', color: 'bg-purple-600', name: 'Fatima',   role: 'Design',      location: 'Cairo 🇪🇬' },
  { initials: 'JN', color: 'bg-amber-500',  name: 'Jean',     role: 'Growth',      location: 'Dakar 🇸🇳' },
  { initials: 'EB', color: 'bg-green-600',  name: 'Emmanuel', role: 'Product',     location: 'Nairobi 🇰🇪' },
  { initials: 'MI', color: 'bg-red-500',    name: 'Mira',     role: 'Support',     location: 'Remote 🌍' },
  { initials: 'SO', color: 'bg-indigo-600', name: 'Samuel',   role: 'DevOps',      location: 'London 🇬🇧' },
  { initials: 'DN', color: 'bg-pink-500',   name: 'Diana',    role: 'Education',   location: 'Kigali 🇷🇼' },
  { initials: 'YT', color: 'bg-cyan-600',   name: 'Yemi',     role: 'Engineering', location: 'Abuja 🇳🇬' },
]

interface Job {
  id: string
  title: string
  dept: Dept
  type: 'Full-time' | 'Contract' | 'Part-time'
  location: string
  level: 'Lead' | 'Senior' | 'Mid' | 'Junior'
  salary: string
  isNew: boolean
  description: string
  responsibilities: string[]
  requirements: string[]
}

type Dept = 'Engineering' | 'Product' | 'Growth' | 'Education' | 'Support'
const DEPTS: Dept[] = ['Engineering', 'Product', 'Growth', 'Education', 'Support']


const LEVEL_COLORS: Record<Job['level'], string> = {
  Lead:   'bg-purple-50 text-purple-700 border-purple-100',
  Senior: 'bg-blue-50 text-blue-700 border-blue-100',
  Mid:    'bg-teal-50 text-teal-700 border-teal-100',
  Junior: 'bg-gray-50 text-gray-600 border-gray-200',
}

const JOBS: Job[] = [
  {
    id: 'swe-fullstack', title: 'Senior Full-Stack Engineer', dept: 'Engineering',
    type: 'Full-time', location: 'Remote (Africa)', level: 'Senior', salary: '$80k–$110k', isNew: true,
    description: 'Own features end-to-end across our Next.js frontend and NestJS backend. You will work closely with product and design to ship modules used by tens of thousands of students.',
    responsibilities: ['Build and ship full-stack features across the Tera SM platform', 'Review code and mentor mid-level engineers', 'Contribute to architecture decisions and technical roadmap', 'Write tests and ensure high code quality across your domain'],
    requirements: ['5+ years full-stack experience (React/Next.js + Node.js)', 'Strong TypeScript fundamentals', 'Experience with PostgreSQL and an ORM (Prisma preferred)', 'Comfortable working async in a remote environment'],
  },
  {
    id: 'swe-backend', title: 'Backend Engineer — NestJS & Prisma', dept: 'Engineering',
    type: 'Full-time', location: 'Remote (Global)', level: 'Mid', salary: '$60k–$85k', isNew: true,
    description: 'Build the APIs, background jobs, and data pipelines that power every portal in Tera SM. You will work on high-impact modules like finance, grading, and notifications.',
    responsibilities: ['Design and build REST APIs using NestJS', 'Write Prisma migrations and optimise database queries', 'Build background jobs using BullMQ for PDF generation, emails, and reports', 'Maintain 99.9% uptime for critical school operations'],
    requirements: ['3+ years backend experience with Node.js', 'Hands-on NestJS and Prisma/TypeORM experience', 'Solid PostgreSQL knowledge', 'Experience with Redis and job queues'],
  },
  {
    id: 'swe-mobile', title: 'Mobile Engineer — React Native', dept: 'Engineering',
    type: 'Full-time', location: 'Remote (Africa)', level: 'Senior', salary: '$75k–$100k', isNew: false,
    description: 'Build the Tera SM mobile apps for students, staff, and parents on iOS and Android using Expo and React Native.',
    responsibilities: ['Build and ship iOS and Android apps using Expo Router', 'Implement offline-first functionality for low-connectivity environments', 'Integrate push notifications via Expo Notifications and Firebase FCM', 'Collaborate with design to build pixel-perfect mobile UI'],
    requirements: ['4+ years React Native experience', 'Published apps on App Store and Google Play', 'Experience with Expo and EAS Build', 'Strong understanding of mobile performance and offline patterns'],
  },
  {
    id: 'swe-devops', title: 'DevOps / Platform Engineer', dept: 'Engineering',
    type: 'Full-time', location: 'Remote (Global)', level: 'Senior', salary: '$85k–$115k', isNew: false,
    description: 'Own the infrastructure that keeps Tera SM running for 50+ institutions across Africa. Vercel, Railway, Neon, Upstash, Cloudflare — and growing.',
    responsibilities: ['Manage and improve CI/CD pipelines on GitHub Actions', 'Monitor infrastructure with Sentry and Axiom', 'Own database backup, recovery, and data residency configurations', 'Evaluate and onboard new infrastructure tooling'],
    requirements: ['4+ years DevOps/SRE experience', 'Hands-on with Vercel, Railway, or similar PaaS', 'Strong knowledge of PostgreSQL operations and Neon/serverless Postgres', 'Experience with Cloudflare products'],
  },
  {
    id: 'pm-core', title: 'Product Manager — Core Platform', dept: 'Product',
    type: 'Full-time', location: 'Remote (Africa)', level: 'Senior', salary: '$70k–$95k', isNew: true,
    description: 'Drive the roadmap for core academic and finance modules. Work directly with school administrators, teachers, and students to understand pain points and ship solutions.',
    responsibilities: ['Own the roadmap for academics and finance modules', 'Run discovery interviews with school admins and registrars', 'Write clear product specs and work with engineering to deliver', 'Define and track success metrics for every feature shipped'],
    requirements: ['4+ years product management in B2B SaaS', 'Experience working with complex, multi-role products', 'Ability to translate institutional workflows into product requirements', 'Bonus: prior experience in EdTech or African markets'],
  },
  {
    id: 'design-ux', title: 'Senior UX / Product Designer', dept: 'Product',
    type: 'Full-time', location: 'Remote (Global)', level: 'Senior', salary: '$65k–$90k', isNew: false,
    description: 'Design intuitive experiences for students, teachers, and administrators across 5 portals. You will shape how 100,000+ students interact with their education.',
    responsibilities: ['Own design for one or more product areas end-to-end', 'Run usability testing with real school users in Africa', 'Build and maintain a consistent design system', 'Collaborate closely with engineering to ensure high-fidelity delivery'],
    requirements: ['4+ years product/UX design experience', 'Strong Figma skills and component-based design thinking', 'Experience designing for mobile-first, lower-bandwidth environments', 'Portfolio demonstrating complex multi-role SaaS products'],
  },
  {
    id: 'growth-ae', title: 'Account Executive — West Africa', dept: 'Growth',
    type: 'Full-time', location: 'Lagos / Remote', level: 'Mid', salary: '$45k–$65k + commission', isNew: true,
    description: 'Own the full sales cycle for schools and universities in Nigeria, Ghana, and West Africa. You will run demos, negotiate contracts, and close institutions on Tera SM.',
    responsibilities: ['Own the pipeline from outbound prospecting to contract close', 'Run product demos tailored to school decision-makers', 'Build relationships with principals, registrars, and bursars', 'Hit monthly and quarterly revenue targets'],
    requirements: ['3+ years B2B sales experience, ideally SaaS or EdTech', 'Strong network in Nigerian or West African school/university sector', 'Comfortable running demos and navigating multi-stakeholder deals', 'Based in or deeply familiar with West African market'],
  },
  {
    id: 'growth-cs', title: 'Customer Success Manager', dept: 'Growth',
    type: 'Full-time', location: 'Remote (Africa)', level: 'Mid', salary: '$40k–$58k', isNew: false,
    description: 'Onboard new institutions, drive adoption, and ensure every school on Tera SM is getting full value from the platform.',
    responsibilities: ['Own onboarding for new institutions (first 90 days)', 'Run training sessions for admin, teachers, and finance staff', 'Monitor product adoption and proactively address at-risk accounts', 'Act as the voice of customers in product discussions'],
    requirements: ['2+ years in customer success or implementation for SaaS', 'Patient, empathetic communicator — comfortable with non-technical users', 'Ability to manage multiple school relationships simultaneously', 'Experience with African institutions is a strong plus'],
  },
  {
    id: 'growth-marketing', title: 'B2B Content & SEO Marketer', dept: 'Growth',
    type: 'Full-time', location: 'Remote (Global)', level: 'Mid', salary: '$45k–$65k', isNew: false,
    description: 'Build Tera SM\'s content engine — blog, case studies, SEO, and email — to drive inbound leads from school decision-makers across Africa.',
    responsibilities: ['Build and execute a content calendar targeting EdTech decision-makers', 'Write and optimise long-form blog posts and landing pages for SEO', 'Produce customer case studies with quantified outcomes', 'Run email marketing campaigns to leads and existing customers'],
    requirements: ['3+ years B2B content marketing experience', 'Strong SEO fundamentals (keyword research, on-page, link building)', 'Excellent writing skills — clear, concise, no fluff', 'Experience with HubSpot, ConvertKit, or similar tools'],
  },
  {
    id: 'edu-impl', title: 'Implementation Specialist', dept: 'Education',
    type: 'Full-time', location: 'Remote (Africa)', level: 'Mid', salary: '$35k–$50k', isNew: true,
    description: 'Sit at the intersection of education operations and technology. Help schools migrate from spreadsheets and legacy systems onto Tera SM.',
    responsibilities: ['Lead data migration from legacy systems (Excel, old SIS) into Tera SM', 'Configure the platform to match each institution\'s academic structure', 'Train admin, finance, and IT staff on platform use', 'Document implementation playbooks and best practices'],
    requirements: ['2+ years in school administration, registrar, or EdTech implementation', 'Comfortable with data imports, CSV workflows, and basic SQL', 'Strong project management and communication skills', 'Deep understanding of academic calendars, grading, and fee structures'],
  },
  {
    id: 'edu-consultant', title: 'Education Consultant', dept: 'Education',
    type: 'Contract', location: 'Remote (Africa)', level: 'Senior', salary: '$500–$800/day', isNew: false,
    description: 'Advise on curriculum design, academic policy, and institutional best practices as we expand into new markets and institution types.',
    responsibilities: ['Review and advise on how Tera SM models academic structures', 'Consult on regulatory and accreditation requirements per country', 'Support the product team with domain expertise for new modules', 'Participate in key customer conversations as a credibility resource'],
    requirements: ['10+ years in university or college administration or policy', 'Former registrar, deputy vice-chancellor, or academic director preferred', 'Broad knowledge of African higher education systems', 'Comfortable in a fast-moving tech environment'],
  },
  {
    id: 'support-l2', title: 'Technical Support Engineer (L2)', dept: 'Support',
    type: 'Full-time', location: 'Remote (Africa)', level: 'Mid', salary: '$30k–$45k', isNew: false,
    description: 'Handle escalated support tickets from schools, investigate bugs, and work with engineering to resolve platform issues fast.',
    responsibilities: ['Triage and resolve L2 escalations from the support queue', 'Reproduce bugs and write clear reproduction steps for engineering', 'Maintain internal knowledge base and runbooks', 'Monitor error tracking (Sentry) and flag critical issues proactively'],
    requirements: ['2+ years technical support for a SaaS product', 'Comfortable reading logs, SQL queries, and API responses', 'Strong written communication — you write tickets engineers actually read', 'Experience with Sentry, Linear, or similar tools'],
  },
]

const STEPS = [
  {
    icon: FileText,
    color: 'bg-blue-600',
    label: 'Application',
    time: '~5 days',
    paid: false,
    title: 'Application review',
    desc: 'We read every application personally. You will hear from us within 5 business days — no automated rejections.',
    detail: 'Submit your CV and a short note about why you want to join. No cover letter templates — just tell us in your own words.',
  },
  {
    icon: Phone,
    color: 'bg-indigo-600',
    label: 'Intro call',
    time: '30 min',
    paid: false,
    title: 'Intro call',
    desc: 'A relaxed conversation about your background, the role, and our mission. We want to hear your story.',
    detail: 'Video call with the hiring manager. No trick questions. We are assessing fit as much as you are assessing us.',
  },
  {
    icon: Laptop,
    color: 'bg-violet-600',
    label: 'Assessment',
    time: '3–5 days',
    paid: true,
    title: 'Paid skills assessment',
    desc: 'A focused take-home task that mirrors real work. We pay for your time because we respect it.',
    detail: 'Scoped to 4–6 hours of actual work. You can use any tools or references you would normally use on the job. No whiteboard, no trick puzzles.',
  },
  {
    icon: MessageSquare,
    color: 'bg-purple-600',
    label: 'Team interview',
    time: '1 hr',
    paid: false,
    title: 'Team interview',
    desc: 'Meet 2–3 people you will work with every day. We evaluate culture, communication, and how you think.',
    detail: 'We share the interview format in advance. You will know exactly who you are meeting and what to expect.',
  },
  {
    icon: Gift,
    color: 'bg-emerald-600',
    label: 'Offer',
    time: '2–3 days',
    paid: false,
    title: 'Offer & onboarding',
    desc: 'Transparent offer — full comp breakdown, equity details, and benefits laid out clearly with no pressure.',
    detail: 'We move fast. Once you accept, your onboarding buddy reaches out same day and your first week is fully structured.',
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function JobDetailPanel({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${LEVEL_COLORS[job.level]}`}>{job.level}</span>
              {job.isNew && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">New</span>}
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{job.title}</h2>
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.type}</span>
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-6 space-y-8">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">About the role</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{job.description}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Responsibilities</h3>
            <ul className="space-y-2">
              {job.responsibilities.map(r => (
                <li key={r} className="flex gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Requirements</h3>
            <ul className="space-y-2">
              {job.requirements.map(r => (
                <li key={r} className="flex gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0 mt-2" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 rounded-2xl p-5 border border-blue-100 dark:border-blue-900">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-1">Compensation</p>
            <p className="text-xl font-bold text-blue-900 dark:text-blue-200">{job.salary}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">+ equity + full benefits</p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-6 py-4">
          <a
            href={`mailto:careers@terasms.com?subject=Application: ${encodeURIComponent(job.title)}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Apply for this role <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-center text-xs text-gray-400 mt-2">We read every application and reply within 5 business days.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CareersPage() {
  const [activeJob,   setActiveJob]   = useState<Job | null>(null)
  const [deptFilter,  setDeptFilter]  = useState<'All' | Dept>('All')
  const [query,       setQuery]       = useState('')
  const [alertEmail,  setAlertEmail]  = useState('')
  const [alertSent,   setAlertSent]   = useState(false)
  const [formData,    setFormData]    = useState({ name: '', email: '', area: '', message: '' })
  const [formSent,    setFormSent]    = useState(false)
  const rolesRef = useRef<HTMLElement>(null)

  const deptCounts = useMemo(() =>
    DEPTS.reduce((acc, d) => ({ ...acc, [d]: JOBS.filter(j => j.dept === d).length }), {} as Record<Dept, number>)
  , [])

  const filtered = useMemo(() =>
    JOBS.filter(j => {
      const matchDept  = deptFilter === 'All' || j.dept === deptFilter
      const matchQuery = !query || j.title.toLowerCase().includes(query.toLowerCase()) || j.dept.toLowerCase().includes(query.toLowerCase())
      return matchDept && matchQuery
    })
  , [deptFilter, query])

  function scrollToRoles() {
    rolesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function submitAlert(e: React.SyntheticEvent) {
    e.preventDefault()
    setAlertSent(true)
  }

  function submitForm(e: React.SyntheticEvent) {
    e.preventDefault()
    setFormSent(true)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {activeJob && <JobDetailPanel job={activeJob} onClose={() => setActiveJob(null)} />}

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative bg-white dark:bg-gray-950 overflow-hidden">
        {/* Dot grid — light mode subtle, hidden in dark */}
        <div
          className="absolute inset-0 opacity-[0.045] dark:opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Glow blobs — adapt per mode */}
        <div className="absolute -top-40 -left-40 w-[480px] h-[480px] bg-blue-400/10 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] bg-indigo-400/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-[1fr_420px] gap-14 items-center">

            {/* ── Left ── */}
            <div>
              {/* Live badge */}
              <div className="inline-flex items-center gap-2.5 mb-8 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full px-4 py-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="text-sm font-semibold text-gray-800 dark:text-white">{JOBS.length} open roles</span>
                <span className="w-px h-3.5 bg-gray-200 dark:bg-white/20" />
                <span className="text-xs text-gray-400 dark:text-white/50">{JOBS.filter(j => j.isNew).length} added this month</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] mb-6">
                Build the future of<br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  African education
                </span>
              </h1>

              <p className="text-lg text-gray-500 dark:text-white/60 leading-relaxed mb-10 max-w-md">
                We are a remote-first team obsessed with making schools run better.
                50+ institutions. 100,000+ students across 8 countries. Just getting started.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 mb-12">
                <button
                  onClick={scrollToRoles}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-200 dark:shadow-blue-900/40"
                >
                  See open roles <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  href="/about#team"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white font-semibold rounded-xl transition-colors"
                >
                  <Users className="w-4 h-4" /> Meet the team
                </Link>
              </div>

              {/* Inline stats */}
              <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2 border-t border-gray-100 dark:border-white/10">
                {STATS.map(s => (
                  <div key={s.label}>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                    <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right — structured team grid ── */}
            <div className="hidden lg:block">
              {/* Header row */}
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-widest">Our team</p>
                <span className="text-xs text-gray-400 dark:text-white/30">40+ people · 12 countries</span>
              </div>

              {/* 3×3 grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {TEAM_GRID.map((m, i) => (
                  <div
                    key={i}
                    className="group bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 rounded-2xl p-3.5 transition-all cursor-default"
                  >
                    <div className={`w-9 h-9 rounded-xl ${m.color} flex items-center justify-center text-white font-bold text-sm mb-2.5 shadow-md`}>
                      {m.initials}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{m.name}</p>
                    <p className="text-[11px] text-gray-400 dark:text-white/40 mt-0.5">{m.role}</p>
                    <p className="text-[10px] text-gray-300 dark:text-white/25 mt-1">{m.location}</p>
                  </div>
                ))}
              </div>

              {/* "And more" footer */}
              <div className="mt-3 flex items-center gap-2 px-1">
                <div className="flex -space-x-1.5">
                  {['bg-orange-500', 'bg-lime-600', 'bg-sky-500'].map((c, i) => (
                    <div key={i} className={`w-5 h-5 rounded-full ${c} border-2 border-white dark:border-gray-950`} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-white/30">+31 more across Africa &amp; the world</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Open Roles (moved up) ─────────────────────────────────────────────── */}
      <section ref={rolesRef} className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Open positions</h2>
            <p className="text-gray-500 dark:text-gray-400">{JOBS.length} open roles · Remote-first</p>
          </div>

          {/* Search + filters */}
          <div className="space-y-3 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by role or department…"
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dept filter tabs */}
            <div className="flex flex-wrap gap-2">
              {(['All', ...DEPTS] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDeptFilter(d)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    deptFilter === d
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-none'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {d}{d !== 'All' && ` (${deptCounts[d as Dept]})`}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          {(query || deptFilter !== 'All') && (
            <p className="text-xs text-gray-400 mb-4">{filtered.length} role{filtered.length !== 1 ? 's' : ''} found</p>
          )}

          {/* Job cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-500 mb-1">No roles match your search</p>
              <p className="text-sm text-gray-400">Try a different keyword or department filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(job => (
                <button
                  key={job.id}
                  onClick={() => setActiveJob(job)}
                  className="w-full flex items-center justify-between p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all group text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {job.title}
                      </p>
                      {job.isNew && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                          <Sparkles className="w-2.5 h-2.5" /> NEW
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.type}</span>
                      <span className="flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300"><DollarSign className="w-3 h-3" />{job.salary}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className={`hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${LEVEL_COLORS[job.level]}`}>
                      {job.level}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Job alerts signup */}
          <div className="mt-10 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-blue-600" />
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Get job alerts</p>
            </div>
            <p className="text-xs text-gray-500 mb-4">No roles right now? We will email you when new positions open.</p>
            {alertSent ? (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> You are on the list — we will be in touch!
              </div>
            ) : (
              <form onSubmit={submitAlert} className="flex gap-2">
                <input
                  type="email" required
                  value={alertEmail}
                  onChange={e => setAlertEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  Notify me
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Employee Quotes ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">From the team</h2>
            <p className="text-gray-500 dark:text-gray-400">Real words from people who build Tera SM every day.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {QUOTES.map(q => (
              <div key={q.name} className="flex flex-col p-7 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm flex-1 mb-6">
                  &ldquo;{q.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${q.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {q.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{q.name}</p>
                    <p className="text-xs text-gray-400">{q.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Perks ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Benefits &amp; perks</h2>
            <p className="text-gray-500 dark:text-gray-400">We take care of the people who take care of our schools.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PERKS.map(p => (
              <div key={p.title} className="flex gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${p.bg} ${p.iconCls}`}>
                  <p.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{p.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Culture ───────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">How we work</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">No politics. No red tape. A focused team building something that matters.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {VALUES.map(v => (
              <div key={v.label} className={`bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border-l-4 ${v.accent} border border-gray-100 dark:border-gray-800`}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{v.label}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hiring process ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Our hiring process</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Straightforward and respectful of your time. Usually <span className="font-semibold text-gray-700 dark:text-gray-300">2–3 weeks</span> end-to-end.
            </p>
          </div>

          {/* Desktop: horizontal step track */}
          <div className="hidden md:flex items-start gap-0 mb-10">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex-1 flex flex-col items-center relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gradient-to-r from-gray-200 to-gray-200 dark:from-gray-700 dark:to-gray-700 z-0" />
                )}
                {/* Step circle */}
                <div className={`relative z-10 w-10 h-10 rounded-full ${s.color} flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-gray-900 mb-3`}>
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 text-center">{s.label}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400">{s.time}</span>
                </div>
                {s.paid && (
                  <span className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                    Paid
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Step detail cards — vertical timeline */}
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-emerald-200 dark:from-blue-900 dark:via-purple-900 dark:to-emerald-900 hidden sm:block" />

            <div className="space-y-4">
              {STEPS.map((s, i) => (
                <div key={s.label} className="relative flex gap-5 sm:gap-6">
                  {/* Circle on the line */}
                  <div className={`relative z-10 w-10 h-10 rounded-full ${s.color} flex items-center justify-center shadow-md ring-4 ring-white dark:ring-gray-900 flex-shrink-0`}>
                    <s.icon className="w-4 h-4 text-white" />
                  </div>

                  {/* Card */}
                  <div className={`flex-1 mb-2 rounded-2xl border p-5 transition-all ${
                    s.paid
                      ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800'
                      : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                  }`}>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Step {i + 1} of {STEPS.length}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                        <Clock className="w-2.5 h-2.5" /> {s.time}
                      </span>
                      {s.paid && (
                        <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-green-500 text-white">
                          <DollarSign className="w-3 h-3" /> Paid
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 dark:text-white mb-1.5">{s.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{s.desc}</p>

                    <div className="flex gap-2 items-start bg-white/70 dark:bg-gray-900/50 rounded-xl px-3.5 py-3 border border-gray-100 dark:border-gray-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{s.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-gray-400 mt-10">
            We send updates at every stage — you will never be left wondering where things stand.
          </p>
        </div>
      </section>

      {/* ── Open application form ─────────────────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Do not see your role?</h2>
            <p className="text-gray-500 dark:text-gray-400">
              We are always looking for exceptional people. Send us a note and tell us how you would contribute.
            </p>
          </div>
          {formSent ? (
            <div className="text-center py-12 border-2 border-dashed border-green-200 dark:border-green-800 rounded-2xl">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Application received!</p>
              <p className="text-sm text-gray-400">We will get back to you within 5 business days.</p>
            </div>
          ) : (
            <form onSubmit={submitForm} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Your name</label>
                  <input
                    required type="text"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Adaeze Okonkwo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
                  <input
                    required type="email"
                    value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="you@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Area of interest</label>
                <select
                  value={formData.area}
                  onChange={e => setFormData(f => ({ ...f, area: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a department</option>
                  {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Tell us about yourself</label>
                <textarea
                  required rows={4}
                  value={formData.message}
                  onChange={e => setFormData(f => ({ ...f, message: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="What would you bring to Tera SM? Link your portfolio, GitHub, or LinkedIn if relevant."
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
              >
                Send open application <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-xs text-gray-400">We reply to every application within 5 business days.</p>
            </form>
          )}
        </div>
      </section>

    </div>
  )
}
