import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST — enroll in a course (or waitlist if full)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const studentId = session.user.id
  const { offeringId } = await req.json()
  if (!offeringId) return NextResponse.json({ error: 'offeringId required' }, { status: 400 })

  const semester = await (prisma as any).semester.findFirst({ where: { tenantId, isCurrent: true } }) as any
  if (!semester) return NextResponse.json({ error: 'No active semester' }, { status: 400 })

  // Registration window check (admin can leave null = always open)
  const now = new Date()
  if (semester.registrationOpen && now < semester.registrationOpen) {
    return NextResponse.json({ error: 'Registration has not opened yet' }, { status: 400 })
  }
  if (semester.registrationClose && now > semester.registrationClose) {
    return NextResponse.json({ error: 'Registration is closed' }, { status: 400 })
  }

  // Fee clearance
  const unpaid = await prisma.invoice.count({
    where: { tenantId, studentId, status: { notIn: ['PAID', 'CANCELLED'] } },
  })
  if (unpaid > 0) {
    return NextResponse.json({ error: 'Outstanding fees must be cleared before registering' }, { status: 400 })
  }

  // Get the offering
  const offering = await prisma.courseOffering.findFirst({
    where: { id: offeringId, tenantId, semesterId: semester.id },
    include: {
      course: true,
      _count: { select: { enrollments: { where: { status: 'ENROLLED' } } } },
    },
  })
  if (!offering) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // Already enrolled?
  const existing = await prisma.enrollment.findFirst({
    where: { tenantId, studentId, courseOfferingId: offeringId, status: { in: ['ENROLLED', 'WAITLISTED'] } },
  })
  if (existing) return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 409 })

  // Prerequisite check
  const completedGrades = await prisma.grade.findMany({
    where: { tenantId, studentId, totalScore: { gte: 50 } },
    include: { courseOffering: { include: { course: { select: { code: true } } } } },
  })
  const completedCodes = new Set(completedGrades.map(g => g.courseOffering.course.code))
  const missing = offering.course.prerequisites.filter(p => !completedCodes.has(p))
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing prerequisites: ${missing.join(', ')}` }, { status: 400 })
  }

  // Credit limit check
  const myEnrollments = await prisma.enrollment.findMany({
    where: { tenantId, studentId, courseOffering: { semesterId: semester.id }, status: 'ENROLLED' },
    include: { courseOffering: { include: { course: { select: { creditHours: true } } } } },
  })
  const totalCredits = myEnrollments.reduce((s, e) => s + e.courseOffering.course.creditHours, 0)
  if (totalCredits + offering.course.creditHours > semester.maxCreditsPerStudent) {
    return NextResponse.json({
      error: `Enrolling would exceed the ${semester.maxCreditsPerStudent}-credit limit for this semester`,
    }, { status: 400 })
  }

  // Clash detection
  const mySlots = myEnrollments.flatMap(e => (e.courseOffering.schedule as any[] | null) ?? [])
  const newSlots = (offering.schedule as any[] | null) ?? []
  for (const ns of newSlots) {
    for (const es of mySlots) {
      if (ns.day !== es.day) continue
      if (ns.startTime < es.endTime && ns.endTime > es.startTime) {
        return NextResponse.json({ error: 'Schedule clash detected with an existing course' }, { status: 400 })
      }
    }
  }

  const isFull = offering._count.enrollments >= offering.maxStudents
  const status = isFull ? 'WAITLISTED' : 'ENROLLED'

  const enrollment = await prisma.enrollment.create({
    data: { tenantId, studentId, courseOfferingId: offeringId, status },
  })

  return NextResponse.json({ enrollment, status }, { status: 201 })
}

// DELETE — drop a course
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const studentId = session.user.id
  const { offeringId } = await req.json()

  const semester = await (prisma as any).semester.findFirst({ where: { tenantId, isCurrent: true } }) as any
  if (!semester) return NextResponse.json({ error: 'No active semester' }, { status: 400 })

  // Add/drop deadline check
  if (semester.addDropDeadline && new Date() > semester.addDropDeadline) {
    return NextResponse.json({ error: 'The add/drop deadline has passed' }, { status: 400 })
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { tenantId, studentId, courseOfferingId: offeringId, status: { in: ['ENROLLED', 'WAITLISTED'] } },
  })
  if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { status: 'DROPPED', droppedAt: new Date() },
  })

  // Promote first waitlisted student if there is one
  const nextWaitlisted = await prisma.enrollment.findFirst({
    where: { tenantId, courseOfferingId: offeringId, status: 'WAITLISTED' },
    orderBy: { enrolledAt: 'asc' },
  })
  if (nextWaitlisted) {
    await prisma.enrollment.update({
      where: { id: nextWaitlisted.id },
      data: { status: 'ENROLLED' },
    })
    // Get course name for notification
    const offering = await prisma.courseOffering.findUnique({
      where: { id: offeringId },
      include: { course: { select: { code: true, title: true } } },
    })
    if (offering) {
      await prisma.notification.create({
        data: {
          tenantId,
          userId: nextWaitlisted.studentId,
          title: 'You\'ve been enrolled!',
          body: `A seat opened up and you are now enrolled in ${offering.course.code} — ${offering.course.title}.`,
          link: '/student/registration/my-courses',
          type: 'GENERAL',
        },
      })
    }
  }

  return NextResponse.json({ success: true })
}
