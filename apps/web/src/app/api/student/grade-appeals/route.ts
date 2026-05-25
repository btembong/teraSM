import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — list student's own appeals
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appeals = await (prisma as any).gradeAppeal.findMany({
    where: { tenantId: session.user.tenantId, studentId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      grade: {
        include: { courseOffering: { include: { course: { select: { code: true, title: true } } } } },
      },
    },
  })

  return NextResponse.json(appeals.map((a: any) => ({
    id: a.id,
    courseCode: a.grade.courseOffering.course.code,
    courseTitle: a.grade.courseOffering.course.title,
    totalScore: a.grade.totalScore,
    letterGrade: a.grade.letterGrade,
    reason: a.reason,
    status: a.status,
    adminResponse: a.adminResponse,
    createdAt: a.createdAt,
  })))
}

// POST — submit a new appeal
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { gradeId, reason, supportingInfo } = await req.json()
  if (!gradeId || !reason?.trim()) {
    return NextResponse.json({ error: 'gradeId and reason are required' }, { status: 400 })
  }

  // Verify grade belongs to this student
  const grade = await prisma.grade.findFirst({
    where: { id: gradeId, tenantId: session.user.tenantId, studentId: session.user.id },
  })
  if (!grade) return NextResponse.json({ error: 'Grade not found' }, { status: 404 })

  // Check no existing open appeal
  const existing = await (prisma as any).gradeAppeal.findFirst({
    where: { gradeId, studentId: session.user.id, status: { notIn: ['RESOLVED', 'REJECTED'] } },
  })
  if (existing) return NextResponse.json({ error: 'You already have an open appeal for this grade.' }, { status: 409 })

  const appeal = await (prisma as any).gradeAppeal.create({
    data: {
      tenantId: session.user.tenantId,
      studentId: session.user.id,
      gradeId,
      reason: reason.trim(),
      supportingInfo: supportingInfo?.trim() || null,
    },
  })

  return NextResponse.json(appeal, { status: 201 })
}
