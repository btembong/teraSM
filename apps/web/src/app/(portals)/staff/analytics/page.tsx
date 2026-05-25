import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BarChart2, Users, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

function ProgressBar({ pct, color = 'bg-blue-500' }: { pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

export default async function StaffAnalyticsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId
  const teacherId = (session.user as any).id

  const offerings = await prisma.courseOffering.findMany({
    where: { tenantId, teacherId },
    include: {
      course: { select: { code: true, title: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const offeringIds = offerings.map(o => o.id)

  const [assignments, submissions, attendanceRecords, quizAttempts] = await Promise.all([
    prisma.assignment.findMany({
      where: { tenantId, courseOfferingId: { in: offeringIds }, isPublished: true },
      select: { id: true, courseOfferingId: true, maxScore: true },
    }),
    prisma.submission.findMany({
      where: { assignment: { courseOfferingId: { in: offeringIds } }, status: 'GRADED' },
      select: { assignmentId: true, score: true, studentId: true },
    }),
    prisma.attendance.findMany({
      where: { tenantId, courseOfferingId: { in: offeringIds } },
      select: { courseOfferingId: true, studentId: true, status: true },
    }),
    db.quizAttempt.findMany({
      where: { submittedAt: { not: null } },
      select: { score: true, maxScore: true, isPassed: true },
    }).catch(() => [] as any[]),
  ])

  // Build per-offering analytics
  const assignmentsByOffering = assignments.reduce((acc: Record<string, typeof assignments>, a) => {
    if (!acc[a.courseOfferingId]) acc[a.courseOfferingId] = []
    acc[a.courseOfferingId].push(a)
    return acc
  }, {})

  const submissionsByAssignment = submissions.reduce((acc: Record<string, typeof submissions>, s) => {
    if (!acc[s.assignmentId]) acc[s.assignmentId] = []
    acc[s.assignmentId].push(s)
    return acc
  }, {})

  const attendanceByOffering = attendanceRecords.reduce((acc: Record<string, { present: number; total: number }>, r) => {
    if (!acc[r.courseOfferingId]) acc[r.courseOfferingId] = { present: 0, total: 0 }
    acc[r.courseOfferingId].total++
    if (r.status === 'PRESENT') acc[r.courseOfferingId].present++
    return acc
  }, {})

  // Global quiz stats
  const totalAttempts = quizAttempts.length
  const passedAttempts = quizAttempts.filter((a: any) => a.isPassed).length
  const quizPassRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : null

  // Per-offering stats
  const courseStats = offerings.map(o => {
    const offeringAssignments = assignmentsByOffering[o.id] ?? []
    const enrolled = o._count.enrollments

    // Avg grade
    let totalScore = 0, totalMax = 0, gradedCount = 0
    offeringAssignments.forEach(a => {
      const subs = submissionsByAssignment[a.id] ?? []
      subs.forEach(s => {
        totalScore += s.score ?? 0
        totalMax += a.maxScore
        gradedCount++
      })
    })
    const avgGrade = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null

    // Submission rate
    const expectedSubs = offeringAssignments.length * enrolled
    const actualSubs = offeringAssignments.reduce((s, a) => s + (submissionsByAssignment[a.id]?.length ?? 0), 0)
    const submissionRate = expectedSubs > 0 ? Math.round((actualSubs / expectedSubs) * 100) : null

    // Attendance rate
    const att = attendanceByOffering[o.id]
    const attendanceRate = att ? Math.round((att.present / att.total) * 100) : null

    // At-risk students: attendance < 70% or avg grade < 50%
    const atRiskStudents: string[] = []
    const studentAttendance = attendanceRecords
      .filter(r => r.courseOfferingId === o.id)
      .reduce((acc: Record<string, { p: number; t: number }>, r) => {
        if (!acc[r.studentId]) acc[r.studentId] = { p: 0, t: 0 }
        acc[r.studentId].t++
        if (r.status === 'PRESENT') acc[r.studentId].p++
        return acc
      }, {})
    Object.entries(studentAttendance).forEach(([sid, { p, t }]) => {
      if (t > 0 && (p / t) * 100 < 70) atRiskStudents.push(sid)
    })

    return { offering: o, avgGrade, submissionRate, attendanceRate, atRiskCount: atRiskStudents.length }
  })

  const totalAtRisk = courseStats.reduce((s, c) => s + c.atRiskCount, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Teaching Analytics</h1>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Courses Teaching" value={offerings.length} icon={BarChart2} />
        <StatCard label="Total Students" value={offerings.reduce((s, o) => s + o._count.enrollments, 0)} icon={Users} />
        <StatCard label="At-Risk Students" value={totalAtRisk} icon={AlertTriangle} danger={totalAtRisk > 0} />
        <StatCard label="Quiz Pass Rate" value={quizPassRate !== null ? `${quizPassRate}%` : '—'} icon={CheckCircle2} />
      </div>

      {/* Per-course breakdown */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900">Course Breakdown</h2>
        {courseStats.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 text-gray-400 text-sm">
            No courses assigned yet.
          </div>
        ) : (
          courseStats.map(({ offering: o, avgGrade, submissionRate, attendanceRate, atRiskCount }) => (
            <div key={o.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{o.course.title}</p>
                  <p className="text-xs text-gray-400">{o.course.code} · {o._count.enrollments} students</p>
                </div>
                {atRiskCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-full font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {atRiskCount} at risk
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Avg Grade
                  </p>
                  {avgGrade !== null
                    ? <ProgressBar pct={avgGrade} color={avgGrade >= 70 ? 'bg-green-500' : avgGrade >= 50 ? 'bg-amber-400' : 'bg-red-400'} />
                    : <p className="text-xs text-gray-300">No graded submissions</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Submission Rate
                  </p>
                  {submissionRate !== null
                    ? <ProgressBar pct={submissionRate} color="bg-blue-500" />
                    : <p className="text-xs text-gray-300">No assignments</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Attendance
                  </p>
                  {attendanceRate !== null
                    ? <ProgressBar pct={attendanceRate} color={attendanceRate >= 80 ? 'bg-green-500' : attendanceRate >= 60 ? 'bg-amber-400' : 'bg-red-400'} />
                    : <p className="text-xs text-gray-300">No records yet</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, danger }: { label: string; value: number | string; icon: any; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${danger ? 'border-red-200 bg-red-50' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${danger ? 'bg-red-100' : 'bg-blue-50'}`}>
          <Icon className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-blue-500'}`} />
        </div>
        <div>
          <p className={`text-2xl font-bold ${danger ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  )
}
