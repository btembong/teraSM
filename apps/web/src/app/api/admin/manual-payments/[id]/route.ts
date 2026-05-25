import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const tenantId = (session.user as any).tenantId
  const body = await req.json()
  const { action, adminNote } = body // action: 'APPROVE' | 'REJECT'

  if (!['APPROVE', 'REJECT'].includes(action)) {
    return NextResponse.json({ error: 'action must be APPROVE or REJECT' }, { status: 400 })
  }

  const manual = await prisma.manualPayment.findFirst({
    where: { id, tenantId },
    include: {
      invoice: { include: { items: true } },
    },
  })
  if (!manual) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (manual.status !== 'PENDING') {
    return NextResponse.json({ error: 'Already reviewed' }, { status: 400 })
  }

  const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'

  await prisma.manualPayment.update({
    where: { id },
    data: {
      status: newStatus,
      adminNote: adminNote ?? null,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    },
  })

  if (action === 'APPROVE') {
    // Apply payment to invoice
    const invoice = manual.invoice
    const newPaid = Math.min(invoice.paidAmount + manual.amount, invoice.totalAmount)
    const newStatus =
      newPaid >= invoice.totalAmount
        ? 'PAID'
        : newPaid > 0
        ? 'PARTIALLY_PAID'
        : invoice.status

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { paidAmount: newPaid, status: newStatus },
    })

    // Fetch tenant currency + student email for notification
    const [tenant, student] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, currency: true } }),
      prisma.user.findUnique({ where: { id: manual.studentId }, select: { firstName: true, lastName: true, email: true } }),
    ])
    const currency = (tenant as any)?.currency ?? 'USD'
    const fmt = (n: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

    await notify({
      tenantId,
      userId: manual.studentId,
      title: 'Bank transfer payment approved',
      body: `Your payment of ${fmt(manual.amount)} for invoice ${invoice.invoiceNo} has been approved. New balance: ${fmt(invoice.totalAmount - newPaid)}.`,
      link: '/student/fees',
      email: student?.email
        ? {
            to: student.email,
            subject: `Payment approved — ${invoice.invoiceNo}`,
          }
        : undefined,
    })
  } else {
    // REJECT — notify student
    const [invoice, student] = await Promise.all([
      prisma.invoice.findUnique({ where: { id: manual.invoiceId }, select: { invoiceNo: true } }),
      prisma.user.findUnique({ where: { id: manual.studentId }, select: { firstName: true, lastName: true, email: true } }),
    ])

    await notify({
      tenantId,
      userId: manual.studentId,
      title: 'Bank transfer payment not approved',
      body: adminNote
        ? `Your payment proof for invoice ${invoice?.invoiceNo} was not approved. Reason: ${adminNote}`
        : `Your payment proof for invoice ${invoice?.invoiceNo} was not approved. Please contact the finance office.`,
      link: '/student/fees',
      email: student?.email
        ? {
            to: student.email,
            subject: `Payment proof not approved — ${invoice?.invoiceNo}`,
          }
        : undefined,
    })
  }

  return NextResponse.json({ success: true })
}
