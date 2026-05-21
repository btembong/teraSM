import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ModuleTabs } from '@/components/ui/module-tabs'
import { GraduationCap, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function AcademicsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId as string | undefined

  const [deptCount, courseCount] = await Promise.all([
    tenantId ? prisma.department.count({ where: { tenantId } }) : 0,
    tenantId ? prisma.course.count({ where: { tenantId } }) : 0,
  ])

  const tabs = [
    { label: 'Overview',       href: '/admin/academics' },
    { label: 'Departments',    href: '/admin/academics/departments',  badge: deptCount },
    { label: 'Courses',        href: '/admin/academics/courses',      badge: courseCount },
    { label: 'Academic Years', href: '/admin/academics/years' },
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
          <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Academics</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage departments, courses, and academic calendar</p>
          </div>
        </div>
        {/* Tab bar — only serializable data */}
        <ModuleTabs tabs={tabs} />
      </div>
      {children}
    </div>
  )
}
