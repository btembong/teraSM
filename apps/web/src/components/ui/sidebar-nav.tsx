'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, ClipboardList, ClipboardCheck, BarChart2,
  Calendar, MessageSquare, User, DollarSign, FileText, Video, Megaphone,
  Users, CalendarDays, Building, Wrench, Bot, Vote, Briefcase, LogOut,
  GraduationCap, Library, UserCog, Smile, Settings, CalendarOff, UserPlus,
  ChevronRight, Building2, CreditCard, Award, Shield, AlarmClock, Bell, Trophy,
  BookMarked, MessageCircle, Clock,
} from 'lucide-react'
import { AnnouncementBadge } from '@/components/ui/unread-badge'

// ─── Types ───────────────────────────────────────────────────────────────────

type Portal = 'admin' | 'student' | 'staff' | 'parent' | 'super-admin'

interface NavLeaf {
  type: 'leaf'
  href: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  type: 'group'
  label: string
  Icon: React.ComponentType<{ className?: string }>
  items: NavLeaf[]
}

type NavEntry = NavLeaf | NavGroup

interface SidebarNavProps {
  portal: Portal
  accentColor?: 'blue' | 'indigo' | 'teal' | 'violet'
  user: { name?: string | null; email?: string | null }
  schoolName?: string
  schoolLogo?: string | null
}

// ─── Accent palette ───────────────────────────────────────────────────────────

