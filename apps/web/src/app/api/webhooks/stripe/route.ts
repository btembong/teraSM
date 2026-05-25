/**
 * POST /api/webhooks/stripe
 * Handles Stripe event webhooks. Verifies signature using stripe-signature header.
 */
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { PLAN_STUDENT_CAPS, PLAN_STORAGE_CAPS } from '@/lib/pricing'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const rawBody = await req.text()
  const stripeSignature = req.headers.get('stripe-signature') ?? ''

  // Verify Stripe webhook signature (simplified — production should use stripe.webhooks.constructEvent)
  const parts = Object.fromEntries(stripeSignature.split(',').map(p => p.split('=')))
  const timestamp = parts['t']
  const sigv1 = parts['v1']
  const signedPayload = `${timestamp}.${rawBody}`
  const expected = createHmac('sha256', webhookSecret).update(signedPayload).digest('hex')

  if (expected !== sigv1) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    if (session.payment_status === 'paid') {
      const invoiceId: string | undefined = session.metadata?.invoiceId
      if (invoiceId) {
        await activateInvoice(invoiceId, 'STRIPE', session.id)
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    // Optional: mark invoice as failed / notify
    console.warn('[stripe] payment failed:', event.data.object.id)
  }

  return NextResponse.json({ received: true })
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
