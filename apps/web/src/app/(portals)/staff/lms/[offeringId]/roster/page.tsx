import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Users, Mail, CheckCircle2, XCircle, Minus, BarChart2 } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export default async function StaffRosterPage({
  params,
}: {
  params: Promise<{ offeringId: string }>
}) {
  const { offeringId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const [offering, enrollments, assignments] = await Promise.all([
    prisma.courseOffering.findUnique({
      where: { id: offeringId },
      include: { course: true },
    }),
    prisma.enrollment.findMany({
      where: { tenantId, courseOfferingId: offeringId, status: 'ENROLLED' },
      select: { studentId: true },
    }),
    prisma.assignment.findMany({
      where: { tenantId, courseOfferingId: offeringId, isPublished: true },
      select: { id: true, title: true, maxScore: true },
    }),
  ])

  if (!offering) redirect('/staff')

  const studentIds = enrollments.map(e => e.studentId)

  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
    orderBy: { lastName: 'asc' },
  })
  const [submissions, attendanceRecords] = await Promise.all([
    prisma.submission.findMany({
      where: { studentId: { in: studentIds }, assignment: { courseOfferingId: offeringId } },
      select: { studentId: true, assignmentId: true, score: true, status: true },
    }),
    prisma.attendance.findMany({
      where: { tenantId, courseOfferingId: offeringId, studentId: { in: studentIds } },
      select: { studentId: true, status: true },
    }),
  ])

  // Attempt quiz scores per student
  const quizAttempts: Array<{ studentId: string; score: number | null; maxScore: number | null }> =
    await db.quizAttempt
      .findMany({
        where: { studentId: { in: studentIds }, submittedAt: { not: null } },
        select: { studentId: true, score: true, maxScore: true },
      })
      .catch(() => [])

  // Build lookups
  const subMap: Record<string, Record<string, { score: number | null; status: string }>> = {}
  submissions.forEach(s => {
    if (!subMap[s.studentId]) subMap[s.studentId] = {}
    subMap[s.studentId][s.assignmentId] = { score: s.score, status: s.status }
  })

  const attMap: Record<string, { present: number; total: number }> = {}
  attendanceRecords.forEach(r => {
    if (!attMap[r.studentId]) attMap[r.studentId] = { present: 0, total: 0 }
    attMap[r.studentId].total++
    if (r.status === 'PRESENT') attMap[r.studentId].present++
  })

  const quizMap: Record<string, { earned: number; possible: number }> = {}
  quizAttempts.forEach((a) => {
    if (!quizMap[a.studentId]) quizMap[a.studentId] = { earned: 0, possible: 0 }
    quizMap[a.studentId].earned += a.score ?? 0
    quizMap[a.studentId].possible += a.maxScore ?? 0
  })

  const rows = students.map(s => {
    const subs = subMap[s.id] ?? {}
    const att = attMap[s.id] ?? { present: 0, total: 0 }
    const quiz = quizMap[s.id] ?? { earned: 0, possible: 0 }

    const assignmentPts = assignments.reduce((sum, a) => sum + (subs[a.id]?.score ?? 0), 0)
    const assignmentMax = assignments.reduce((sum, a) => sum + a.maxScore, 0)
    const totalPts = assignmentPts + quiz.earned
    const totalMax = assignmentMax + quiz.possible
    const pct = totalMax > 0 ? Math.round((totalPts / totalMax) * 100) : null
    const attPct = att.total > 0 ? Math.round((att.present / att.total) * 100) : null
    const submitted = Object.keys(subs).length

    return { s, submitted, attPct, pct, totalPts, totalMax }
  })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Enrolled Students', value: enrollments.length },
          { label: 'Assignments', value: assignments.length },
          { label: 'Avg Attendance', value: (() => {
            const withAtt = rows.filter(r => r.attPct !== null)
            return withAtt.length ? `${Math.round(withAtt.reduce((s, r) => s + (r.attPct ?? 0), 0) / withAtt.length)}%` : '—'
          })() },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Class Roster</h2>
          <span className="ml-auto text-xs text-gray-400">{enrollments.length} students</span>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No enrolled students.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-medium text-gray-500">
                <th className="text-left px-6 py-3">Student</th>
                <th className="text-center px-4 py-3">Submissions</th>
                <th className="text-center px-4 py-3">Attendance</th>
                <th className="text-center px-4 py-3">Score</th>
                <th className="text-center px-4 py-3">Grade</th>
                <th className="text-center px-4 py-3">At Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(({ s, submitted, attPct, pct, totalPts, totalMax }) => {
                const atRisk = (attPct !== null && attPct < 70) || (pct !== null && pct < 50)
                return (
                  <tr key={s.id} className={`hover:bg-gray-50/50 transition-colors ${atRisk ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {s.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center px-4 py-3 text-sm">
                      <span className="font-semibold text-gray-700">{submitted}</span>
                      <span className="text-gray-400">/{assignments.length}</span>
                    </td>
                    <td className="text-center px-4 py-3">
                      {attPct !== null ? (
                        <span className={`text-sm font-semibold ${attPct < 70 ? 'text-red-500' : attPct < 85 ? 'text-amber-500' : 'text-green-600'}`}>
                          {attPct}%
                        </span>
                      ) : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="text-center px-4 py-3 text-sm text-gray-600">
                      {totalMax > 0 ? `${totalPts.toFixed(0)}/${totalMax}` : '—'}
                    </td>
                    <td className="text-center px-4 py-3">
                      {pct !== null ? (
                        <span className={`text-sm font-bold ${pct >= 70 ? 'text-blue-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                          {pct}%
                        </span>
                      ) : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="text-center px-4 py-3">
                      {atRisk
                        ? <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                        : pct !== null
                        ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                        : <Minus className="w-4 h-4 text-gray-200 mx-auto" />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
