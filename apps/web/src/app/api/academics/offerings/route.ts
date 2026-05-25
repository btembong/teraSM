import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveSemester } from '@/lib/active-semester'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  // Allow explicit semesterId override; fall back to active semester
  const semesterId = req.nextUrl.searchParams.get('semesterId')
  let activeSemester: any = null

  if (semesterId) {
    activeSemester = await prisma.semester.findFirst({
      where: { id: semesterId, tenantId },
      include: { academicYear: { select: { name: true } } },
    })
  } else {
    activeSemester = await getActiveSemester(tenantId)
  }

  if (!activeSemester) return NextResponse.json({ semester: null, offerings: [] })

  const offerings = await prisma.courseOffering.findMany({
    where: { tenantId, semesterId: activeSemester.id },
    include: {
      course: { include: { department: true } },
      teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { course: { code: 'asc' } },
  })

  return NextResponse.json({
    semester: {
      id: activeSemester.id,
      name: activeSemester.name,
      academicYear: activeSemester.academicYear.name,
    },
    offerings: offerings.map((o) => ({
      id: o.id,
      courseId: o.courseId,
      courseCode: o.course.code,
      courseTitle: o.course.title,
      creditHours: o.course.creditHours,
      department: o.course.department.name,
      departmentCode: o.course.department.code,
      teacherId: o.teacherId,
      teacherName: o.teacher ? `${o.teacher.firstName} ${o.teacher.lastName}`.trim() || o.teacher.email : '—',
      maxStudents: o.maxStudents,
      room: o.room,
      schedule: o.schedule,
      enrolled: o._count.enrollments,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const activeSemester = await getActiveSemester(tenantId)
  if (!activeSemester) return NextResponse.json({ error: 'No active semester' }, { status: 400 })

  const body = await req.json()
  const { courseId, teacherId, maxStudents, room, schedule } = body

  if (!courseId || !teacherId) {
    return NextResponse.json({ error: 'courseId and teacherId are required' }, { status: 400 })
  }

  // Check course belongs to tenant
  const course = await prisma.course.findFirst({ where: { id: courseId, tenantId } })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // Prevent duplicate offering for same course in same semester
  const existing = await prisma.courseOffering.findFirst({
    where: { tenantId, courseId, semesterId: activeSemester.id },
  })
  if (existing) return NextResponse.json({ error: 'This course is already scheduled for the active semester' }, { status: 409 })

  const offering = await prisma.courseOffering.create({
    data: {
      tenantId,
      courseId,
      semesterId: activeSemester.id,
      teacherId,
      maxStudents: maxStudents ?? 50,
      room: room ?? null,
      schedule: schedule ?? null,
    },
    include: {
      course: { include: { department: true } },
      teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  })

  return NextResponse.json(offering, { status: 201 })
}
