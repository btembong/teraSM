import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_ROLES = ['TENANT_ADMIN', 'REGISTRAR']

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tenantId = session.user.tenantId

  const semester = await (prisma as any).semester.findFirst({
    where: { tenantId, isCurrent: true },
    include: { academicYear: { select: { name: true } } },
  }) as any

  if (!semester) return NextResponse.json({ semester: null, offerings: [] })

  const offerings = await prisma.courseOffering.findMany({
    where: { tenantId, semesterId: semester.id },
    include: {
      course: { include: { department: { select: { name: true, code: true } } } },
      teacher: { select: { firstName: true, lastName: true } },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: [{ course: { department: { name: 'asc' } } }, { course: { code: 'asc' } }],
  })

  // _count with aliases isn't supported — compute manually
  const enrollmentCounts = await prisma.enrollment.groupBy({
    by: ['courseOfferingId', 'status'],
    where: { tenantId, courseOffering: { semesterId: semester.id } },
    _count: { id: true },
  })

  const countMap: Record<string, { pending: number; enrolled: number; waitlisted: number; dropped: number }> = {}
  for (const row of enrollmentCounts) {
    if (!countMap[row.courseOfferingId]) countMap[row.courseOfferingId] = { pending: 0, enrolled: 0, waitlisted: 0, dropped: 0 }
    if (row.status === 'PENDING')    countMap[row.courseOfferingId].pending    = row._count.id
    if (row.status === 'ENROLLED')   countMap[row.courseOfferingId].enrolled   = row._count.id
    if (row.status === 'WAITLISTED') countMap[row.courseOfferingId].waitlisted = row._count.id
    if (row.status === 'DROPPED')    countMap[row.courseOfferingId].dropped    = row._count.id
  }

  return NextResponse.json({
    semester: { id: semester.id, name: semester.name, academicYear: semester.academicYear.name },
    offerings: offerings.map(o => ({
      id: o.id,
      code: o.course.code,
      title: o.course.title,
      department: o.course.department.name,
      departmentCode: o.course.department.code,
      teacher: `${(o.teacher as any).firstName} ${(o.teacher as any).lastName}`,
      creditHours: o.course.creditHours,
      maxStudents: o.maxStudents,
      room: o.room,
      pending:   countMap[o.id]?.pending   ?? 0,
      enrolled:  countMap[o.id]?.enrolled  ?? 0,
      waitlisted: countMap[o.id]?.waitlisted ?? 0,
      dropped:   countMap[o.id]?.dropped   ?? 0,
    })),
  })
}
