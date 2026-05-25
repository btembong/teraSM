import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const studentId = session.user.id

  const semester = await (prisma as any).semester.findFirst({
    where: { tenantId, isCurrent: true },
    include: { academicYear: { select: { name: true } } },
  }) as any
  if (!semester) return NextResponse.json({ semester: null, courses: [], status: 'NO_SEMESTER' })

  const now = new Date()
  const regOpen   = !semester.registrationOpen  || now >= semester.registrationOpen
  const regClosed = semester.registrationClose && now > semester.registrationClose
  const addDropOpen = semester.addDropDeadline && now <= semester.addDropDeadline

  // Get all offerings for this semester
  const offerings = await prisma.courseOffering.findMany({
    where: { tenantId, semesterId: semester.id },
    include: {
      course: { include: { department: { select: { id: true, name: true, code: true, facultyId: true, faculty: { select: { id: true, name: true } } } } } },
      teacher: { select: { firstName: true, lastName: true } },
      _count: { select: { enrollments: { where: { status: 'ENROLLED' } } } },
    },
  })

  // Student's current enrollments this semester
  const myEnrollments = await prisma.enrollment.findMany({
    where: {
      tenantId, studentId,
      courseOffering: { semesterId: semester.id },
      status: { in: ['ENROLLED', 'WAITLISTED'] },
    },
    include: { courseOffering: { select: { schedule: true, courseId: true } } },
  })

  // Student's completed course IDs (for prerequisite check)
  const completedGrades = await prisma.grade.findMany({
    where: { tenantId, studentId, totalScore: { gte: 50 } },
    include: { courseOffering: { include: { course: { select: { code: true } } } } },
  })
  const completedCodes = new Set(completedGrades.map(g => g.courseOffering.course.code))

  // Fee clearance check
  const unpaidInvoices = await prisma.invoice.count({
    where: { tenantId, studentId, status: { notIn: ['PAID', 'CANCELLED'] } },
  })

  // Current enrolled credit hours
  const enrolledCredits = myEnrollments
    .filter(e => e.status === 'ENROLLED')
    .reduce((sum, e) => {
      const off = offerings.find(o => o.id === e.courseOfferingId)
      return sum + (off?.course.creditHours ?? 0)
    }, 0)

  const myScheduleSlots = myEnrollments
    .filter(e => e.status === 'ENROLLED')
    .flatMap(e => (e.courseOffering.schedule as any[] | null) ?? [])

  function hasClash(newSlots: any[]): boolean {
    for (const ns of newSlots) {
      for (const es of myScheduleSlots) {
        if (ns.day !== es.day) continue
        const nStart = ns.startTime, nEnd = ns.endTime
        const eStart = es.startTime, eEnd = es.endTime
        if (nStart < eEnd && nEnd > eStart) return true
      }
    }
    return false
  }

  // Waitlist positions for WAITLISTED enrollments
  const waitlistedEnrollments = myEnrollments.filter(e => e.status === 'WAITLISTED')
  const waitlistPositions: Record<string, number> = {}
  if (waitlistedEnrollments.length > 0) {
    await Promise.all(waitlistedEnrollments.map(async e => {
      const pos = await prisma.enrollment.count({
        where: { courseOfferingId: e.courseOfferingId, status: 'WAITLISTED', enrolledAt: { lte: e.enrolledAt } },
      })
      waitlistPositions[e.courseOfferingId] = pos
    }))
  }

  const myOfferingIds = new Set(myEnrollments.map(e => e.courseOfferingId))

  const courses = offerings.map(o => {
    const enrolled = o._count.enrollments
    const seats = o.maxStudents - enrolled
    const isFull = seats <= 0
    const alreadyEnrolled = myOfferingIds.has(o.id)
    const slots = (o.schedule as any[] | null) ?? []
    const clash = !alreadyEnrolled && hasClash(slots)
    const missingPrereqs = o.course.prerequisites.filter(p => !completedCodes.has(p))
    const wouldExceedLimit = enrolledCredits + o.course.creditHours > semester.maxCreditsPerStudent

    return {
      id: o.id,
      courseId: o.course.id,
      code: o.course.code,
      title: o.course.title,
      description: o.course.description,
      creditHours: o.course.creditHours,
      level: o.course.level,
      department: o.course.department.name,
      departmentId: o.course.department.id,
      faculty: (o.course.department as any).faculty?.name ?? null,
      facultyId: (o.course.department as any).faculty?.id ?? null,
      teacher: `${o.teacher.firstName} ${o.teacher.lastName}`,
      room: o.room,
      schedule: slots,
      enrolled,
      maxStudents: o.maxStudents,
      seats,
      isFull,
      alreadyEnrolled,
      clash,
      missingPrereqs,
      wouldExceedLimit,
      canRegister: !alreadyEnrolled && !clash && missingPrereqs.length === 0 && !wouldExceedLimit && regOpen && !regClosed,
      canWaitlist: !alreadyEnrolled && isFull && !clash && missingPrereqs.length === 0,
    }
  })

  return NextResponse.json({
    semester: {
      id: semester.id,
      name: semester.name,
      academicYear: semester.academicYear.name,
      registrationOpen: semester.registrationOpen,
      registrationClose: semester.registrationClose,
      addDropDeadline: semester.addDropDeadline,
      maxCreditsPerStudent: semester.maxCreditsPerStudent,
      // also include as top-level for convenience
    },
    courses,
    enrolledCredits,
    feeClearance: unpaidInvoices === 0,
    registrationStatus: regClosed ? 'CLOSED' : regOpen ? 'OPEN' : 'NOT_OPEN',
    addDropOpen: !!addDropOpen,
    myEnrollments: myEnrollments.map(e => ({
      id: e.id,
      offeringId: e.courseOfferingId,
      status: e.status,
      waitlistPosition: e.status === 'WAITLISTED' ? (waitlistPositions[e.courseOfferingId] ?? null) : null,
    })),
  })
}
