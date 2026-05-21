import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const [tenant, studentCount, invoices] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, status: true, studentCap: true, storageCap: true, trialEndsAt: true, createdAt: true },
    }),
    prisma.user.count({ where: { tenantId, role: 'STUDENT', status: 'ACTIVE' } }),
    prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, totalAmount: true, status: true, createdAt: true, dueDate: true },
    }),
  ])

  return NextResponse.json({ tenant, studentCount, invoices })
}
