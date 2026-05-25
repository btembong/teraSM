import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ModuleTabs } from '@/components/ui/module-tabs'
import { Users, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function StudentsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId as string | undefined

  const [studentCount, enrollmentCount] = await Promise.all([
    tenantId ? prisma.user.count({ where: { tenantId, role: 'STUDENT', status: 'ACTIVE' } }) : 0,
    tenantId ? prisma.enrollment.count({ where: { tenantId, status: 'ENROLLED' } }) : 0,
  ])

  const tabs = [
    { label: 'All Students',  href: '/admin/students',                icon: 'Users',         badge: studentCount,    group: 'directory' },
    { label: 'Enrollments',   href: '/admin/students/enrollments',    icon: 'ClipboardList', badge: enrollmentCount, group: 'academic' },
    { label: 'Progression',   href: '/admin/students/progression',    icon: 'BarChart2',                             group: 'academic' },
    { label: 'Year Promotion', href: '/admin/students/promotion',     icon: 'ChevronsUp',                            group: 'academic' },
    { label: 'Graduation',    href: '/admin/students/graduation',     icon: 'GraduationCap',                         group: 'academic' },
    { label: 'Grades',        href: '/admin/students/grades',         icon: 'Award',                                 group: 'academic' },
    { label: 'Transcripts',   href: '/admin/students/transcripts',    icon: 'ScrollText',                            group: 'records' },
    { label: 'Invitations',   href: '/admin/invites',                 icon: 'UserCheck',                             group: 'access' },
  ]

  return (
    <div>
      <div className="mb-8 -mt-1">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Link href="/admin" className="hover:text-gray-600 transition-colors">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">Student Management</span>
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Student Management</h1>
            <p className="text-sm text-gray-400 mt-0.5">Admissions, enrollments, progression, grades and transcripts</p>
          </div>
        </div>
        <ModuleTabs tabs={tabs} />
      </div>
      {children}
    </div>
  )
}
