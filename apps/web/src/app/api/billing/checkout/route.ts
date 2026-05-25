/**
 * POST /api/billing/checkout
 * Initiates a Paystack or Stripe checkout session for a subscription upgrade.
 * Returns a redirect URL that the client opens.
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getPlanPrice, CYCLE_MONTHS, type Plan, type BillingCycle } from '@/lib/pricing'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = (session.user as any).tenantId
  const { plan, cycle, gateway } = await req.json() as {
    plan: Plan
    cycle: BillingCycle
    gateway: 'paystack' | 'stripe'
  }

  if (!plan || !cycle || !gateway) {
    return NextResponse.json({ error: 'plan, cycle and gateway are required' }, { status: 400 })
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { email: true, name: true, currency: true },
  })
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const amount = getPlanPrice(plan, cycle)
  if (amount === 0) {
    return NextResponse.json({ error: 'University plan requires a custom quote. Contact sales.' }, { status: 400 })
  }

  const durationMonths = CYCLE_MONTHS[cycle]
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + durationMonths)

  // Create a pending SaasInvoice first
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
      paymentMethod: gateway.toUpperCase(),
    },
  })

  // ── Paystack ─────────────────────────────────────────────────────────────
  if (gateway === 'paystack') {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecret) {
      return NextResponse.json({ error: 'Paystack not configured' }, { status: 500 })
    }

    const amountKobo = Math.round(amount * 100) // Paystack uses kobo (x100 of major unit)
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: tenant.email,
        amount: amountKobo,
        currency: 'USD',
        reference: invoice.id,
        callback_url: `${APP_URL}/api/billing/paystack-callback?invoiceId=${invoice.id}`,
        metadata: { tenantId, plan, cycle, invoiceId: invoice.id },
      }),
    })

    const data = await res.json()
    if (!data.status) {
      return NextResponse.json({ error: data.message ?? 'Paystack error' }, { status: 502 })
    }

    return NextResponse.json({ url: data.data.authorization_url })
  }

  // ── Stripe ────────────────────────────────────────────────────────────────
  if (gateway === 'stripe') {
    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const amountCents = Math.round(amount * 100)
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][unit_amount]': String(amountCents),
        'line_items[0][price_data][product_data][name]': `Tera SM ${plan} Plan (${cycle})`,
        'line_items[0][quantity]': '1',
        mode: 'payment',
        customer_email: tenant.email,
        success_url: `${APP_URL}/api/billing/stripe-callback?session_id={CHECKOUT_SESSION_ID}&invoiceId=${invoice.id}`,
        cancel_url: `${APP_URL}/admin/settings?tab=billing&cancelled=1`,
        'metadata[tenantId]': tenantId,
        'metadata[plan]': plan,
        'metadata[cycle]': cycle,
        'metadata[invoiceId]': invoice.id,
      }).toString(),
    })

    const data = await res.json()
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 502 })
    }

    return NextResponse.json({ url: data.url })
  }

  return NextResponse.json({ error: 'Unsupported gateway' }, { status: 400 })
}
