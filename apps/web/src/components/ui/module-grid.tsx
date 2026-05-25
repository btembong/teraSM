'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  GraduationCap, Building2, Layers, BookOpen, CalendarDays, BarChart3,
  MapPin, Users, UserCheck, UserPlus, Mail, DollarSign, FileText,
  BadgeCheck, TrendingUp, Video, CheckCircle2, UserCog, Clock,
  Megaphone, Heart, Brain, Vote, Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Stats {
  pendingAdmissions: number
  activeInvites: number
  unpaidInvoices: number
  ungradedSubmissions: number
  pendingLeave: number
  liveNow: number
  classesToday: number
  activeElections: number
  openMaintenance: number
}

interface ModuleEntry {
  label: string
  desc: string
  href: string
  icon: LucideIcon
  statKey?: keyof Stats | 'liveClasses'
  urgent?: boolean
}

interface ModuleGroup {
  label: string
  modules: ModuleEntry[]
}

const groups: ModuleGroup[] = [
  {
    label: 'Academics',
    modules: [
      { label: 'Academic Overview', desc: 'Structure, years & semesters',   href: '/admin/academics',               icon: GraduationCap },
      { label: 'Departments',       desc: 'Faculties & departments',         href: '/admin/academics/departments',   icon: Building2 },
      { label: 'Programs',          desc: 'Degree & diploma programs',       href: '/admin/academics/programs',      icon: Layers },
      { label: 'Courses',           desc: 'Course catalogue & credits',      href: '/admin/academics/courses',       icon: BookOpen },
      { label: 'Offerings',         desc: 'Semester course sections',        href: '/admin/academics/offerings',     icon: CalendarDays },
      { label: 'Calendar',          desc: 'Academic years & terms',          href: '/admin/academics/calendar',      icon: CalendarDays },
      { label: 'Grading',           desc: 'Grade boundaries & schemes',      href: '/admin/academics/grading',       icon: BarChart3 },
      { label: 'Rooms',             desc: 'Classrooms & lab booking',        href: '/admin/academics/rooms',         icon: MapPin },
    ],
  },
  {
    label: 'Students',
    modules: [
      { label: 'All Students', desc: 'Student records & profiles',    href: '/admin/students',                icon: Users },
      { label: 'Enrollments',  desc: 'Course enrollment records',     href: '/admin/academics/enrollments',   icon: UserCheck },
      { label: 'Admissions',   desc: 'Applications & intake',         href: '/admin/admissions',              icon: UserPlus,   statKey: 'pendingAdmissions', urgent: false },
      { label: 'Invitations',  desc: 'Send access invites',           href: '/admin/invites',                 icon: Mail,       statKey: 'activeInvites',     urgent: false },
    ],
  },
  {
    label: 'Finance',
    modules: [
      { label: 'Finance Overview',  desc: 'Revenue & balances',                href: '/admin/finance',                 icon: DollarSign },
      { label: 'Fee Structures',    desc: 'Define fee templates',               href: '/admin/finance/fees',            icon: FileText },
      { label: 'Invoices',          desc: 'Student invoices & payments',        href: '/admin/finance/invoices',        icon: FileText,   statKey: 'unpaidInvoices',      urgent: true  },
      { label: 'Scholarships',      desc: 'Aid, bursaries & awards',            href: '/admin/finance/scholarships',    icon: BadgeCheck },
      { label: 'Manual Payments',   desc: 'Record cash & offline payments',     href: '/admin/finance/manual-payments', icon: TrendingUp },
    ],
  },
  {
    label: 'Learning',
    modules: [
      { label: 'LMS',         desc: 'Course content & materials',       href: '/admin/lms',             icon: BookOpen },
      { label: 'Live Classes', desc: 'Video sessions & recordings',     href: '/admin/live-classes',    icon: Video,        statKey: 'liveClasses',         urgent: true  },
      { label: 'Assignments', desc: 'Tasks, rubrics & deadlines',       href: '/admin/lms/assignments', icon: CheckCircle2 },
      { label: 'Submissions', desc: 'Student work & grading queue',     href: '/admin/lms/submissions', icon: FileText,     statKey: 'ungradedSubmissions', urgent: false },
    ],
  },
  {
    label: 'HR & Staff',
    modules: [
      { label: 'HR Overview', desc: 'Staff management hub',             href: '/admin/hr',           icon: UserCog },
      { label: 'Employees',   desc: 'Employee records & contracts',     href: '/admin/hr/employees', icon: Users },
      { label: 'Leave',       desc: 'Leave requests & approvals',       href: '/admin/hr/leave',     icon: Clock,      statKey: 'pendingLeave', urgent: false },
      { label: 'Payroll',     desc: 'Payslips & salary runs',           href: '/admin/hr/payroll',   icon: TrendingUp },
    ],
  },
  {
    label: 'Communication',
    modules: [
      { label: 'Announcements', desc: 'School-wide broadcasts', href: '/admin/announcements', icon: Megaphone },
    ],
  },
  {
    label: 'Campus & Facilities',
    modules: [
      { label: 'Campuses',     desc: 'Campus locations & details',  href: '/admin/campuses',     icon: Building2 },
      { label: 'Exams',        desc: 'Exam scheduling & venues',    href: '/admin/exams',        icon: CalendarDays },
      { label: 'Student Life', desc: 'Clubs, events & hostel',      href: '/admin/student-life', icon: Heart,      statKey: 'openMaintenance', urgent: false },
    ],
  },
  {
    label: 'Intelligence & Settings',
    modules: [
      { label: 'Analytics',        desc: 'Enrollment & performance trends', href: '/admin/analytics', icon: BarChart3 },
      { label: 'AI & Early Warning', desc: 'At-risk student detection',     href: '/admin/ai',        icon: Brain },
      { label: 'Elections',        desc: 'Student government voting',       href: '/admin/elections', icon: Vote,     statKey: 'activeElections', urgent: false },
      { label: 'Settings',         desc: 'School & platform config',        href: '/admin/settings',  icon: Settings },
    ],
  },
]

function getBadge(mod: ModuleEntry, stats: Stats | null): { count: number; urgent: boolean } | null {
  if (!mod.statKey || !stats) return null
  if (mod.statKey === 'liveClasses') {
    if (stats.liveNow > 0) return { count: stats.liveNow, urgent: true }
    if (stats.classesToday > 0) return { count: stats.classesToday, urgent: false }
    return null
  }
  const count = stats[mod.statKey as keyof Stats]
  if (!count) return null
  return { count, urgent: mod.urgent ?? false }
}

export function ModuleGrid() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/dashboard-stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-8">
      {groups.map(group => (
        <div key={group.label}>
          {/* Module tab pill header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-indigo-100" />
            <span className="flex-shrink-0 bg-white text-indigo-700 font-semibold shadow-sm border border-indigo-100 px-3.5 py-1.5 rounded-xl text-sm">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-indigo-100" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {group.modules.map(mod => {
              const badge = getBadge(mod, stats)
              return (
                <Link
                  key={mod.href + mod.label}
                  href={mod.href}
                  className="group relative flex flex-col gap-3 p-4 bg-indigo-50/30 border border-gray-100 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-sm transition-all duration-150"
                >
                  {badge && (
                    <span className={`absolute top-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                      badge.urgent ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'
                    }`}>
                      {badge.count}
                    </span>
                  )}
                  <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                    <mod.icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 leading-tight">{mod.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">{mod.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
