import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payments = await prisma.payment.findMany({
    where: { tenantId: session.user.tenantId, studentId: session.user.id, status: 'SUCCESS' },
    include: { invoice: { select: { invoiceNo: true, totalAmount: true } } },
    orderBy: { paidAt: 'desc' },
  })

  return NextResponse.json(payments)
}
