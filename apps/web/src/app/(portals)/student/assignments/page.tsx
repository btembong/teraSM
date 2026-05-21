import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ClipboardCheck, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'

const statusStyle: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-500',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  LATE:      'bg-blue-50 text-blue-700',
  GRADED:    'bg-blue-100 text-blue-800',
  RETURNED:  'bg-blue-50 text-blue-700',
}

export default async function StudentAssignmentsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const enrollments = await prisma.enrollment.findMany({
    where: { tenantId, studentId: userId, status: 'ENROLLED' },
    select: { courseOfferingId: true },
  })
  const offeringIds = enrollments.map((e) => e.courseOfferingId)

  const [assignments, submissions] = await Promise.all([
    prisma.assignment.findMany({
      where: { tenantId, courseOfferingId: { in: offeringIds }, isPublished: true },
      include: { courseOffering: { include: { course: true } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.submission.findMany({
      where: { tenantId, studentId: userId },
      select: { assignmentId: true, status: true, score: true },
    }),
  ])

  const subMap: Record<string, { status: string; score?: number | null }> = {}
  submissions.forEach((s) => { subMap[s.assignmentId] = { status: s.status, score: s.score } })

  const now = new Date()
  const overdue   = assignments.filter((a) => !subMap[a.id] && new Date(a.dueDate) < now)
  const pending   = assignments.filter((a) => !subMap[a.id] && new Date(a.dueDate) >= now)
  const submitted = assignments.filter((a) => subMap[a.id])

  function AssignmentCard({ a, sub }: { a: typeof assignments[0]; sub?: { status: string; score?: number | null } }) {
    const isOverdue = new Date(a.dueDate) < now
    const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - now.getTime()) / 86400000)

    return (
      <Link
        href={`/student/assignments/${a.id}`}
        className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-sm transition-all block group"
      >
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <p className="font-semibold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">{a.title}</p>
          {sub ? (
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${statusStyle[sub.status] ?? ''}`}>
              {sub.status}
            </span>
          ) : isOverdue ? (
            <span className="text-xs bg-gray-900 text-white px-2.5 py-1 rounded-full font-semibold flex-shrink-0">Overdue</span>
          ) : (
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${daysLeft <= 1 ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}>
              {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d left`}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">{a.courseOffering.course.title} · {a.courseOffering.course.code}</p>
        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
          <span className={`flex items-center gap-1.5 ${isOverdue && !sub ? 'text-gray-900 font-medium' : ''}`}>
            <Clock className="w-3 h-3" />
            Due {new Date(a.dueDate).toLocaleDateString()}
          </span>
          <span className="font-medium text-gray-500">
            {sub?.score != null ? `${sub.score}/${a.maxScore} pts` : `${a.maxScore} pts`}
          </span>
        </div>
      </Link>
    )
  }

  return (
    <div className="space-y-7">
      <PageHeader title="Assignments" description="All your assignments across enrolled courses" />

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Overdue" value={overdue.length} icon={AlertCircle} iconBg="bg-blue-50" iconColor="text-blue-500" />
        <StatCard label="Pending" value={pending.length} icon={Clock} iconBg="bg-blue-50" iconColor="text-blue-500" />
        <StatCard label="Submitted / Graded" value={submitted.length} icon={CheckCircle} iconBg="bg-blue-50" iconColor="text-blue-600" />
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-gray-400" /> Overdue ({overdue.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {overdue.map((a) => <AssignmentCard key={a.id} a={a} sub={subMap[a.id]} />)}
          </div>
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" /> Upcoming ({pending.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {pending.map((a) => <AssignmentCard key={a.id} a={a} sub={subMap[a.id]} />)}
          </div>
        </div>
      )}

      {/* Submitted */}
      {submitted.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-gray-400" /> Submitted ({submitted.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {submitted.map((a) => <AssignmentCard key={a.id} a={a} sub={subMap[a.id]} />)}
          </div>
        </div>
      )}

      {assignments.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100">
          <EmptyState
            icon={ClipboardCheck}
            title="No assignments yet"
            description="Assignments from your enrolled courses will appear here once published."
            iconBg="bg-blue-50"
            iconColor="text-blue-400"
          />
        </div>
      )}
    </div>
  )
}
