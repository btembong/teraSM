import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id } = await params

  const offering = await prisma.courseOffering.findFirst({ where: { id, tenantId } })
  if (!offering) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.courseOffering.update({
    where: { id },
    data: {
      ...(body.teacherId   !== undefined ? { teacherId: body.teacherId }     : {}),
      ...(body.maxStudents !== undefined ? { maxStudents: body.maxStudents } : {}),
      ...(body.room        !== undefined ? { room: body.room }               : {}),
      ...(body.schedule    !== undefined ? { schedule: body.schedule }       : {}),
    },
    include: {
      course:  { include: { department: true } },
      teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count:  { select: { enrollments: true } },
    },
  })

  return NextResponse.json({
    id: updated.id,
    courseId: updated.courseId,
    courseCode: updated.course.code,
    courseTitle: updated.course.title,
    creditHours: updated.course.creditHours,
    department: updated.course.department.name,
    departmentCode: updated.course.department.code,
    teacherId: updated.teacherId,
    teacherName: updated.teacher
      ? `${updated.teacher.firstName} ${updated.teacher.lastName}`.trim() || updated.teacher.email
      : '—',
    maxStudents: updated.maxStudents,
    room: updated.room,
    schedule: updated.schedule,
    enrolled: updated._count.enrollments,
  })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const { id } = await params

  const offering = await prisma.courseOffering.findFirst({ where: { id, tenantId } })
  if (!offering) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Drop all enrollments first
  await prisma.enrollment.updateMany({
    where: { courseOfferingId: id, status: { in: ['ENROLLED', 'WAITLISTED'] } },
    data: { status: 'DROPPED', droppedAt: new Date() },
  })

  await prisma.courseOffering.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
