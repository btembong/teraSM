import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Users, ClipboardCheck, FileText, Clock, CheckCircle } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { SectionCard, SectionRow } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'

export default async function StaffCourseDetailPage({
  params,
}: {
  params: Promise<{ offeringId: string }>
}) {
  const { offeringId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const [offering, enrollments, assignments, contents] = await Promise.all([
    prisma.courseOffering.findUnique({
      where: { id: offeringId },
      include: { course: true, semester: { include: { academicYear: true } } },
    }),
    prisma.enrollment.findMany({
      where: { tenantId, courseOfferingId: offeringId, status: 'ENROLLED' },
    }),
    prisma.assignment.findMany({
      where: { tenantId, courseOfferingId: offeringId },
      include: { _count: { select: { submissions: true } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.courseContent.findMany({
      where: { tenantId, courseOfferingId: offeringId },
      orderBy: { order: 'asc' },
    }),
  ])

  if (!offering) redirect('/staff/courses')

  const pendingCount = assignments.reduce((s, a) => s + a._count.submissions, 0)

  return (
    <div className="space-y-7">

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/staff" className="mt-1 p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{offering.course.title}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {offering.course.code} · {offering.semester.academicYear.name} · {offering.semester.name}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Students" value={enrollments.length} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="Assignments" value={assignments.length} icon={ClipboardCheck} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="Materials" value={contents.length} icon={FileText} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="Submissions" value={pendingCount} icon={Clock} iconBg="bg-blue-50" iconColor="text-blue-600" />
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/staff/lms/${offeringId}`}
          className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Course Hub</p>
          <p className="text-sm text-gray-500 mt-0.5">Materials, assignments, submissions & grades</p>
        </Link>
        <Link
          href={`/staff/courses/${offeringId}/grade-entry`}
          className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
            <ClipboardCheck className="w-5 h-5 text-blue-500" />
          </div>
          <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Grade Entry</p>
          <p className="text-sm text-gray-500 mt-0.5">Enter CA & exam scores for official grades</p>
        </Link>
      </div>

      {/* Assignments list */}
      <SectionCard title="Assignments" icon={ClipboardCheck} iconColor="text-blue-500" noPadding>
        {assignments.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No assignments yet"
            description="Add assignments via the LMS content manager."
            iconBg="bg-blue-50"
            iconColor="text-blue-400"
          />
        ) : (
          <div>
            {assignments.map((a) => {
              const isOverdue = new Date(a.dueDate) < new Date()
              return (
                <SectionRow key={a.id}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                    <p className={`text-xs mt-0.5 ${isOverdue ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                      Due {new Date(a.dueDate).toLocaleDateString()} · {a.maxScore} pts
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                    <span className="text-xs text-gray-500 font-medium">{a._count.submissions} submissions</span>
                    {a.isPublished ? (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold">
                        <CheckCircle className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">Draft</span>
                    )}
                  </div>
                </SectionRow>
              )
            })}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
