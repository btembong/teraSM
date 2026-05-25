/**
 * GET /api/billing/paystack-callback
 * Redirect target after Paystack payment. Verifies the transaction and activates subscription.
 */
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { PLAN_STUDENT_CAPS, PLAN_STORAGE_CAPS } from '@/lib/pricing'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')
  const invoiceId = searchParams.get('invoiceId')

  if (!reference || !invoiceId) {
    return NextResponse.redirect(`${APP_URL}/admin/settings?tab=billing&error=missing_params`)
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY
  if (!paystackSecret) {
    return NextResponse.redirect(`${APP_URL}/admin/settings?tab=billing&error=gateway_not_configured`)
  }

  // Verify transaction with Paystack
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${paystackSecret}` },
  })
  const data = await res.json()

  if (!data.status || data.data?.status !== 'success') {
    return NextResponse.redirect(`${APP_URL}/admin/settings?tab=billing&error=payment_failed`)
  }

  await activateInvoice(invoiceId, 'PAYSTACK', reference)

  return NextResponse.redirect(`${APP_URL}/admin/settings?tab=billing&success=1`)
}

async function activateInvoice(invoiceId: string, method: string, ref: string) {
  const invoice = await (prisma as any).saasInvoice.findUnique({ where: { id: invoiceId } })
  if (!invoice || invoice.status === 'PAID') return

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + invoice.durationMonths)

  await (prisma as any).saasInvoice.update({
    where: { id: invoiceId },
    data: { status: 'PAID', paidAt: now, gatewayRef: ref, paymentMethod: method },
  })

  const existing = await (prisma as any).subscription.findUnique({ where: { tenantId: invoice.tenantId } })
  if (existing) {
    await (prisma as any).subscription.update({
      where: { tenantId: invoice.tenantId },
      data: { plan: invoice.plan, status: 'ACTIVE', billingCycle: invoice.billingCycle, currentPeriodStart: now, currentPeriodEnd: periodEnd, cancelledAt: null },
    })
  } else {
    await (prisma as any).subscription.create({
      data: { tenantId: invoice.tenantId, plan: invoice.plan, status: 'ACTIVE', billingCycle: invoice.billingCycle, currentPeriodStart: now, currentPeriodEnd: periodEnd },
    })
  }

  await prisma.tenant.update({
    where: { id: invoice.tenantId },
    data: {
      plan:       invoice.plan,
      status:     'ACTIVE',
      studentCap: PLAN_STUDENT_CAPS[invoice.plan as keyof typeof PLAN_STUDENT_CAPS],
      storageCap: PLAN_STORAGE_CAPS[invoice.plan as keyof typeof PLAN_STORAGE_CAPS],
      trialEndsAt: null,
    },
  })
}
