import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const studentId = session.user.id
  const { invoiceId, amount, method = 'PAYSTACK' } = await req.json()

  if (!invoiceId || !amount) return NextResponse.json({ error: 'invoiceId and amount required' }, { status: 400 })

  // Verify invoice belongs to student and is payable
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId, studentId, status: { notIn: ['PAID', 'CANCELLED'] } },
  })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found or not payable' }, { status: 404 })

  const balance = invoice.totalAmount - invoice.paidAmount
  if (amount > balance + 0.01) {
    return NextResponse.json({ error: `Amount exceeds outstanding balance of ${balance}` }, { status: 400 })
  }

  // Create unique reference
  const reference = `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

  // Create pending payment record
  const payment = await prisma.payment.create({
    data: {
      tenantId,
      studentId,
      invoiceId,
      amount,
      method: method as any,
      status: 'PENDING',
      reference,
    },
  })

  // Get student email for Paystack
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { email: true, firstName: true, lastName: true },
  })

  return NextResponse.json({
    reference,
    paymentId: payment.id,
    amount: Math.round(amount * 100), // convert to pesewas/kobo
    email: student?.email,
    name: `${student?.firstName} ${student?.lastName}`,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    invoiceNo: invoice.invoiceNo,
  })
}
