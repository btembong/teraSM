import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ModuleTabs } from '@/components/ui/module-tabs'
import { GraduationCap, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function AcademicsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId as string | undefined

  const [deptCount, programCount, courseCount, offeringCount, roomCount] = await Promise.all([
    tenantId ? prisma.department.count({ where: { tenantId } }) : 0,
    tenantId ? (prisma as any).program.count({ where: { tenantId } }) : 0,
    tenantId ? prisma.course.count({ where: { tenantId } }) : 0,
    tenantId ? prisma.courseOffering.count({ where: { tenantId } }) : 0,
    tenantId ? prisma.room.count({ where: { tenantId } }) : 0,
  ])

  const tabs = [
    // ── Overview ───────────────────────────────────────────────────────────────
    { label: 'Overview',    href: '/admin/academics',             icon: 'LayoutDashboard', group: 'overview' },
    // ── Catalog ────────────────────────────────────────────────────────────────
    { label: 'Structure',   href: '/admin/academics/structure',   icon: 'Network',         group: 'catalog' },
    { label: 'Departments', href: '/admin/academics/departments', icon: 'Building2',       badge: deptCount,     group: 'catalog' },
    { label: 'Programs',    href: '/admin/academics/programs',    icon: 'GraduationCap',   badge: programCount,  group: 'catalog' },
    { label: 'Courses',     href: '/admin/academics/courses',     icon: 'BookOpen',        badge: courseCount,   group: 'catalog' },
    // ── Scheduling ─────────────────────────────────────────────────────────────
    { label: 'Offerings',   href: '/admin/academics/offerings',   icon: 'CalendarDays',    badge: offeringCount, group: 'scheduling' },
    // ── Resources ──────────────────────────────────────────────────────────────
    { label: 'Rooms',       href: '/admin/academics/rooms',       icon: 'DoorOpen',        badge: roomCount,     group: 'resources' },
    // ── Policy ─────────────────────────────────────────────────────────────────
    { label: 'Calendar',    href: '/admin/academics/calendar',    icon: 'CalendarRange',   group: 'policy' },
    { label: 'Grading',     href: '/admin/academics/grading',     icon: 'Award',           group: 'policy' },
    { label: 'Resits',      href: '/admin/academics/resits',      icon: 'RotateCcw',       group: 'policy' },
  ]

  return (
    <div>
      <div className="mb-8 -mt-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Link href="/admin" className="hover:text-gray-600 transition-colors">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">Academics</span>
        </div>
        {/* Module identity */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Academic Structure</h1>
            <p className="text-sm text-gray-400 mt-0.5">Define your institution's catalog — faculties, programs, courses, and calendar</p>
          </div>
        </div>
        {/* Tab bar */}
        <ModuleTabs tabs={tabs} />
      </div>
      {children}
    </div>
  )
}
