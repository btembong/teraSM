import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendThesisSubmittedEmail } from '@/lib/email'

// POST /api/student/thesis/[id]/submit — submit thesis for review
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id: studentId, tenantId } = session.user as any
  const { id } = await params

  const thesis = await prisma.thesis.findFirst({ where: { id, tenantId, studentId } })
  if (!thesis) return NextResponse.json({ message: 'Not found.' }, { status: 404 })

  if (!['DRAFT', 'REVISION_REQUESTED'].includes(thesis.status)) {
    return NextResponse.json({ message: 'Thesis cannot be submitted in its current state.' }, { status: 400 })
  }

  // Must have at least one version uploaded
  const versionCount = await prisma.thesisVersion.count({ where: { thesisId: id } })
  if (versionCount === 0) {
    return NextResponse.json({ message: 'Please upload your thesis document before submitting.' }, { status: 400 })
  }

  const now = new Date()
  const [updated, student, tenant] = await Promise.all([
    prisma.thesis.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: now },
      include: {
        supervisor: { select: { id: true, firstName: true, lastName: true } },
        versions: { orderBy: { version: 'desc' } },
        feedbacks: { where: { isPrivate: false }, include: { author: { select: { id: true, firstName: true, lastName: true } } } },
      },
    }),
    prisma.user.findUnique({ where: { id: studentId }, select: { firstName: true, email: true } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
  ])

  if (student && tenant) {
    sendThesisSubmittedEmail({
      to: student.email,
      firstName: student.firstName,
      schoolName: tenant.name,
      thesisTitle: updated.title,
      submittedAt: now,
    }).catch(err => console.error('[thesis-submitted-email]', err))
  }

  return NextResponse.json(updated)
}
