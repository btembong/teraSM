/**
 * POST /api/super-admin/billing/[invoiceId]/generate-code
 * Generates an activation code for a manual bank-transfer invoice and emails it to the tenant.
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { buildActivationCode } from '@/lib/pricing'
import { sendActivationCodeEmail } from '@/lib/email'

type Params = { params: Promise<{ invoiceId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id
  if (!session?.user || role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { invoiceId } = await params

  const invoice = await (prisma as any).saasInvoice.findUnique({
    where: { id: invoiceId },
    include: { activationCode: true },
  })

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  if (invoice.status === 'PAID') return NextResponse.json({ error: 'Invoice already paid' }, { status: 409 })

  // If a code was already generated for this invoice, return it (idempotent)
  if (invoice.activationCode) {
    return NextResponse.json({ code: invoice.activationCode.code, alreadyExisted: true })
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: invoice.tenantId },
    select: { name: true, email: true },
  })
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  // Generate unique code
  let code = buildActivationCode(invoice.plan, invoice.billingCycle)
  let attempts = 0
  while (attempts < 5) {
    const exists = await (prisma as any).activationCode.findUnique({ where: { code } })
    if (!exists) break
    code = buildActivationCode(invoice.plan, invoice.billingCycle)
    attempts++
  }

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 72)

  await (prisma as any).activationCode.create({
    data: {
      code,
      tenantId:      invoice.tenantId,
      invoiceId,
      plan:          invoice.plan,
      billingCycle:  invoice.billingCycle,
      durationMonths: invoice.durationMonths,
      generatedBy:   userId,
      expiresAt,
    },
  })

  // Email the activation code to the tenant
  sendActivationCodeEmail({
    to:           tenant.email,
    schoolName:   tenant.name ?? 'Your school',
    code,
    plan:         invoice.plan,
    billingCycle: invoice.billingCycle,
    invoiceNo:    invoice.invoiceNo,
    amount:       invoice.amount,
    expiresAt,
  }).catch(err => console.error('[email] activation code:', err))

  return NextResponse.json({ code, expiresAt })
}
