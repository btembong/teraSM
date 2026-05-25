import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ModuleTabs } from '@/components/ui/module-tabs'
import { Library, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function LmsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId as string | undefined

  const [contentCount, assignmentCount, submissionCount] = await Promise.all([
    tenantId ? prisma.courseContent.count({ where: { tenantId } }) : 0,
    tenantId ? prisma.assignment.count({ where: { tenantId } }) : 0,
    tenantId ? prisma.submission.count({ where: { assignment: { courseOffering: { tenantId } }, status: 'SUBMITTED' } }) : 0,
  ])

  const tabs = [
    { label: 'Courses',     href: '/admin/lms',              icon: 'BookOpen',      group: 'overview' },
    { label: 'Materials',   href: '/admin/lms/materials',    icon: 'ScrollText',    badge: contentCount,    group: 'content' },
    { label: 'Assignments', href: '/admin/lms/assignments',  icon: 'ClipboardList', badge: assignmentCount, group: 'content' },
    { label: 'Submissions', href: '/admin/lms/submissions',  icon: 'UserCheck',     badge: submissionCount, group: 'grading' },
  ]

  return (
    <div>
      <div className="mb-8 -mt-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Link href="/admin" className="hover:text-gray-600 transition-colors">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">LMS</span>
        </div>
        {/* Module identity */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Library className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Learning Management System</h1>
            <p className="text-sm text-gray-400 mt-0.5">Course content, assignments, submissions and discussions</p>
          </div>
        </div>
        <ModuleTabs tabs={tabs} />
      </div>
      {children}
    </div>
  )
}
