import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { DollarSign, Award, TrendingUp, AlertCircle } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { SectionCard, SectionRow } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'

export default async function FinanceDashboard() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const [, , overdueInvoices, scholarships, revenueAgg, tenantRow] =
    await Promise.all([
      prisma.invoice.count({ where: { tenantId } }),
      prisma.invoice.count({ where: { tenantId, status: 'PAID' } }),
      prisma.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),
      prisma.scholarship.count({ where: { tenantId, isActive: true } }),
      prisma.payment.aggregate({ where: { tenantId, status: 'SUCCESS' }, _sum: { amount: true } }),
      prisma.tenant.findUnique({ where: { id: tenantId } }),
    ])

  const outstanding = await prisma.invoice.aggregate({
    where: { tenantId, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
    _sum: { totalAmount: true, paidAmount: true },
  })
  const outstandingAmount = (outstanding._sum.totalAmount ?? 0) - (outstanding._sum.paidAmount ?? 0)

  const recentPayments = await prisma.payment.findMany({
    where: { tenantId, status: 'SUCCESS' },
    include: { invoice: true },
    orderBy: { paidAt: 'desc' },
    take: 6,
  })

  const currency = (tenantRow as any)?.currency ?? 'USD'
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

  return (
    <div className="space-y-7">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={fmt(revenueAgg._sum.amount ?? 0)} icon={TrendingUp} iconBg="bg-indigo-50" iconColor="text-indigo-600" href="/admin/finance/invoices" />
        <StatCard label="Outstanding" value={fmt(outstandingAmount)} icon={AlertCircle} iconBg="bg-indigo-50" iconColor="text-indigo-500" href="/admin/finance/invoices" />
        <StatCard label="Overdue Invoices" value={overdueInvoices} icon={AlertCircle} iconBg="bg-indigo-50" iconColor="text-indigo-500" href="/admin/finance/invoices" />
        <StatCard label="Active Scholarships" value={scholarships} icon={Award} iconBg="bg-indigo-50" iconColor="text-indigo-600" href="/admin/finance/scholarships" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent payments */}
        <SectionCard
          title="Recent Payments"
          icon={TrendingUp}
          iconColor="text-indigo-500"
          action={<Link href="/admin/finance/invoices" className="text-xs text-indigo-600 hover:underline font-medium">View all</Link>}
          noPadding
        >
          {recentPayments.length === 0 ? (
            <EmptyState icon={DollarSign} title="No payments yet" iconBg="bg-indigo-50" iconColor="text-indigo-400" />
          ) : (
            <div>
              {recentPayments.map((p) => (
                <SectionRow key={p.id}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{p.invoice.invoiceNo}</p>
                    <p className="text-xs text-gray-400">
                      {p.method} · {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-indigo-600 ml-3 flex-shrink-0">{fmt(p.amount)}</span>
                </SectionRow>
              ))}
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  )
}
