import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendThesisRevisionRequestedEmail, sendThesisOutcomeEmail } from '@/lib/email'

const ALLOWED_STATUSES = ['UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED']

// PATCH /api/staff/thesis/[id]/status — update thesis status (supervisor)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id: supervisorId, tenantId } = session.user as any
  const { id: thesisId } = await params

  const thesis = await (prisma as any).thesis.findFirst({
    where: { id: thesisId, tenantId, supervisorId },
    include: { student: { select: { firstName: true, email: true } } },
  })
  if (!thesis) return NextResponse.json({ message: 'Not found or not your thesis.' }, { status: 404 })

  const body = await req.json()
  const { status, note } = body

  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ message: 'Invalid status value.' }, { status: 400 })
  }

  const data: Record<string, unknown> = { status }
  if (status === 'APPROVED') data.approvedAt = new Date()

  const [updated, supervisor, tenant] = await Promise.all([
    (prisma as any).thesis.update({
      where: { id: thesisId },
      data,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        versions: { orderBy: { version: 'desc' }, take: 1 },
        feedbacks: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    }),
    prisma.user.findUnique({ where: { id: supervisorId }, select: { firstName: true, lastName: true } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
  ])

  const student = thesis.student
  if (student && tenant) {
    if (status === 'REVISION_REQUESTED') {
      sendThesisRevisionRequestedEmail({
        to: student.email,
        firstName: student.firstName,
        schoolName: tenant.name,
        thesisTitle: thesis.title,
        supervisorName: supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : 'Your Supervisor',
        feedback: note ?? body.feedback ?? 'Please review and revise your submission.',
      }).catch(err => console.error('[thesis-revision-email]', err))
    } else if (['APPROVED', 'REJECTED'].includes(status)) {
      sendThesisOutcomeEmail({
        to: student.email,
        firstName: student.firstName,
        schoolName: tenant.name,
        thesisTitle: thesis.title,
        status: status as 'APPROVED' | 'REJECTED',
        note: note ?? null,
      }).catch(err => console.error('[thesis-outcome-email]', err))
    }
  }

  return NextResponse.json(updated)
}
