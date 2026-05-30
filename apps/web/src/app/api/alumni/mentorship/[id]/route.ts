import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMentorshipDecisionEmail } from '@/lib/email'

// PATCH /api/alumni/mentorship/[id] — mentor accepts/declines; either side completes
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id: userId, tenantId } = session.user as any
  const { id } = await params

  const mentorship = await prisma.alumniMentorship.findFirst({
    where: { id, tenantId, OR: [{ mentorId: userId }, { studentId: userId }] },
  })
  if (!mentorship) return NextResponse.json({ message: 'Not found.' }, { status: 404 })

  const body = await req.json()
  const { status } = body
  const VALID = ['ACTIVE', 'DECLINED', 'COMPLETED']
  if (!VALID.includes(status)) return NextResponse.json({ message: 'Invalid status.' }, { status: 400 })

  // Only mentor can accept (ACTIVE) or decline (DECLINED)
  if (['ACTIVE', 'DECLINED'].includes(status) && mentorship.mentorId !== userId) {
    return NextResponse.json({ message: 'Only the mentor can accept or decline requests.' }, { status: 403 })
  }

  const data: Record<string, unknown> = { status }
  if (status === 'ACTIVE') data.startedAt = new Date()
  if (status === 'COMPLETED') data.endedAt = new Date()

  const [updated, tenant] = await Promise.all([
    (prisma as any).alumniMentorship.update({
      where: { id },
      data,
      include: {
        mentor:  { select: { id: true, firstName: true, lastName: true, email: true, profilePicUrl: true } },
        student: { select: { id: true, firstName: true, lastName: true, email: true, profilePicUrl: true } },
      },
    }),
    prisma.tenant.findFirst({ where: { id: mentorship.tenantId } }),
  ])

  // Notify student of accept/decline (non-blocking)
  if (['ACTIVE', 'DECLINED'].includes(status) && tenant) {
    sendMentorshipDecisionEmail({
      to: updated.student.email,
      studentFirstName: updated.student.firstName,
      mentorName: `${updated.mentor.firstName} ${updated.mentor.lastName}`,
      schoolName: tenant.name,
      status: status as 'ACTIVE' | 'DECLINED',
      message: body.message ?? null,
    }).catch(err => console.error('[mentorship-decision-email]', err))
  }

  return NextResponse.json(updated)
}
