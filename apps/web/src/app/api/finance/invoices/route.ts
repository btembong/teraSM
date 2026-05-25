import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoices = await prisma.invoice.findMany({
    where: { tenantId: session.user.tenantId, studentId: session.user.id },
    include: {
      items: true,
      payments: { where: { status: 'SUCCESS' }, orderBy: { paidAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(invoices)
}
