import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ClipboardCheck, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { AddAssignmentForm } from './AddAssignmentForm'
import { TogglePublishButton } from '../TogglePublishButton'
import Link from 'next/link'

export default async function StaffAssignmentsPage({
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
      submissions: { where: { status: 'SUBMITTED' }, select: { id: true } },
    },
    orderBy: { dueDate: 'asc' },
  })

  const now = new Date()
  const needsGrading = assignments.reduce((s, a) => s + a.submissions.length, 0)
  const overdue      = assignments.filter(a => new Date(a.dueDate) < now && a.isPublished).length

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Assignments', value: assignments.length },
          { label: 'Overdue',           value: overdue,       color: overdue > 0 ? 'text-red-600' : 'text-gray-900' },
          { label: 'Needs Grading',     value: needsGrading,  color: needsGrading > 0 ? 'text-amber-600' : 'text-gray-900' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className={`text-2xl font-bold ${(s as any).color ?? 'text-gray-900'}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grading alert */}
      {needsGrading > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{needsGrading} submission{needsGrading > 1 ? 's' : ''}</span> waiting to be graded.
          </p>
          <Link
            href={`/staff/lms/${offeringId}/submissions`}
            className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900 underline"
          >
            Go to Submissions
          </Link>
        </div>
      )}

      {/* Add form */}
      <div className="flex justify-end">
        <AddAssignmentForm offeringId={offeringId} />
      </div>

      {/* Assignments list */}
      <div className="bg-white rounded-2xl border border-gray-200">
        {assignments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No assignments yet. Click "Add Assignment" to create one.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {assignments.map(a => {
              const isOverdue = new Date(a.dueDate) < now && a.isPublished
              const pending   = a.submissions.length
              return (
                <div key={a.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      {a.isPublished
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        : <Clock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      }
                      <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                      {pending > 0 && (
                        <span className="flex-shrink-0 text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                          {pending} ungraded
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ml-5 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      Due {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{a.maxScore} pts
                      {' · '}{a._count.submissions} submitted
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                    <TogglePublishButton id={a.id} type="assignment" isPublished={a.isPublished} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
