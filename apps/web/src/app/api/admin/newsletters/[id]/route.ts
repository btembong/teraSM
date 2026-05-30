import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendAnnouncementEmail } from '@/lib/email'

// PATCH /api/admin/newsletters/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = session.user.tenantId
  const { id } = await params

  const newsletter = await prisma.newsletter.findFirst({ where: { id, tenantId } })
  if (!newsletter) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (newsletter.status === 'SENT') return NextResponse.json({ error: 'Cannot edit a sent newsletter' }, { status: 409 })

  const body = await req.json()
  const { subject, previewText, htmlBody, audience, scheduledAt } = body

  const updated = await prisma.newsletter.update({
    where: { id },
    data: {
      ...(subject    !== undefined && { subject: subject.trim() }),
      ...(previewText !== undefined && { previewText: previewText?.trim() || null }),
      ...(htmlBody   !== undefined && { body: htmlBody.trim() }),
      ...(audience   !== undefined && { audience }),
      ...(scheduledAt !== undefined && {
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
      }),
    },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  })

  return NextResponse.json(updated)
}

// POST /api/admin/newsletters/[id] — send action via query param ?action=send
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = session.user.tenantId
  const { id } = await params

  const newsletter = await prisma.newsletter.findFirst({ where: { id, tenantId } })
  if (!newsletter) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (newsletter.status === 'SENT') return NextResponse.json({ error: 'Already sent' }, { status: 409 })

  // Resolve recipients based on audience
  const roleFilter: Record<string, string[]> = {
    STUDENTS: ['STUDENT'],
    TEACHERS: ['TEACHER'],
    PARENTS:  ['PARENT'],
    STAFF:    ['STAFF', 'HR_ADMIN', 'FINANCE_ADMIN', 'REGISTRAR', 'TENANT_ADMIN'],
  }
  const roles = roleFilter[newsletter.audience] ?? null

  const recipients = await prisma.user.findMany({
    where: { tenantId, ...(roles ? { role: { in: roles as any[] } } : {}) },
    select: { email: true, firstName: true },
  })

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } })
  const schoolName = tenant?.name ?? 'Your School'

  // Fan-out send (non-blocking)
  Promise.all(
    recipients.map(r =>
      sendAnnouncementEmail({
        to: r.email,
        firstName: r.firstName,
        schoolName,
        title: newsletter.subject,
        body: newsletter.body,
        authorName: schoolName,
      }).catch(err => console.error('[newsletter send]', err))
    )
  ).catch(err => console.error('[newsletter fan-out]', err))

  // Mark as sent
  const updated = await prisma.newsletter.update({
    where: { id },
    data: {
      status:         'SENT',
      sentAt:         new Date(),
      recipientCount: recipients.length,
    },
  })

  return NextResponse.json({ success: true, recipientCount: recipients.length, newsletter: updated })
}

// DELETE /api/admin/newsletters/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = session.user.tenantId
  const { id } = await params

  const newsletter = await prisma.newsletter.findFirst({ where: { id, tenantId } })
  if (!newsletter) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.newsletter.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
