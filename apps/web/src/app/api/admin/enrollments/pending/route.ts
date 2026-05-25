/**
 * GET  /api/admin/enrollments/pending
 *   Returns all PENDING enrollment requests across all offerings for the active semester.
 *
 * PATCH /api/admin/enrollments/pending
 *   body: { enrollmentId, action: 'approve' | 'reject' }
 *   Approves (→ ENROLLED, fires invoice) or rejects (→ DROPPED) a pending enrollment.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveSemester } from '@/lib/active-semester'
import { generateSemesterInvoice } from '@/lib/generate-invoice'

const ADMIN_ROLES = ['TENANT_ADMIN', 'REGISTRAR']

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tenantId = session.user.tenantId
  const semester = await getActiveSemester(tenantId)
  if (!semester) return NextResponse.json({ semester: null, pending: [] })

  const enrollments = await prisma.enrollment.findMany({
    where: {
      tenantId,
      status: 'PENDING',
      courseOffering: { semesterId: semester.id },
    },
    include: {
      courseOffering: {
        include: {
          course: { select: { code: true, title: true } },
        },
      },
    },
    orderBy: { enrolledAt: 'asc' },
  })

  const studentIds = enrollments.map(e => e.studentId)
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))

  const pending = enrollments.map(e => {
    const s = studentMap[e.studentId]
    return {
      id: e.id,
      enrolledAt: e.enrolledAt,
      student: {
        id: e.studentId,
        name: s ? `${s.firstName} ${s.lastName}` : e.studentId,
        email: s?.email ?? '',
      },
      course: {
        offeringId: e.courseOfferingId,
        code: e.courseOffering.course.code,
        title: e.courseOffering.course.title,
      },
    }
  })

  return NextResponse.json({
    semester: { id: semester.id, name: (semester as any).name },
    pending,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tenantId = session.user.tenantId
  const { enrollmentId, action } = await req.json()

  if (!enrollmentId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'enrollmentId and action (approve|reject) required' }, { status: 400 })
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, tenantId, status: 'PENDING' },
  })
  if (!enrollment) return NextResponse.json({ error: 'Pending enrollment not found' }, { status: 404 })

  if (action === 'approve') {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'ENROLLED' },
    })
    // Generate fee invoice on approval
    const semester = await getActiveSemester(tenantId)
    if (semester) {
      await generateSemesterInvoice({
        tenantId,
        studentId: enrollment.studentId,
        semesterId: semester.id,
      }).catch(() => {})
    }
  } else {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'DROPPED', droppedAt: new Date() },
    })
  }

  return NextResponse.json({ ok: true, action })
}
