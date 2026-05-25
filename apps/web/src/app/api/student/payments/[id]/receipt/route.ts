import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const payment = await prisma.payment.findFirst({
    where: { id, studentId: session.user.id, status: 'SUCCESS' },
    include: {
      invoice: {
        include: { items: true },
      },
    },
  })
  if (!payment) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })

  const [student, tenant] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true, email: true },
    }),
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true, logoUrl: true },
    }),
  ])

  return NextResponse.json({
    receipt: {
      id: payment.id,
      reference: payment.reference,
      amount: payment.amount,
      method: payment.method,
      paidAt: payment.paidAt,
      invoiceNo: payment.invoice.invoiceNo,
      invoiceTotal: payment.invoice.totalAmount,
      items: payment.invoice.items.map(i => ({ description: i.description, subtotal: i.subtotal })),
    },
    student: { name: `${student?.firstName} ${student?.lastName}`, email: student?.email },
    school: { name: tenant?.name, logo: tenant?.logoUrl },
  })
}
