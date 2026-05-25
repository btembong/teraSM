import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const db = prisma as any
  const exams = await db.examSchedule.findMany({
    where: { courseOffering: { tenantId } },
    include: {
      courseOffering: { include: { course: true } },
      invigilations: {
        include: { teacher: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
    orderBy: { examDate: 'asc' },
  }).catch(() => [])

  return NextResponse.json(exams)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  const db = prisma as any
  const exam = await db.examSchedule.create({
    data: {
      courseOfferingId: body.courseOfferingId,
      title: body.title,
      examDate: new Date(body.examDate),
      startTime: body.startTime,
      endTime: body.endTime,
      venue: body.venue || null,
      totalMarks: Number(body.totalMarks),
      notes: body.notes || null,
    },
    include: {
      courseOffering: { include: { course: true } },
    },
  })
  return NextResponse.json(exam, { status: 201 })
}
