import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reference } = await req.json()
  if (!reference) return NextResponse.json({ error: 'reference required' }, { status: 400 })

  // Find the pending payment
  const payment = await prisma.payment.findUnique({ where: { reference } })
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  if (payment.studentId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (payment.status === 'SUCCESS') return NextResponse.json({ success: true, alreadyVerified: true })

  // Verify with Paystack
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 })

  const psRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  const psData = await psRes.json()

  if (!psRes.ok || psData.data?.status !== 'success') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', gatewayResponse: psData },
    })
    return NextResponse.json({ error: psData.message ?? 'Payment verification failed' }, { status: 400 })
  }

  // Mark payment as successful
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'SUCCESS',
      paidAt: new Date(),
      gatewayResponse: psData.data,
    },
  })

  // Update invoice paidAmount and status
  const invoice = await prisma.invoice.findUnique({
    where: { id: payment.invoiceId },
    select: { totalAmount: true, paidAmount: true },
  })
  if (invoice) {
    const newPaid = invoice.paidAmount + payment.amount
    const newStatus = newPaid >= invoice.totalAmount - 0.01 ? 'PAID' : 'PARTIALLY_PAID'
    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { paidAmount: newPaid, status: newStatus },
    })

    // If payment plan exists, mark the matching installment as paid
    const plan = await (prisma as any).paymentPlan.findUnique({
      where: { invoiceId: payment.invoiceId },
      include: { installments: { where: { status: 'PENDING' }, orderBy: { dueDate: 'asc' } } },
    })
    if (plan && plan.installments.length > 0) {
      await (prisma as any).paymentPlanInstallment.update({
        where: { id: plan.installments[0].id },
        data: { status: 'PAID', paidAt: new Date(), paymentId: payment.id },
      })
      // Check if all installments paid → mark plan COMPLETED
      const remaining = await (prisma as any).paymentPlanInstallment.count({
        where: { planId: plan.id, status: { not: 'PAID' } },
      })
      if (remaining === 0) {
        await (prisma as any).paymentPlan.update({ where: { id: plan.id }, data: { status: 'COMPLETED' } })
      }
    }
  }

  // Notify student via in-app + email + push
  const student = await prisma.user.findUnique({
    where: { id: payment.studentId },
    select: { email: true },
  })
  const currency = psData.data.currency ?? ''
  await notify({
    tenantId: payment.tenantId,
    userId: payment.studentId,
    title: 'Payment received',
    body: `Your payment of ${currency} ${payment.amount.toLocaleString()} has been confirmed.`,
    link: `/student/fees/receipt/${payment.id}`,
    email: student?.email
      ? { to: student.email, subject: 'Payment confirmed — Tera SM' }
      : undefined,
  })

  return NextResponse.json({ success: true, paymentId: payment.id })
}
