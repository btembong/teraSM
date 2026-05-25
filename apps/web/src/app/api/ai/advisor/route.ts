import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateText } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  // Gather student context
  const [enrollments, grades, allOfferings] = await Promise.all([
    prisma.enrollment.findMany({
      where: { tenantId, studentId, status: 'ENROLLED' },
      include: { courseOffering: { include: { course: true } } },
    }),
    prisma.grade.findMany({
      where: { tenantId, studentId },
      include: { courseOffering: { include: { course: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.courseOffering.findMany({
      where: { tenantId, status: 'ACTIVE' },
      include: { course: true, semester: true },
      take: 50,
    }),
  ])

  const cgpa = grades.length
    ? (grades.reduce((s, g) => s + (g.totalScore ?? 0), 0) / grades.length).toFixed(2)
    : 'N/A'

  const enrolledCourseIds = enrollments.map((e) => e.courseOffering.courseId)
  const availableOfferings = allOfferings.filter((o) => !enrolledCourseIds.includes(o.courseId))

  const context = `
Student academic context:
- Current CGPA/average: ${cgpa}
- Currently enrolled in: ${enrollments.map((e) => e.courseOffering.course.title).join(', ') || 'none'}
- Recent grades: ${grades.slice(0, 5).map((g) => `${g.courseOffering.course.title}: ${g.letterGrade ?? g.totalScore ?? 'N/A'}`).join(', ') || 'none'}
- Available courses to register: ${availableOfferings.map((o) => `${o.course.title} (${o.course.code}) - ${o.course.creditHours} credits`).join('; ') || 'none'}
`

  const advice = await generateText(
    `Based on this student's academic profile, provide personalized course recommendations and study advice. Be specific and actionable.\n\n${context}`,
    'You are an AI academic advisor for a school management system. Give clear, structured advice with bullet points. Focus on course selection, academic improvement, and study strategies.',
    800
  )

  return NextResponse.json({ advice, cgpa, enrolledCount: enrollments.length })
}
