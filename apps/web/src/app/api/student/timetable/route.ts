import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveSemester } from '@/lib/active-semester'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const tenantId = (session.user as any).tenantId

  const activeSemester = await getActiveSemester(tenantId)
  if (!activeSemester) return NextResponse.json({ semester: null, slots: [] })

  const enrollments = await prisma.enrollment.findMany({
    where: {
      tenantId,
      studentId: userId,
      status: 'ENROLLED',
      courseOffering: { semesterId: activeSemester.id },
    },
    include: {
      courseOffering: {
        include: {
          course: { select: { code: true, title: true } },
          teacher: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })

  const slots = enrollments.flatMap((e) => {
    const o = e.courseOffering
    const schedule: { day: string; startTime: string; endTime: string }[] =
      Array.isArray(o.schedule) ? (o.schedule as any[]) : []
    return schedule.map((s) => ({
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      courseCode: o.course.code,
      courseTitle: o.course.title,
      teacher: o.teacher
        ? `${o.teacher.firstName} ${o.teacher.lastName}`.trim()
        : '—',
      room: o.room,
      offeringId: o.id,
    }))
  })

  return NextResponse.json({
    semester: {
      id: activeSemester.id,
      name: activeSemester.name,
      academicYear: activeSemester.academicYear.name,
    },
    slots,
  })
}