const ACCENT = {
  blue:   { bg: 'bg-blue-600',   light: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-600',   icon: 'text-blue-600',   avatar: 'bg-blue-100 text-blue-700' },
  indigo: { bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-600', icon: 'text-indigo-600', avatar: 'bg-indigo-100 text-indigo-700' },
  teal:   { bg: 'bg-teal-600',   light: 'bg-teal-50',   text: 'text-teal-700',   dot: 'bg-teal-600',   icon: 'text-teal-600',   avatar: 'bg-teal-100 text-teal-700' },
  violet: { bg: 'bg-violet-600', light: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-600', icon: 'text-violet-600', avatar: 'bg-violet-100 text-violet-700' },
}

const PORTAL_LABEL: Record<Portal, string> = {
  admin: 'Admin Portal',
  student: 'Student Portal',
  staff: 'Staff Portal',
  parent: 'Parent Portal',
  'super-admin': 'Super Admin',
}

// ─── Admin nav (nested groups) ────────────────────────────────────────────────

const ADMIN_NAV: NavEntry[] = [
  { type: 'leaf', href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },

  // ── Academic Structure ──────────────────────────────────────────────────────
  {
    type: 'group', label: 'Academic Structure', Icon: GraduationCap,
    items: [
      { type: 'leaf', href: '/admin/academics',              label: 'Overview',     Icon: LayoutDashboard },
      { type: 'leaf', href: '/admin/academics/structure',    label: 'Structure',    Icon: Building2 },
      { type: 'leaf', href: '/admin/academics/departments',  label: 'Departments',  Icon: Building },
      { type: 'leaf', href: '/admin/academics/programs',     label: 'Programs',     Icon: BookMarked },
      { type: 'leaf', href: '/admin/academics/courses',      label: 'Courses',      Icon: BookOpen },
      { type: 'leaf', href: '/admin/academics/offerings',    label: 'Offerings',    Icon: ClipboardList },
      { type: 'leaf', href: '/admin/academics/rooms',        label: 'Rooms',        Icon: Building },
      { type: 'leaf', href: '/admin/academics/calendar',     label: 'Calendar',     Icon: CalendarDays },
      { type: 'leaf', href: '/admin/academics/grading',      label: 'Grading',      Icon: BarChart2 },
    ],
  },

  // ── Admissions ──────────────────────────────────────────────────────────────
  { type: 'leaf', href: '/admin/admissions', label: 'Admissions', Icon: ClipboardList },

  // ── Student Management ──────────────────────────────────────────────────────
  {
    type: 'group', label: 'Student Management', Icon: Users,
    items: [
      { type: 'leaf', href: '/admin/students',                 label: 'All Students',   Icon: Users },
      { type: 'leaf', href: '/admin/students/enrollments',     label: 'Enrollments',    Icon: ClipboardCheck },
      { type: 'leaf', href: '/admin/students/progression',     label: 'Progression',    Icon: BarChart2 },
      { type: 'leaf', href: '/admin/students/grades',          label: 'Grades',         Icon: Award },
      { type: 'leaf', href: '/admin/students/transcripts',     label: 'Transcripts',    Icon: FileText },
      { type: 'leaf', href: '/admin/invites',                  label: 'Invitations',    Icon: UserPlus },
    ],
  },

  // ── Learning ────────────────────────────────────────────────────────────────
  { type: 'leaf', href: '/admin/lms',          label: 'LMS',          Icon: Library },
  { type: 'leaf', href: '/admin/live-classes', label: 'Live Classes', Icon: Video },
  { type: 'leaf', href: '/admin/exams',        label: 'Exams',        Icon: CalendarOff },

  // ── Finance ─────────────────────────────────────────────────────────────────
  {
    type: 'group', label: 'Finance', Icon: DollarSign,
    items: [
      { type: 'leaf', href: '/admin/finance',                  label: 'Overview',       Icon: LayoutDashboard },
      { type: 'leaf', href: '/admin/finance/fees',             label: 'Fee Structures', Icon: CreditCard },
      { type: 'leaf', href: '/admin/finance/invoices',         label: 'Invoices',       Icon: FileText },
      { type: 'leaf', href: '/admin/finance/scholarships',     label: 'Scholarships',   Icon: Award },
      { type: 'leaf', href: '/admin/finance/manual-payments',  label: 'Bank Proofs',    Icon: FileText },
    ],
  },

  // ── HR ──────────────────────────────────────────────────────────────────────
  {
    type: 'group', label: 'HR', Icon: UserCog,
    items: [
      { type: 'leaf', href: '/admin/hr',            label: 'Overview',       Icon: LayoutDashboard },
      { type: 'leaf', href: '/admin/hr/employees',  label: 'Employees',      Icon: Users },
      { type: 'leaf', href: '/admin/hr/leave',      label: 'Leave Requests', Icon: CalendarOff },
      { type: 'leaf', href: '/admin/hr/payroll',    label: 'Payroll',        Icon: CreditCard },
    ],
  },

  // ── Other ───────────────────────────────────────────────────────────────────
  { type: 'leaf', href: '/admin/campuses',      label: 'Campuses',       Icon: Building2 },
  { type: 'leaf', href: '/admin/announcements', label: 'Announcements',  Icon: Megaphone },
  { type: 'leaf', href: '/admin/student-life',  label: 'Student Life',   Icon: Smile },
  { type: 'leaf', href: '/admin/elections',     label: 'Elections',      Icon: Vote },
  { type: 'leaf', href: '/admin/thesis',        label: 'Thesis Portal',  Icon: BookMarked },
  { type: 'leaf', href: '/admin/alumni',        label: 'Alumni Network', Icon: GraduationCap },
  { type: 'leaf', href: '/admin/career',        label: 'Career Center',  Icon: Briefcase },
  { type: 'leaf', href: '/admin/ai',            label: 'AI & Intelligence', Icon: Bot },
  { type: 'leaf', href: '/admin/analytics',     label: 'Analytics',      Icon: BarChart2 },
  { type: 'leaf', href: '/admin/campaigns',     label: 'Campaigns',      Icon: Megaphone },
  { type: 'leaf', href: '/admin/settings',      label: 'Settings',       Icon: Settings },
]

// ─── Grouped nav for student portal ──────────────────────────────────────────

const STUDENT_NAV: NavEntry[] = [
  { type: 'leaf', href: '/student', label: 'Dashboard', Icon: LayoutDashboard },
  {
    type: 'group', label: 'Academics', Icon: GraduationCap,
    items: [
      { type: 'leaf', href: '/student/registration', label: 'Registration', Icon: ClipboardList },
      { type: 'leaf', href: '/student/registration/my-courses', label: 'My Courses', Icon: BookOpen },
      { type: 'leaf', href: '/student/attendance', label: 'Attendance', Icon: ClipboardCheck },
      { type: 'leaf', href: '/student/grades',     label: 'Grades',     Icon: BarChart2 },
      { type: 'leaf', href: '/student/transcript', label: 'Transcript', Icon: FileText },
      { type: 'leaf', href: '/student/graduation', label: 'Graduation', Icon: GraduationCap },
      { type: 'leaf', href: '/student/timetable', label: 'Timetable', Icon: Calendar },
      { type: 'leaf', href: '/student/deadlines', label: 'Deadlines', Icon: AlarmClock },
    ],
  },
  {
    type: 'group', label: 'Learning', Icon: BookMarked,
    items: [
      { type: 'leaf', href: '/student/courses', label: 'Course Materials', Icon: BookOpen },
      { type: 'leaf', href: '/student/assignments', label: 'Assignments', Icon: ClipboardCheck },
      { type: 'leaf', href: '/student/live-classes', label: 'Live Classes', Icon: Video },
      { type: 'leaf', href: '/student/leaderboard', label: 'Leaderboard', Icon: Trophy },
      { type: 'leaf', href: '/student/ai', label: 'AI Assistant', Icon: Bot },
    ],
  },
  {
    type: 'group', label: 'Finance', Icon: DollarSign,
    items: [
      { type: 'leaf', href: '/student/fees', label: 'Fees & Payments', Icon: CreditCard },
    ],
  },
  {
    type: 'group', label: 'Communication', Icon: MessageCircle,
    items: [
      { type: 'leaf', href: '/student/announcements', label: 'Announcements', Icon: Megaphone },
      { type: 'leaf', href: '/student/messages', label: 'Messages', Icon: MessageSquare },
      { type: 'leaf', href: '/student/notifications', label: 'Notifications', Icon: Bell },
    ],
  },
  {
    type: 'group', label: 'Campus Life', Icon: Smile,
    items: [
      { type: 'leaf', href: '/student/office-hours', label: 'Office Hours', Icon: Clock },
      { type: 'leaf', href: '/student/clubs', label: 'Clubs & Societies', Icon: Users },
      { type: 'leaf', href: '/student/events', label: 'Campus Events', Icon: CalendarDays },
      { type: 'leaf', href: '/student/hostel', label: 'Hostel', Icon: Building },
      { type: 'leaf', href: '/student/maintenance', label: 'Maintenance', Icon: Wrench },
      { type: 'leaf', href: '/student/elections', label: 'Elections', Icon: Vote },
      { type: 'leaf', href: '/student/thesis', label: 'Thesis', Icon: BookMarked },
      { type: 'leaf', href: '/student/alumni', label: 'Alumni Network', Icon: GraduationCap },
      { type: 'leaf', href: '/student/career', label: 'Career Center', Icon: Briefcase },
      { type: 'leaf', href: '/student/library', label: 'Library', Icon: Library },
      { type: 'leaf', href: '/student/counseling', label: 'Counseling', Icon: GraduationCap },
    ],
  },
  {
    type: 'group', label: 'More', Icon: User,
    items: [
      { type: 'leaf', href: '/student/achievements', label: 'Achievements', Icon: Award },
      { type: 'leaf', href: '/student/id-card', label: 'Student ID', Icon: Shield },
      { type: 'leaf', href: '/student/profile', label: 'Profile', Icon: User },
    ],
  },
]

// ─── Flat nav for other portals ───────────────────────────────────────────────

const FLAT_NAV: Record<Exclude<Portal, 'admin' | 'student'>, NavLeaf[]> = {
  staff: [
    { type: 'leaf', href: '/staff',             label: 'Dashboard',    Icon: LayoutDashboard },
    { type: 'leaf', href: '/staff/courses',      label: 'My Courses',   Icon: BookOpen },
    { type: 'leaf', href: '/staff/timetable',    label: 'Timetable',    Icon: Calendar },
    { type: 'leaf', href: '/staff/live-classes', label: 'Live Classes', Icon: Video },
    { type: 'leaf', href: '/staff/attendance',   label: 'Attendance',   Icon: ClipboardList },
    { type: 'leaf', href: '/staff/analytics',    label: 'Analytics',    Icon: BarChart2 },
    { type: 'leaf', href: '/staff/office-hours', label: 'Office Hours', Icon: Clock },
    { type: 'leaf', href: '/staff/invigilation', label: 'Invigilation', Icon: ClipboardCheck },
    { type: 'leaf', href: '/staff/announcements',label: 'Announcements',Icon: Megaphone },
    { type: 'leaf', href: '/staff/messages',     label: 'Messages',     Icon: MessageSquare },
    { type: 'leaf', href: '/staff/thesis',       label: 'Thesis',       Icon: BookMarked },
    { type: 'leaf', href: '/staff/payslips',     label: 'Payslips',     Icon: DollarSign },
    { type: 'leaf', href: '/staff/leave',        label: 'Leave',        Icon: CalendarOff },
    { type: 'leaf', href: '/staff/profile',      label: 'Profile',      Icon: User },
  ],
  parent: [
    { type: 'leaf', href: '/parent', label: 'Dashboard', Icon: LayoutDashboard },
    { type: 'leaf', href: '/parent/grades', label: 'Grades', Icon: BarChart2 },
    { type: 'leaf', href: '/parent/attendance', label: 'Attendance', Icon: ClipboardList },
    { type: 'leaf', href: '/parent/fees', label: 'Fees', Icon: DollarSign },
    { type: 'leaf', href: '/parent/messages', label: 'Messages', Icon: MessageSquare },
  ],
  'super-admin': [
    { type: 'leaf', href: '/super-admin', label: 'Dashboard', Icon: LayoutDashboard },
    { type: 'leaf', href: '/super-admin/tenants', label: 'Tenants', Icon: Building },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isLeafActive(href: string, pathname: string): boolean {
  const depth = href.split('/').filter(Boolean).length
  return depth === 1 ? pathname === href : pathname === href || pathname.startsWith(href + '/')
}

function groupHasActive(group: NavGroup, pathname: string): boolean {
  return group.items.some(item => isLeafActive(item.href, pathname))
}

// ─── Leaf link ────────────────────────────────────────────────────────────────

function LeafLink({ item, active, a, indent = false }: {
  item: NavLeaf
  active: boolean
  a: typeof ACCENT['blue']
  indent?: boolean
}) {
  const showAnnouncementBadge = item.href === '/student/announcements'

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-sm transition-all duration-150 group ${
        indent ? 'ml-3' : ''
      } ${active ? `${a.light} ${a.text} font-medium` : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
    >
      {indent && (
        <span className={`w-1 h-1 rounded-full flex-shrink-0 ${active ? a.dot : 'bg-gray-300'}`} />
      )}
      {!indent && (
        <item.Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? a.icon : 'text-gray-400 group-hover:text-gray-600'}`} />
      )}
      <span className="flex-1 truncate">{item.label}</span>
      {showAnnouncementBadge && <AnnouncementBadge />}
      {!indent && !showAnnouncementBadge && active && <span className={`w-1.5 h-1.5 rounded-full ${a.dot} flex-shrink-0`} />}
    </Link>
  )
}

// ─── Group item ───────────────────────────────────────────────────────────────

function GroupItem({ group, pathname, a, open, onToggle }: {
  group: NavGroup
  pathname: string
  a: typeof ACCENT['blue']
  open: boolean
  onToggle: () => void
}) {
  const hasActive = groupHasActive(group, pathname)

  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 group ${
          hasActive && !open
            ? `${a.light} ${a.text} font-medium`
            : hasActive
            ? 'text-gray-700 font-medium bg-gray-50'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
        }`}
      >
        <group.Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
          hasActive ? a.icon : 'text-gray-400 group-hover:text-gray-600'
        }`} />
        <span className="flex-1 text-left truncate">{group.label}</span>
        <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
          open ? 'rotate-90' : ''
        } ${hasActive ? a.icon : 'text-gray-300'}`} />
      </button>

      {open && (
        <div className="mt-0.5 ml-3 pl-3 border-l border-gray-100 space-y-0.5 pb-1">
          {group.items.map(item => (
            <LeafLink
              key={item.href}
              item={item}
              active={isLeafActive(item.href, pathname)}
              a={a}
              indent
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SidebarNav({ portal, accentColor = 'blue', user, schoolName, schoolLogo }: SidebarNavProps) {
  const pathname = usePathname()
  const a = ACCENT[accentColor]
  const portalLabel = PORTAL_LABEL[portal]
  const initials = schoolName
    ? schoolName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SM'

  const activeNav: NavEntry[] =
    portal === 'admin' ? ADMIN_NAV :
    portal === 'student' ? STUDENT_NAV :
    (FLAT_NAV[portal as keyof typeof FLAT_NAV] ?? [])

  // Track which groups are open
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    activeNav.forEach(entry => {
      if (entry.type === 'group' && groupHasActive(entry, pathname)) {
        initial.add(entry.label)
      }
    })
    return initial
  })

  // Auto-expand group when navigating to a child page
  useEffect(() => {
    activeNav.forEach(entry => {
      if (entry.type === 'group' && groupHasActive(entry, pathname)) {
        setOpenGroups(prev => {
          if (prev.has(entry.label)) return prev
          const next = new Set(prev)
          next.add(entry.label)
          return next
        })
      }
    })
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(label: string) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  return (
    <>
      {/* Logo / school header */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0 ${schoolLogo ? 'bg-white border border-gray-100' : a.bg}`}>
            {schoolLogo
              ? <img src={schoolLogo} alt="logo" className="w-full h-full object-cover" />
              : <span className="text-white text-sm font-bold">{initials}</span>
            }
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-none truncate">{schoolName ?? 'My School'}</p>
            <p className={`text-xs ${a.text} leading-none mt-0.5`}>{portalLabel}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {activeNav.map(entry =>
          entry.type === 'leaf' ? (
            <LeafLink
              key={entry.href}
              item={entry}
              active={isLeafActive(entry.href, pathname)}
              a={a}
            />
          ) : (
            <GroupItem
              key={entry.label}
              group={entry}
              pathname={pathname}
              a={a}
              open={openGroups.has(entry.label)}
              onToggle={() => toggle(entry.label)}
            />
          )
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-1 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className={`w-8 h-8 rounded-full ${a.avatar} flex items-center justify-center text-sm font-semibold flex-shrink-0`}>
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <Link
          href="/account/security"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors group"
        >
          <Shield className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-gray-600" />
          Account Security
        </Link>
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors group"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-gray-600" />
          Sign out
        </Link>
      </div>
    </>
  )
}
