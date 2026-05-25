import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ClipboardCheck, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function CourseAssignmentsPage({
  params,
}: {
  params: Promise<{ offeringId: string }>
}) {
  const { offeringId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const assignments = await prisma.assignment.findMany({
    where: { tenantId, courseOfferingId: offeringId },
    include: {
      _count: { select: { submissions: true } },
      submissions: {
        where: { status: 'SUBMITTED' },
        select: { id: true },
      },
    },
    orderBy: { dueDate: 'asc' },
  })

  const now = new Date()
  const upcoming = assignments.filter(a => new Date(a.dueDate) >= now && a.isPublished)
  const overdue  = assignments.filter(a => new Date(a.dueDate) < now && a.isPublished)
  const drafts   = assignments.filter(a => !a.isPublished)
  const needsGrading = assignments.reduce((sum, a) => sum + a.submissions.length, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total',         value: assignments.length,    color: 'text-gray-900' },
          { label: 'Upcoming',      value: upcoming.length,       color: 'text-blue-700' },
          { label: 'Overdue',       value: overdue.length,        color: overdue.length > 0 ? 'text-red-600' : 'text-gray-900' },
          { label: 'Needs Grading', value: needsGrading,          color: needsGrading > 0 ? 'text-amber-600' : 'text-gray-900' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Needs grading alert */}
      {needsGrading > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{needsGrading} submission{needsGrading > 1 ? 's' : ''}</span> waiting to be graded.
          </p>
          <Link
            href={`/admin/lms/${offeringId}/submissions`}
            className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900 underline"
          >
            Go to Submissions
          </Link>
        </div>
      )}

      {/* Assignments list */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-blue-500" />
          <h2 className="font-semibold text-gray-900 text-sm">All Assignments</h2>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No assignments yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {assignments.map((a) => {
              const isOverdue = new Date(a.dueDate) < now && a.isPublished
              const pending   = a.submissions.length
              return (
                <div key={a.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {a.isPublished ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                        {!a.isPublished && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Draft</span>
                        )}
                      </div>
                      {a.description && (
                        <p className="text-xs text-gray-400 ml-5 mb-1 line-clamp-1">{a.description}</p>
                      )}
                      <div className="flex items-center gap-3 ml-5 text-xs text-gray-400">
                        <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                          Due {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span>·</span>
                        <span>Max {a.maxScore} pts</span>
                        {a.allowLate && <span>· Late submissions allowed</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{a._count.submissions}</p>
                        <p className="text-xs text-gray-400">submitted</p>
                      </div>
                      {pending > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">
                          <AlertCircle className="w-3 h-3" /> {pending} ungraded
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Drafts section */}
      {drafts.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 px-6 py-4">
          <p className="text-xs font-medium text-gray-500 mb-2">UNPUBLISHED DRAFTS</p>
          <div className="space-y-1">
            {drafts.map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{a.title}</span>
                <span className="text-xs text-gray-400">
                  Due {new Date(a.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
