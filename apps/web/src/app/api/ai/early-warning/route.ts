import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateText } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  // Get all active students
  const students = await prisma.user.findMany({
    where: { tenantId, role: 'STUDENT' },
    select: { id: true, firstName: true, lastName: true },
    take: 100,
  })

  const studentIds = students.map((s) => s.id)

  // Fetch related data separately (User has no direct relations to these)
  const [enrollments, grades, attendanceRecords] = await Promise.all([
    prisma.enrollment.findMany({
      where: { tenantId, studentId: { in: studentIds }, status: 'ENROLLED' },
      select: { studentId: true },
    }),
    prisma.grade.findMany({
      where: { tenantId, studentId: { in: studentIds } },
      select: { studentId: true, totalScore: true },
    }),
    prisma.attendance.findMany({
      where: { tenantId, studentId: { in: studentIds } },
      select: { studentId: true, status: true },
      orderBy: { date: 'desc' },
    }),
  ])

  const enrollMap: Record<string, number> = {}
  enrollments.forEach((e) => { enrollMap[e.studentId] = (enrollMap[e.studentId] ?? 0) + 1 })

  const gradeMap: Record<string, number[]> = {}
  grades.forEach((g) => {
    if (!gradeMap[g.studentId]) gradeMap[g.studentId] = []
    gradeMap[g.studentId].push(g.totalScore ?? 0)
  })

  const attMap: Record<string, { present: number; total: number }> = {}
  attendanceRecords.forEach((a) => {
    if (!attMap[a.studentId]) attMap[a.studentId] = { present: 0, total: 0 }
    attMap[a.studentId].total++
    if (a.status === 'PRESENT') attMap[a.studentId].present++
  })

  const flagged = students
    .map((s) => {
      const att = attMap[s.id] ?? { present: 0, total: 0 }
      const scores = gradeMap[s.id] ?? []
      const totalAttendance = att.total
      const attendanceRate = totalAttendance > 0 ? att.present / totalAttendance : null
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null
      const riskScore =
        (attendanceRate !== null && attendanceRate < 0.7 ? 2 : 0) +
        (attendanceRate !== null && attendanceRate < 0.5 ? 1 : 0) +
        (avgScore !== null && avgScore < 50 ? 2 : 0) +
        (avgScore !== null && avgScore < 40 ? 1 : 0)

      return {
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        attendanceRate: attendanceRate !== null ? Math.round(attendanceRate * 100) : null,
        avgScore: avgScore !== null ? Math.round(avgScore) : null,
        riskScore,
        riskLevel: riskScore >= 4 ? 'HIGH' : riskScore >= 2 ? 'MEDIUM' : 'LOW',
        enrolledCourses: enrollMap[s.id] ?? 0,
      }
    })
    .filter((s) => s.riskScore >= 2)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 20)

  return NextResponse.json(flagged)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { studentData } = await req.json()

  const analysis = await generateText(
    `Analyze this at-risk student and suggest intervention strategies:\n${JSON.stringify(studentData, null, 2)}`,
    'You are an academic counselor AI. Provide specific, compassionate intervention recommendations for at-risk students. Include: immediate actions, support resources to suggest, and timeline for follow-up.',
    500
  )

  return NextResponse.json({ analysis })
}
