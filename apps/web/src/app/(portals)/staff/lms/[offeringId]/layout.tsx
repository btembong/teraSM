import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ModuleTabs } from '@/components/ui/module-tabs'
import { BookOpen, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function StaffCourseHubLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ offeringId: string }>
}) {
  const { offeringId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const [offering, submissionCount, threadCount] = await Promise.all([
    prisma.courseOffering.findUnique({
      where: { id: offeringId },
      include: { course: true, semester: { include: { academicYear: true } } },
    }),
    prisma.submission.count({
      where: {
        assignment: { courseOfferingId: offeringId, tenantId },
        status: 'SUBMITTED',
      },
    }),
    prisma.discussionThread.count({
      where: { tenantId, courseOfferingId: offeringId },
    }),
  ])

  if (!offering) redirect('/staff')

  const base = `/staff/lms/${offeringId}`

  const tabs = [
    { label: 'Materials',   href: base,                   icon: 'ScrollText',    group: 'content' },
    { label: 'Assignments', href: `${base}/assignments`,  icon: 'ClipboardList', group: 'content' },
    { label: 'Quizzes',     href: `${base}/quizzes`,      icon: 'Award',         group: 'content' },
    { label: 'Submissions', href: `${base}/submissions`,  icon: 'UserCheck',     badge: submissionCount, group: 'work' },
    { label: 'Discussions', href: `${base}/discussions`,  icon: 'Users',         badge: threadCount,     group: 'work' },
    { label: 'Grades',      href: `${base}/grades`,       icon: 'BarChart2',     group: 'grading' },
    { label: 'Roster',      href: `${base}/roster`,       icon: 'ClipboardList', group: 'management' },
  ]

  return (
    <div>
      <div className="mb-8 -mt-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Link href="/staff" className="hover:text-gray-600 transition-colors">Staff</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/staff" className="hover:text-gray-600 transition-colors">My Courses</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">{offering.course.code}</span>
        </div>
        {/* Course identity */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">{offering.course.title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {offering.course.code} · {offering.semester.academicYear.name} · {offering.semester.name}
            </p>
          </div>
        </div>
        <ModuleTabs tabs={tabs} />
      </div>
      {children}
    </div>
  )
}
