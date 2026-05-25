import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payments = await prisma.manualPayment.findMany({
    where: { tenantId: session.user.tenantId, studentId: session.user.id },
    include: {
      invoice: { select: { invoiceNo: true, totalAmount: true, paidAmount: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { invoiceId, amount, bankName, accountName, reference, proofUrl, proofName } = body

  if (!invoiceId || !amount || !proofUrl) {
    return NextResponse.json({ error: 'invoiceId, amount, and proofUrl are required' }, { status: 400 })
  }

  // Verify the invoice belongs to this student
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: session.user.tenantId, studentId: session.user.id },
  })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  if (invoice.status === 'PAID') {
    return NextResponse.json({ error: 'Invoice is already fully paid' }, { status: 400 })
  }

  const numAmount = parseFloat(amount)
  if (isNaN(numAmount) || numAmount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const manual = await prisma.manualPayment.create({
    data: {
      tenantId: session.user.tenantId,
      studentId: session.user.id,
      invoiceId,
      amount: numAmount,
      bankName: bankName ?? null,
      accountName: accountName ?? null,
      reference: reference ?? null,
      proofUrl,
      proofName: proofName ?? null,
      status: 'PENDING',
    },
  })

  return NextResponse.json(manual, { status: 201 })
}
