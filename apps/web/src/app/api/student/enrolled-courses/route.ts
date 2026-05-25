import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const studentId = (session.user as any).id

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, status: 'ENROLLED' },
    include: { courseOffering: { include: { course: true } } },
    orderBy: { enrolledAt: 'desc' },
  })

  return NextResponse.json(
    enrollments.map(e => ({
      id: e.courseOfferingId,
      course: { title: e.courseOffering.course.title, code: e.courseOffering.course.code },
    }))
  )
}
