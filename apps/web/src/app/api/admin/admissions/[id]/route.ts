import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import {
  sendAdmissionUnderReviewEmail,
  sendAdmissionOfferedEmail,
  sendAdmissionWaitlistedEmail,
  sendAdmissionRejectedEmail,
} from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string
  const { id } = await params

  const app = await (prisma as any).admissionApplication.findFirst({ where: { id, tenantId } })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(app)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string
  const reviewerId = (session.user as any).id as string
  const { id } = await params

  const existing = await (prisma as any).admissionApplication.findFirst({ where: { id, tenantId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const data: any = {}
  if (body.status !== undefined) {
    data.status      = body.status
    data.reviewedBy  = reviewerId
    data.reviewedAt  = new Date()
    if (body.status === 'WAITLISTED' && body.waitlistPosition !== undefined) {
      data.waitlistPosition = body.waitlistPosition
    }
    if (body.status === 'OFFERED') {
      data.offerExpiry = body.offerExpiry
        ? new Date(body.offerExpiry)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
    if (body.status === 'REJECTED' && body.rejectionReason) {
      data.rejectionReason = body.rejectionReason
    }
  }
  if (body.adminNote !== undefined) data.adminNote = body.adminNote

  const updated = await (prisma as any).admissionApplication.update({
    where: { id },
    data,
    include: { admissionDocuments: true },
  })

  // Send email notification when status changes to a notable state
  if (body.status !== undefined && body.status !== existing.status) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, slug: true },
    })
    const schoolName  = tenant?.name ?? 'the school'
    const trackingUrl = tenant?.slug
      ? `${APP_URL}/apply/${tenant.slug}/track/${existing.trackingToken}`
      : APP_URL

    const emailBase = {
      to:              existing.email,
      firstName:       existing.firstName,
      schoolName,
      referenceNumber: existing.referenceNumber ?? existing.id,
      trackingUrl,
    }

    const newStatus = body.status
    if (newStatus === 'DOCS_REVIEW' || newStatus === 'REVIEWING' || newStatus === 'INTERVIEW' || newStatus === 'DOCS_VERIFIED') {
      sendAdmissionUnderReviewEmail(emailBase).catch(err => console.error('[email] under review:', err))
    } else if (newStatus === 'OFFERED') {
      sendAdmissionOfferedEmail({
        ...emailBase,
        programOfInterest: existing.programOfInterest,
        offerExpiry:       updated.offerExpiry,
        offerLetterUrl:    existing.offerLetterUrl,
      }).catch(err => console.error('[email] offered:', err))
    } else if (newStatus === 'WAITLISTED') {
      sendAdmissionWaitlistedEmail({
        ...emailBase,
        waitlistPosition: updated.waitlistPosition,
      }).catch(err => console.error('[email] waitlisted:', err))
    } else if (newStatus === 'REJECTED') {
      sendAdmissionRejectedEmail({
        ...emailBase,
        rejectionReason: updated.rejectionReason,
      }).catch(err => console.error('[email] rejected:', err))
    }
  }

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string
  const { id } = await params

  const existing = await (prisma as any).admissionApplication.findFirst({ where: { id, tenantId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await (prisma as any).admissionApplication.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
