import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveSemester } from '@/lib/active-semester'
import { generateSemesterInvoice } from '@/lib/generate-invoice'

// POST /api/academics/enroll  — student enrolls in a course offering
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const tenantId = (session.user as any).tenantId

  const activeSemester = await getActiveSemester(tenantId)
  if (!activeSemester) return NextResponse.json({ error: 'No active semester' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const courseOfferingId: string | undefined = body.courseOfferingId

  if (!courseOfferingId) {
    return NextResponse.json({ error: 'courseOfferingId is required' }, { status: 400 })
  }

  // Verify offering belongs to tenant + active semester
  const offering = await prisma.courseOffering.findFirst({
    where: { id: courseOfferingId, tenantId, semesterId: activeSemester.id },
    include: { _count: { select: { enrollments: true } } },
  })
  if (!offering) return NextResponse.json({ error: 'Course offering not found' }, { status: 404 })

  // Already enrolled?
  const existing = await prisma.enrollment.findFirst({
    where: { tenantId, studentId: userId, courseOfferingId },
  })
  if (existing) {
    if (existing.status === 'DROPPED') {
      // Re-enroll → pending approval again
      const updated = await prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: 'PENDING', droppedAt: null },
      })
      return NextResponse.json(updated)
    }
    return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 409 })
  }

  // Capacity check — full → waitlist, otherwise → pending admin approval
  const isFull = offering.maxStudents > 0 && offering._count.enrollments >= offering.maxStudents
  const status = isFull ? 'WAITLISTED' : 'PENDING'

  const enrollment = await prisma.enrollment.create({
    data: {
      tenantId,
      studentId: userId,
      courseOfferingId,
      status,
    },
  })

  return NextResponse.json({ ...enrollment, waitlisted: isFull }, { status: 201 })
}

// DELETE /api/academics/enroll?courseOfferingId=xxx  — student drops a course
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const tenantId = (session.user as any).tenantId

  const courseOfferingId = req.nextUrl.searchParams.get('courseOfferingId')
  if (!courseOfferingId) return NextResponse.json({ error: 'courseOfferingId is required' }, { status: 400 })

  const enrollment = await prisma.enrollment.findFirst({
    where: { tenantId, studentId: userId, courseOfferingId, status: { in: ['ENROLLED', 'WAITLISTED'] } },
  })
  if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { status: 'DROPPED', droppedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
