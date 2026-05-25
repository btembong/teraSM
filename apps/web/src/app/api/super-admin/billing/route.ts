/**
 * GET /api/super-admin/billing
 * Returns pending bank-transfer invoices + existing activation codes for super admin.
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session?.user || role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [pendingInvoices, recentCodes, stats] = await Promise.all([
    (prisma as any).saasInvoice.findMany({
      where: { status: 'UNPAID', paymentMethod: 'BANK_TRANSFER' },
      orderBy: { createdAt: 'desc' },
      include: {
        activationCode: { select: { code: true, usedAt: true, expiresAt: true } },
      },
    }).catch(() => []),

    (prisma as any).activationCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        invoice: { select: { invoiceNo: true, amount: true, currency: true, plan: true, billingCycle: true } },
      },
    }).catch(() => []),

    (prisma as any).saasInvoice.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum:   { amount: true },
    }).catch(() => []),
  ])

  // Add tenant name to each invoice
  const tenantIds = [...new Set(pendingInvoices.map((i: any) => i.tenantId))]
  const tenants = tenantIds.length
    ? await prisma.tenant.findMany({
        where: { id: { in: tenantIds as string[] } },
        select: { id: true, name: true, email: true, slug: true },
      })
    : []
  const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t]))

  const invoicesWithTenant = pendingInvoices.map((inv: any) => ({
    ...inv,
    tenant: tenantMap[inv.tenantId] ?? null,
  }))

  return NextResponse.json({ pendingInvoices: invoicesWithTenant, recentCodes, stats })
}
