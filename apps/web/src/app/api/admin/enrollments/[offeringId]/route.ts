import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSemesterInvoice } from '@/lib/generate-invoice'
import { getActiveSemester } from '@/lib/active-semester'
import { ensureCourseGroupChat } from '@/lib/ensure-course-chat'

const ADMIN_ROLES = ['TENANT_ADMIN', 'REGISTRAR']

export async function GET(_req: NextRequest, { params }: { params: Promise<{ offeringId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { offeringId } = await params
  const tenantId = session.user.tenantId

  const offering = await prisma.courseOffering.findFirst({
    where: { id: offeringId, tenantId },
    include: {
      course: { include: { department: { select: { name: true } } } },
      teacher: { select: { firstName: true, lastName: true } },
    },
  })
  if (!offering) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const enrollments = await prisma.enrollment.findMany({
    where: { tenantId, courseOfferingId: offeringId },
    orderBy: [{ status: 'asc' }, { enrolledAt: 'asc' }],
  })

  // Fetch student users separately (no relation on Enrollment model)
  const studentIds = enrollments.map(e => e.studentId)
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))

  // Waitlist positions
  const waitlistedRows = enrollments.filter(e => e.status === 'WAITLISTED')
  const waitlistPositions: Record<string, number> = {}
  waitlistedRows.forEach((e, idx) => { waitlistPositions[e.id] = idx + 1 })

  return NextResponse.json({
    offering: {
      id: offering.id,
      code: offering.course.code,
      title: offering.course.title,
      department: offering.course.department.name,
      teacher: `${(offering.teacher as any).firstName} ${(offering.teacher as any).lastName}`,
      maxStudents: offering.maxStudents,
      room: offering.room,
      schedule: offering.schedule,
    },
    enrollments: enrollments.map(e => {
      const s = studentMap[e.studentId]
      return {
        id: e.id,
        studentId: e.studentId,
        name: s ? `${s.firstName} ${s.lastName}` : e.studentId,
        email: s?.email ?? '',
        status: e.status,
        enrolledAt: e.enrolledAt,
        droppedAt: e.droppedAt,
        waitlistPosition: e.status === 'WAITLISTED' ? waitlistPositions[e.id] : null,
      }
    }),
  })
}

// PATCH — admin approves/rejects/changes enrollment status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ offeringId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { offeringId } = await params
  const tenantId = session.user.tenantId
  const { enrollmentId, status } = await req.json()

  if (!['PENDING', 'ENROLLED', 'WAITLISTED', 'DROPPED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, courseOfferingId: offeringId, tenantId },
  })
  if (!enrollment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status, ...(status === 'DROPPED' ? { droppedAt: new Date() } : {}) },
  })

  // When approving a pending enrollment
  if (status === 'ENROLLED' && enrollment.status === 'PENDING') {
    const semester = await getActiveSemester(tenantId)
    if (semester) {
      await generateSemesterInvoice({
        tenantId,
        studentId: enrollment.studentId,
        semesterId: semester.id,
      }).catch(() => {})
    }
    // Auto-create or join the course group chat (fire-and-forget)
    ensureCourseGroupChat(tenantId, offeringId, enrollment.studentId).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
