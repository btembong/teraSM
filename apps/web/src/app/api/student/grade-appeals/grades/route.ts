import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — list grades eligible for appeal (published, with or without existing appeals)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const grades = await prisma.grade.findMany({
    where: {
      tenantId: session.user.tenantId,
      studentId: session.user.id,
      publishedAt: { not: null },
    },
    include: {
      courseOffering: { include: { course: { select: { code: true, title: true } } } },
      appeals: { where: { status: { notIn: ['RESOLVED', 'REJECTED'] } }, select: { id: true } },
    },
  })

  return NextResponse.json(grades.map(g => ({
    gradeId: g.id,
    courseCode: g.courseOffering.course.code,
    courseTitle: g.courseOffering.course.title,
    totalScore: g.totalScore,
    letterGrade: g.letterGrade,
    hasAppeal: g.appeals.length > 0,
  })))
}
