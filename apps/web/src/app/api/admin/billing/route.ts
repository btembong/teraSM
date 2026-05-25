import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const [tenant, studentCount, subscription, saasInvoices] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, status: true, studentCap: true, storageCap: true, trialEndsAt: true, createdAt: true },
    }),
    prisma.user.count({ where: { tenantId, role: 'STUDENT', status: 'ACTIVE' } }),
    (prisma as any).subscription.findUnique({
      where: { tenantId },
    }).catch(() => null),
    (prisma as any).saasInvoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, invoiceNo: true, amount: true, currency: true,
        status: true, plan: true, billingCycle: true, paidAt: true,
        createdAt: true, paymentMethod: true, receiptUrl: true,
      },
    }).catch(() => []),
  ])

  return NextResponse.json({ tenant, studentCount, subscription, saasInvoices })
}
