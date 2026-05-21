import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateText } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  // Get all active students with their attendance and grades
  const students = await prisma.user.findMany({
    where: { tenantId, role: 'STUDENT' },
    select: {
      id: true, firstName: true, lastName: true,
      enrollments: { where: { tenantId, status: 'ENROLLED' }, select: { id: true } },
      grades: { where: { tenantId }, select: { totalScore: true, finalGrade: true } },
      attendanceRecords: {
        where: { tenantId },
        select: { status: true },
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
    take: 100,
  })

  const flagged = students
    .map((s) => {
      const totalAttendance = s.attendanceRecords.length
      const presentCount = s.attendanceRecords.filter((a) => a.status === 'PRESENT').length
      const attendanceRate = totalAttendance > 0 ? presentCount / totalAttendance : null
      const avgScore =
        s.grades.length > 0
          ? s.grades.reduce((sum, g) => sum + (g.totalScore ?? 0), 0) / s.grades.length
          : null
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
        enrolledCourses: s.enrollments.length,
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
