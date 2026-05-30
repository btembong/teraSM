import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendThesisOutcomeEmail } from '@/lib/email'

// PATCH /api/admin/thesis/[id]/status — admin override status (publish, etc.)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { tenantId, role } = session.user as any
  if (!['TENANT_ADMIN', 'REGISTRAR'].includes(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params

  const thesis = await (prisma as any).thesis.findFirst({
    where: { id, tenantId },
    include: { student: { select: { firstName: true, email: true } } },
  })
  if (!thesis) return NextResponse.json({ message: 'Not found.' }, { status: 404 })

  const body = await req.json()
  const { status, note } = body
  const VALID = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED', 'PUBLISHED']
  if (!VALID.includes(status)) return NextResponse.json({ message: 'Invalid status.' }, { status: 400 })

  const data: Record<string, unknown> = { status }
  if (status === 'APPROVED' && !thesis.approvedAt) data.approvedAt = new Date()
  if (status === 'PUBLISHED' && !thesis.publishedAt) data.publishedAt = new Date()

  const [updated, tenant] = await Promise.all([
    (prisma as any).thesis.update({
      where: { id },
      data,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        supervisor: { select: { id: true, firstName: true, lastName: true } },
        versions: { orderBy: { version: 'desc' }, take: 1 },
      },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
  ])

  const student = thesis.student
  if (['APPROVED', 'REJECTED', 'PUBLISHED'].includes(status) && student && tenant) {
    sendThesisOutcomeEmail({
      to: student.email,
      firstName: student.firstName,
      schoolName: tenant.name,
      thesisTitle: thesis.title,
      status: status as 'APPROVED' | 'REJECTED' | 'PUBLISHED',
      note: note ?? null,
    }).catch(err => console.error('[thesis-outcome-email]', err))
  }

  return NextResponse.json(updated)
}
