import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'
import { PLAN_STUDENT_CAPS, PLAN_STORAGE_CAPS } from '@/lib/pricing'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const signature = req.headers.get('x-paystack-signature')
  const body = await req.text()

  // Verify webhook signature
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex')
  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.event === 'charge.success') {
    const { reference, amount, currency, metadata } = event.data
    const amountInMajor = amount / 100

    // ── SaaS billing payment ──────────────────────────────────────────────
    const saasInvoiceId: string | undefined = metadata?.invoiceId
    if (saasInvoiceId) {
      const inv = await (prisma as any).saasInvoice.findUnique({ where: { id: saasInvoiceId } })
      if (inv && inv.status !== 'PAID') {
        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setMonth(periodEnd.getMonth() + inv.durationMonths)

        await (prisma as any).saasInvoice.update({
          where: { id: saasInvoiceId },
          data: { status: 'PAID', paidAt: now, gatewayRef: reference, paymentMethod: 'PAYSTACK' },
        })
        const existing = await (prisma as any).subscription.findUnique({ where: { tenantId: inv.tenantId } })
        if (existing) {
          await (prisma as any).subscription.update({
            where: { tenantId: inv.tenantId },
            data: { plan: inv.plan, status: 'ACTIVE', billingCycle: inv.billingCycle, currentPeriodStart: now, currentPeriodEnd: periodEnd, cancelledAt: null },
          })
        } else {
          await (prisma as any).subscription.create({
            data: { tenantId: inv.tenantId, plan: inv.plan, status: 'ACTIVE', billingCycle: inv.billingCycle, currentPeriodStart: now, currentPeriodEnd: periodEnd },
          })
        }
        await prisma.tenant.update({
          where: { id: inv.tenantId },
          data: {
            plan: inv.plan, status: 'ACTIVE',
            studentCap: PLAN_STUDENT_CAPS[inv.plan as keyof typeof PLAN_STUDENT_CAPS],
            storageCap:  PLAN_STORAGE_CAPS[inv.plan as keyof typeof PLAN_STORAGE_CAPS],
            trialEndsAt: null,
          },
        })
      }
      return NextResponse.json({ received: true })
    }

    // ── Student fee payment ───────────────────────────────────────────────
    const payment = await prisma.payment.findUnique({ where: { reference } })
    if (!payment || payment.status === 'SUCCESS') {
      return NextResponse.json({ received: true })
    }

    // Mark payment success
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCESS', paidAt: new Date(), gatewayResponse: event.data },
    })

    // Update invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: payment.invoiceId },
      select: { totalAmount: true, paidAmount: true },
    })
    if (invoice) {
      const newPaid = invoice.paidAmount + amountInMajor
      const newStatus = newPaid >= invoice.totalAmount - 0.01 ? 'PAID' : 'PARTIALLY_PAID'
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { paidAmount: newPaid, status: newStatus },
      })
    }

    // Notify student via in-app + email + push
    const student = await prisma.user.findUnique({
      where: { id: payment.studentId },
      select: { email: true },
    })
    await notify({
      tenantId: payment.tenantId,
      userId: payment.studentId,
      title: 'Payment confirmed',
      body: `${currency} ${amountInMajor.toLocaleString()} payment has been confirmed.`,
      link: `/student/fees/receipt/${payment.id}`,
      email: student?.email
        ? { to: student.email, subject: 'Payment confirmed — Tera SM' }
        : undefined,
    })
  }

  return NextResponse.json({ received: true })
}
