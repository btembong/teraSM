import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { DollarSign, FileText, Award, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { SectionCard, SectionRow } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'

export default async function FinanceDashboard() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const [, , overdueInvoices, scholarships, revenueAgg] =
    await Promise.all([
      prisma.invoice.count({ where: { tenantId } }),
      prisma.invoice.count({ where: { tenantId, status: 'PAID' } }),
      prisma.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),
      prisma.scholarship.count({ where: { tenantId, isActive: true } }),
      prisma.payment.aggregate({ where: { tenantId, status: 'SUCCESS' }, _sum: { amount: true } }),
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

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const navLinks = [
    { href: '/admin/finance/fees', label: 'Fee Structures', desc: 'Configure program and course fees', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { href: '/admin/finance/invoices', label: 'Invoices', desc: 'View and manage all student invoices', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { href: '/admin/finance/scholarships', label: 'Scholarships', desc: 'Manage bursaries and financial aid', icon: Award, color: 'text-blue-600', bg: 'bg-blue-50' },
  ]

  return (
    <div className="space-y-7">
      <PageHeader title="Finance" description="Fee management, invoices, payments and scholarships." />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={fmt(revenueAgg._sum.amount ?? 0)} icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600" href="/admin/finance/invoices" />
        <StatCard label="Outstanding" value={fmt(outstandingAmount)} icon={AlertCircle} iconBg="bg-blue-50" iconColor="text-blue-500" href="/admin/finance/invoices" />
        <StatCard label="Overdue Invoices" value={overdueInvoices} icon={AlertCircle} iconBg="bg-blue-50" iconColor="text-blue-500" href="/admin/finance/invoices" />
        <StatCard label="Active Scholarships" value={scholarships} icon={Award} iconBg="bg-blue-50" iconColor="text-blue-600" href="/admin/finance/scholarships" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Module nav */}
        <SectionCard title="Finance Modules" icon={DollarSign} iconColor="text-blue-500">
          <div className="space-y-2">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className={`w-9 h-9 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Recent payments */}
        <SectionCard
          title="Recent Payments"
          icon={TrendingUp}
          iconColor="text-blue-500"
          action={<Link href="/admin/finance/invoices" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>}
          noPadding
        >
          {recentPayments.length === 0 ? (
            <EmptyState icon={DollarSign} title="No payments yet" iconBg="bg-blue-50" iconColor="text-blue-400" />
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
                  <span className="text-sm font-bold text-blue-600 ml-3 flex-shrink-0">{fmt(p.amount)}</span>
                </SectionRow>
              ))}
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  )
}
