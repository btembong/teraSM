/**
 * POST /api/billing/bank-transfer
 * Creates an UNPAID SaasInvoice for a manual bank-transfer payment
 * and sends the tenant an email with bank details + invoice number.
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getPlanPrice, CYCLE_MONTHS, type Plan, type BillingCycle } from '@/lib/pricing'
import { sendBankTransferInstructionsEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = (session.user as any).tenantId
  const { plan, cycle } = await req.json() as { plan: Plan; cycle: BillingCycle }

  if (!plan || !cycle) {
    return NextResponse.json({ error: 'plan and cycle are required' }, { status: 400 })
  }

  const amount = getPlanPrice(plan, cycle)
  if (amount === 0) {
    return NextResponse.json({ error: 'University plan requires a custom quote.' }, { status: 400 })
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { email: true, name: true },
  })
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const durationMonths = CYCLE_MONTHS[cycle]
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + durationMonths)

  const count = await (prisma as any).saasInvoice.count({ where: { tenantId } })
  const invoiceNo = `INV-TERA-${tenantId.slice(-6).toUpperCase()}-${String(count + 1).padStart(4, '0')}`

  const invoice = await (prisma as any).saasInvoice.create({
    data: {
      tenantId,
      invoiceNo,
      amount,
      currency: 'USD',
      status: 'UNPAID',
      plan,
      billingCycle: cycle,
      durationMonths,
      periodStart: now,
      periodEnd,
      paymentMethod: 'BANK_TRANSFER',
      manualNote: 'Awaiting bank transfer confirmation',
    },
  })

  // Fire-and-forget email with bank details
  sendBankTransferInstructionsEmail({
    to: tenant.email,
    schoolName: tenant.name ?? 'Your school',
    invoiceNo: invoice.invoiceNo,
    amount,
    plan,
    billingCycle: cycle,
  }).catch(err => console.error('[email] bank-transfer instructions:', err))

  return NextResponse.json({ invoiceNo: invoice.invoiceNo, amount, currency: 'USD' }, { status: 201 })
}
