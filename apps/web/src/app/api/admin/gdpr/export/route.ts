import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/gdpr/export?studentId=xxx
// Returns a JSON export of all data for a student (GDPR data portability)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId  = (session.user as any).tenantId as string
  const studentId = req.nextUrl.searchParams.get('studentId')

  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

  const student = await prisma.user.findFirst({
    where: { id: studentId, tenantId, role: 'STUDENT' },
    select: {
      id: true, firstName: true, lastName: true, email: true,
      role: true, status: true, createdAt: true, lastLoginAt: true,
      academicStanding: true, standingNote: true, onboardingComplete: true,
    },
  })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const db = prisma as any

  const [
    enrollments, grades, attendance,
    invoices, payments, submissions,
    notifications, messages,
    documents, standingLogs,
  ] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId, tenantId },
      include: { courseOffering: { include: { course: true } } },
    }),
    prisma.grade.findMany({
      where: { studentId, courseOffering: { tenantId } },
      include: { courseOffering: { include: { course: true } } },
    }),
    prisma.attendance.findMany({
      where: { studentId, courseOffering: { tenantId } },
      select: { status: true, date: true, courseOffering: { select: { course: { select: { code: true } } } } },
    }),
    prisma.invoice.findMany({
      where: { studentId, tenantId },
      include: { items: true },
    }),
    prisma.payment.findMany({ where: { studentId, tenantId } }),
    prisma.submission.findMany({
      where: { studentId, assignment: { courseOffering: { tenantId } } },
      include: { assignment: { select: { title: true } } },
    }),
    prisma.notification.findMany({
      where: { userId: studentId, tenantId },
      select: { title: true, body: true, type: true, isRead: true, createdAt: true },
      take: 200,
    }),
    prisma.message.findMany({
      where: { senderId: studentId },
      select: { content: true, createdAt: true },
      take: 500,
    }),
    db.studentDocument.findMany({ where: { studentId, tenantId } }).catch(() => []),
    db.academicStandingLog.findMany({ where: { studentId, tenantId }, orderBy: { createdAt: 'desc' } }).catch(() => []),
  ])

  const exportData = {
    exportedAt: new Date().toISOString(),
    exportedBy: (session.user as any).email,
    student,
    enrollments,
    grades,
    attendance,
    invoices,
    payments,
    submissions,
    notifications,
    messages,
    documents,
    standingLogs,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="student-data-${student.email}-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
