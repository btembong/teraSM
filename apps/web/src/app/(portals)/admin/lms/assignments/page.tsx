import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ClipboardCheck, Clock, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react'

export default async function LmsAssignmentsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const now = new Date()

  const assignments = await prisma.assignment.findMany({
    where: { tenantId },
    include: {
      courseOffering: { include: { course: true } },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  })

  // Get submitted (pending grading) counts per assignment
  const submittedCounts = await prisma.submission.groupBy({
    by: ['assignmentId'],
    where: {
      tenantId,
      status: 'SUBMITTED',
    },
    _count: true,
  })
  const submittedMap = Object.fromEntries(submittedCounts.map(s => [s.assignmentId, s._count]))

  const overdue    = assignments.filter(a => new Date(a.dueDate) < now && a.isPublished)
  const upcoming   = assignments.filter(a => new Date(a.dueDate) >= now && a.isPublished)
  const drafts     = assignments.filter(a => !a.isPublished)
  const toGrade    = assignments.filter(a => (submittedMap[a.id] ?? 0) > 0)

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',        value: assignments.length,  icon: ClipboardCheck, cls: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'Upcoming',     value: upcoming.length,     icon: Clock,          cls: 'text-blue-500',  bg: 'bg-blue-50' },
          { label: 'Overdue',      value: overdue.length,      icon: AlertTriangle,  cls: 'text-gray-700',  bg: 'bg-gray-100' },
          { label: 'Need Grading', value: toGrade.length,      icon: CheckCircle2,   cls: 'text-blue-600',  bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.cls}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Needs Grading — priority section */}
      {toGrade.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Needs Grading</h2>
            <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
              {toGrade.reduce((s, a) => s + (submittedMap[a.id] ?? 0), 0)} submissions
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {toGrade.map(a => {
              const pending = submittedMap[a.id] ?? 0
              return (
                <Link
                  key={a.id}
                  href={`/admin/lms/submissions?assignment=${a.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.courseOffering.course.code} · Due {new Date(a.dueDate).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full flex-shrink-0">
                    {pending} to grade
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* All assignments */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">All Assignments</h2>
          <span className="text-xs text-gray-400">{assignments.length} total</span>
        </div>

        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
              <ClipboardCheck className="w-6 h-6 text-blue-400" />
            </div>
            <p className="font-semibold text-gray-700">No assignments yet</p>
            <p className="text-sm text-gray-400 mt-1">Go into a course to create assignments</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {assignments.map(a => {
              const isOverdue  = new Date(a.dueDate) < now
              const pending    = submittedMap[a.id] ?? 0
              const total      = a._count.submissions

              return (
                <Link
                  key={a.id}
                  href={`/admin/lms/${a.courseOfferingId}/assignments`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.courseOffering.course.code} · {a.courseOffering.course.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                    <span className={isOverdue && a.isPublished ? 'text-gray-700 font-semibold' : 'text-gray-400'}>
                      {isOverdue ? 'Was due' : 'Due'} {new Date(a.dueDate).toLocaleDateString()}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-500">{total} submitted</span>
                    {pending > 0 && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{pending} pending</span>
                    )}
                    {!a.isPublished && (
                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Draft</span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
