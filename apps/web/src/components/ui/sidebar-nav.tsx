'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, ClipboardList, ClipboardCheck, BarChart2,
  Calendar, MessageSquare, User, DollarSign, FileText, Video, Megaphone,
  Users, CalendarDays, Building, Wrench, Bot, Vote, Briefcase, LogOut,
  GraduationCap, Library, UserCog, Smile, Settings, CalendarOff, UserPlus,
  ChevronRight, Building2, CreditCard, Award, CalendarRange,
} from 'lucide-react'

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
  {
    type: 'group', label: 'Academics', Icon: GraduationCap,
    items: [
      { type: 'leaf', href: '/admin/academics', label: 'Overview', Icon: LayoutDashboard },
      { type: 'leaf', href: '/admin/academics/departments', label: 'Departments', Icon: Building2 },
      { type: 'leaf', href: '/admin/academics/courses', label: 'Courses', Icon: BookOpen },
      { type: 'leaf', href: '/admin/academics/years', label: 'Academic Years', Icon: CalendarRange },
    ],
  },
  { type: 'leaf', href: '/admin/lms', label: 'LMS', Icon: Library },
  { type: 'leaf', href: '/admin/live-classes', label: 'Live Classes', Icon: Video },
  {
    type: 'group', label: 'Finance', Icon: DollarSign,
    items: [
      { type: 'leaf', href: '/admin/finance', label: 'Overview', Icon: LayoutDashboard },
      { type: 'leaf', href: '/admin/finance/fees', label: 'Fee Structures', Icon: CreditCard },
      { type: 'leaf', href: '/admin/finance/invoices', label: 'Invoices', Icon: FileText },
      { type: 'leaf', href: '/admin/finance/scholarships', label: 'Scholarships', Icon: Award },
    ],
  },
  {
    type: 'group', label: 'HR', Icon: UserCog,
    items: [
      { type: 'leaf', href: '/admin/hr', label: 'Overview', Icon: LayoutDashboard },
      { type: 'leaf', href: '/admin/hr/employees', label: 'Employees', Icon: Users },
      { type: 'leaf', href: '/admin/hr/leave', label: 'Leave Requests', Icon: CalendarOff },
      { type: 'leaf', href: '/admin/hr/payroll', label: 'Payroll', Icon: CreditCard },
    ],
  },
  { type: 'leaf', href: '/admin/announcements', label: 'Announcements', Icon: Megaphone },
  { type: 'leaf', href: '/admin/student-life', label: 'Student Life', Icon: Smile },
  { type: 'leaf', href: '/admin/elections', label: 'Elections', Icon: Vote },
  { type: 'leaf', href: '/admin/career', label: 'Career Center', Icon: Briefcase },
  { type: 'leaf', href: '/admin/ai', label: 'AI & Intelligence', Icon: Bot },
  {
    type: 'group', label: 'Users & Access', Icon: Users,
    items: [
      { type: 'leaf', href: '/admin/students', label: 'All Users', Icon: Users },
      { type: 'leaf', href: '/admin/invites', label: 'Invitations', Icon: UserPlus },
    ],
  },
  { type: 'leaf', href: '/admin/reports', label: 'Reports', Icon: BarChart2 },
  { type: 'leaf', href: '/admin/settings', label: 'Settings', Icon: Settings },
]

// ─── Flat nav for other portals ───────────────────────────────────────────────

