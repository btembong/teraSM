import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMentorshipRequestEmail } from '@/lib/email'

// GET /api/alumni/mentorship — student: list own requests; alumni: list received requests
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id: userId, tenantId, role } = session.user as any

  const isAlumni = role === 'STUDENT' && await prisma.alumniProfile.findUnique({ where: { userId } })

  const mentorships = await prisma.alumniMentorship.findMany({
    where: {
      tenantId,
      ...(isAlumni ? { mentorId: userId } : { studentId: userId }),
    },
    include: {
      mentor:  { select: { id: true, firstName: true, lastName: true, profilePicUrl: true } },
      student: { select: { id: true, firstName: true, lastName: true, profilePicUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(mentorships)
}

// POST /api/alumni/mentorship — student requests a mentor
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id: studentId, tenantId } = session.user as any

  const body = await req.json()
  const { mentorId, message, goals } = body

  if (!mentorId) return NextResponse.json({ message: 'mentorId is required.' }, { status: 400 })

  // Verify mentor has public alumni profile in this tenant
  const mentorProfile = await prisma.alumniProfile.findFirst({
    where: { userId: mentorId, tenantId, isPublic: true },
  })
  if (!mentorProfile) return NextResponse.json({ message: 'Mentor not found.' }, { status: 404 })

  // Prevent duplicate active requests
  const existing = await prisma.alumniMentorship.findFirst({
    where: { tenantId, studentId, mentorId, status: { in: ['PENDING', 'ACTIVE'] } },
  })
  if (existing) return NextResponse.json({ message: 'You already have an active request with this mentor.' }, { status: 409 })

  const [mentorship, student, tenant] = await Promise.all([
    (prisma as any).alumniMentorship.create({
      data: {
        tenantId,
        mentorId,
        studentId,
        status: 'PENDING',
        message: message?.trim() || null,
        goals:   goals?.trim()   || null,
      },
      include: {
        mentor:  { select: { id: true, firstName: true, lastName: true, profilePicUrl: true } },
        student: { select: { id: true, firstName: true, lastName: true, profilePicUrl: true } },
      },
    }),
    prisma.user.findUnique({ where: { id: studentId }, select: { firstName: true, lastName: true } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
  ])

  // Notify mentor (non-blocking)
  const mentorUser = await prisma.user.findUnique({ where: { id: mentorId }, select: { firstName: true, email: true } })
  if (mentorUser && student && tenant) {
    sendMentorshipRequestEmail({
      to: mentorUser.email,
      mentorFirstName: mentorUser.firstName,
      studentName: `${student.firstName} ${student.lastName}`,
      schoolName: tenant.name,
      message: message?.trim() || null,
    }).catch(err => console.error('[mentorship-request-email]', err))
  }

  return NextResponse.json(mentorship, { status: 201 })
}
