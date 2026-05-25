import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const plans = await prisma.paymentPlan.findMany({
    where: { tenantId: session.user.tenantId, studentId: session.user.id },
    include: {
      invoice: { select: { invoiceNo: true, totalAmount: true } },
      installments: { orderBy: { dueDate: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(plans)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const studentId = session.user.id
  const { invoiceId, numInstallments } = await req.json()

  if (!invoiceId || !numInstallments || numInstallments < 2 || numInstallments > 12) {
    return NextResponse.json({ error: 'invoiceId and numInstallments (2–12) required' }, { status: 400 })
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId, studentId, status: { notIn: ['PAID', 'CANCELLED'] } },
  })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  // Check no existing active plan
  const existing = await prisma.paymentPlan.findUnique({ where: { invoiceId } })
  if (existing && !['REJECTED', 'CANCELLED'].includes(existing.status)) {
    return NextResponse.json({ error: 'A payment plan already exists for this invoice' }, { status: 409 })
  }

  const balance = invoice.totalAmount - invoice.paidAmount
  const installmentAmount = Math.ceil((balance / numInstallments) * 100) / 100
  const now = new Date()

  // Generate monthly installment schedule
  const installments = Array.from({ length: numInstallments }, (_, i) => {
    const due = new Date(now)
    due.setMonth(due.getMonth() + i + 1)
    return { dueDate: due, amount: installmentAmount }
  })

  const plan = await prisma.paymentPlan.create({
    data: {
      tenantId,
      invoiceId,
      studentId,
      totalAmount: balance,
      numInstallments,
      status: 'APPROVED', // auto-approve for now
      installments: { create: installments },
    },
    include: { installments: { orderBy: { dueDate: 'asc' } } },
  })

  return NextResponse.json(plan, { status: 201 })
}