const FLAT_NAV: Record<Exclude<Portal, 'admin'>, NavLeaf[]> = {
  student: [
    { type: 'leaf', href: '/student', label: 'Dashboard', Icon: LayoutDashboard },
    { type: 'leaf', href: '/student/courses', label: 'My Courses', Icon: BookOpen },
    { type: 'leaf', href: '/student/assignments', label: 'Assignments', Icon: ClipboardCheck },
    { type: 'leaf', href: '/student/live-classes', label: 'Live Classes', Icon: Video },
    { type: 'leaf', href: '/student/announcements', label: 'Announcements', Icon: Megaphone },
    { type: 'leaf', href: '/student/messages', label: 'Messages', Icon: MessageSquare },
    { type: 'leaf', href: '/student/attendance', label: 'Attendance', Icon: ClipboardList },
    { type: 'leaf', href: '/student/grades', label: 'Grades', Icon: BarChart2 },
    { type: 'leaf', href: '/student/transcript', label: 'Transcript', Icon: FileText },
    { type: 'leaf', href: '/student/fees', label: 'Fees & Payments', Icon: DollarSign },
    { type: 'leaf', href: '/student/timetable', label: 'Timetable', Icon: Calendar },
    { type: 'leaf', href: '/student/clubs', label: 'Clubs', Icon: Users },
    { type: 'leaf', href: '/student/events', label: 'Events', Icon: CalendarDays },
    { type: 'leaf', href: '/student/hostel', label: 'Hostel', Icon: Building },
    { type: 'leaf', href: '/student/maintenance', label: 'Maintenance', Icon: Wrench },
    { type: 'leaf', href: '/student/elections', label: 'Elections', Icon: Vote },
    { type: 'leaf', href: '/student/career', label: 'Career Center', Icon: Briefcase },
    { type: 'leaf', href: '/student/library', label: 'Library', Icon: Library },
    { type: 'leaf', href: '/student/ai', label: 'AI Assistant', Icon: Bot },
    { type: 'leaf', href: '/student/profile', label: 'Profile', Icon: User },
  ],
  staff: [
    { type: 'leaf', href: '/staff', label: 'Dashboard', Icon: LayoutDashboard },
    { type: 'leaf', href: '/staff/courses', label: 'My Courses', Icon: BookOpen },
    { type: 'leaf', href: '/staff/lms', label: 'LMS', Icon: Library },
    { type: 'leaf', href: '/staff/live-classes', label: 'Live Classes', Icon: Video },
    { type: 'leaf', href: '/staff/leave', label: 'Leave', Icon: CalendarOff },
    { type: 'leaf', href: '/staff/messages', label: 'Messages', Icon: MessageSquare },
    { type: 'leaf', href: '/staff/announcements', label: 'Announcements', Icon: Megaphone },
    { type: 'leaf', href: '/staff/attendance', label: 'Attendance', Icon: ClipboardList },
    { type: 'leaf', href: '/staff/grades', label: 'Grades', Icon: BarChart2 },
    { type: 'leaf', href: '/staff/assignments', label: 'Assignments', Icon: ClipboardCheck },
    { type: 'leaf', href: '/staff/timetable', label: 'Timetable', Icon: Calendar },
    { type: 'leaf', href: '/staff/profile', label: 'Profile', Icon: User },
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
      {!indent && active && <span className={`w-1.5 h-1.5 rounded-full ${a.dot} flex-shrink-0`} />}
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

  // Track which groups are open (admin only)
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    if (portal === 'admin') {
      ADMIN_NAV.forEach(entry => {
        if (entry.type === 'group' && groupHasActive(entry, pathname)) {
          initial.add(entry.label)
        }
      })
    }
    return initial
  })

  // Auto-expand group when navigating to a child page
  useEffect(() => {
    if (portal !== 'admin') return
    ADMIN_NAV.forEach(entry => {
      if (entry.type === 'group' && groupHasActive(entry, pathname)) {
        setOpenGroups(prev => {
          if (prev.has(entry.label)) return prev
          const next = new Set(prev)
          next.add(entry.label)
          return next
        })
      }
    })
  }, [pathname, portal])

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
          <div className={`w-8 h-8 ${a.bg} rounded-xl flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0`}>
            {schoolLogo
              ? <img src={schoolLogo} alt="logo" className="w-6 h-6 object-contain" />
              : <span className="text-white text-xs font-bold">{initials}</span>
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
        {portal === 'admin'
          ? ADMIN_NAV.map(entry =>
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
            )
          : (FLAT_NAV[portal as Exclude<Portal, 'admin'>] ?? []).map(item => (
              <LeafLink
                key={item.href}
                item={item}
                active={isLeafActive(item.href, pathname)}
                a={a}
              />
            ))
        }
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
