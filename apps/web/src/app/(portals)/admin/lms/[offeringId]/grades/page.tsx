import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { GraduationCap, TrendingUp, CheckCircle2, XCircle, Minus } from 'lucide-react'

function ProgressBar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

export default async function CourseGradesPage({
  params,
}: {
  params: Promise<{ offeringId: string }>
}) {
  const { offeringId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  // All assignments for this course
  const assignments = await prisma.assignment.findMany({
    where: { tenantId, courseOfferingId: offeringId, isPublished: true },
    orderBy: { dueDate: 'asc' },
  })

  // All enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: { tenantId, courseOfferingId: offeringId, status: 'ENROLLED' },
    select: { studentId: true },
  })

  const studentIds = enrollments.map(e => e.studentId)

  // All graded submissions for these students + assignments
  const submissions = await prisma.submission.findMany({
    where: {
      studentId: { in: studentIds },
      assignment: { courseOfferingId: offeringId },
    },
    select: {
      id: true,
      studentId: true,
      assignmentId: true,
      status: true,
      score: true,
      plagiarismScore: true,
    },
  })

  // Student details
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })

  // Build lookup: studentId -> assignmentId -> submission
  const subMap: Record<string, Record<string, typeof submissions[0]>> = {}
  for (const sub of submissions) {
    if (!subMap[sub.studentId]) subMap[sub.studentId] = {}
    subMap[sub.studentId][sub.assignmentId] = sub
  }

  const totalMaxScore = assignments.reduce((s, a) => s + a.maxScore, 0)

  // Per-student summary
  const studentRows = students.map(student => {
    const subs = subMap[student.id] ?? {}
    const submitted  = assignments.filter(a => subs[a.id]).length
    const graded     = assignments.filter(a => subs[a.id]?.status === 'GRADED').length
    const totalScore = assignments.reduce((sum, a) => sum + (subs[a.id]?.score ?? 0), 0)
    const pct = totalMaxScore > 0 && graded > 0 ? Math.round((totalScore / (graded * (totalMaxScore / assignments.length))) * 100) : null
    return { student, submitted, graded, totalScore, pct, subs }
  })

  const classAvg = (() => {
    const scored = studentRows.filter(r => r.graded > 0)
    if (!scored.length) return null
    return Math.round(scored.reduce((s, r) => s + (r.totalScore / Math.max(r.graded, 1)), 0) / scored.length * 10) / 10
  })()

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Enrolled Students', value: students.length },
          { label: 'Published Assignments', value: assignments.length },
          { label: 'Total Max Score', value: totalMaxScore },
          { label: 'Class Average', value: classAvg !== null ? `${classAvg}` : '—' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grade table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-blue-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Student Progress & Grades</h2>
          <span className="ml-auto text-xs text-gray-400">{students.length} students</span>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No enrolled students found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs">Student</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs">Submitted</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs">Graded</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs">Score</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-xs w-48">Progress</th>
                {assignments.slice(0, 6).map(a => (
                  <th key={a.id} className="text-center px-2 py-3 font-medium text-gray-400 text-xs max-w-[60px] truncate" title={a.title}>
                    {a.title.length > 8 ? a.title.slice(0, 8) + '…' : a.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {studentRows.map(({ student, submitted, graded, totalScore, pct, subs }) => (
                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-gray-400">{student.email}</p>
                    </div>
                  </td>
                  <td className="text-center px-3 py-3">
                    <span className="font-semibold text-gray-700">{submitted}</span>
                    <span className="text-gray-400">/{assignments.length}</span>
                  </td>
                  <td className="text-center px-3 py-3">
                    <span className="font-semibold text-gray-700">{graded}</span>
                    <span className="text-gray-400">/{assignments.length}</span>
                  </td>
                  <td className="text-center px-3 py-3">
                    {graded > 0 ? (
                      <span className={`font-bold ${
                        pct !== null && pct >= 70 ? 'text-blue-700' :
                        pct !== null && pct >= 50 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {totalScore.toFixed(0)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <ProgressBar
                      value={submitted}
                      max={assignments.length}
                      color={
                        submitted === assignments.length ? 'bg-blue-500' :
                        submitted > 0 ? 'bg-amber-400' : 'bg-gray-200'
                      }
                    />
                  </td>
                  {assignments.slice(0, 6).map(a => {
                    const sub = subs[a.id]
                    return (
                      <td key={a.id} className="text-center px-2 py-3">
                        {!sub ? (
                          <Minus className="w-3 h-3 text-gray-200 mx-auto" />
                        ) : sub.status === 'GRADED' ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-blue-700">{sub.score}</span>
                            {sub.plagiarismScore !== null && sub.plagiarismScore >= 40 && (
                              <span className="text-[10px] text-amber-500">⚠</span>
                            )}
                          </div>
                        ) : sub.status === 'SUBMITTED' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 mx-auto" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-300 mx-auto" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assignment key */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignment Key</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {assignments.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-mono text-gray-400">#{i + 1}</span>
                <span className="truncate">{a.title}</span>
                <span className="text-gray-300 flex-shrink-0">/{a.maxScore}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
