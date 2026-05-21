import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DollarSign, CheckCircle, AlertCircle, Clock, Award } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { SectionCard } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'

const statusStyle: Record<string, string> = {
  DRAFT:          'bg-gray-100 text-gray-500',
  SENT:           'bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-600',
  PAID:           'bg-blue-600 text-white',
  OVERDUE:        'bg-gray-900 text-white',
  CANCELLED:      'bg-gray-100 text-gray-400',
}

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  PAID: CheckCircle,
  OVERDUE: AlertCircle,
}

export default async function StudentFeesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const [invoices, scholarships] = await Promise.all([
    prisma.invoice.findMany({
      where: { tenantId, studentId: userId },
      include: {
        items: true,
        payments: { where: { status: 'SUCCESS' }, orderBy: { paidAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.studentScholarship.findMany({
      where: { tenantId, studentId: userId, status: { in: ['APPROVED', 'ACTIVE'] } },
      include: { scholarship: true },
    }),
  ])

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const outstanding = invoices
    .filter((i) => ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status))
    .reduce((s, i) => s + i.totalAmount - i.paidAmount, 0)

  const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fees & Payments"
        description="Your invoices, payment history, and scholarships"
      />

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Outstanding Balance"
          value={fmt(outstanding)}
          icon={AlertCircle}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Total Paid"
          value={fmt(totalPaid)}
          icon={CheckCircle}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Scholarships"
          value={scholarships.length}
          icon={Award}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {/* Scholarships */}
      {scholarships.length > 0 && (
        <SectionCard title="Your Scholarships" icon={Award} iconColor="text-blue-500">
          <div className="space-y-2.5">
            {scholarships.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3.5">
                <div>
                  <p className="font-semibold text-blue-900">{s.scholarship.name}</p>
                  <p className="text-xs text-blue-500 mt-0.5">{s.scholarship.type}</p>
                </div>
                <div className="text-right">
                  {s.amountAwarded && (
                    <p className="font-bold text-blue-700">{fmt(s.amountAwarded)}</p>
                  )}
                  <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Invoices */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">Invoices</h2>
        {invoices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100">
            <EmptyState icon={DollarSign} title="No invoices yet" description="Your fee invoices will appear here once issued by the finance office." iconBg="bg-blue-50" iconColor="text-blue-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => {
              const StatusIcon = statusIcon[inv.status] ?? Clock
              const balance = inv.totalAmount - inv.paidAmount
              return (
                <div key={inv.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${inv.status === 'PAID' ? 'bg-blue-50' : inv.status === 'OVERDUE' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                        <StatusIcon className={`w-4.5 h-4.5 ${inv.status === 'PAID' ? 'text-blue-600' : inv.status === 'OVERDUE' ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{inv.invoiceNo}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {inv.issuedAt ? `Issued ${new Date(inv.issuedAt).toLocaleDateString()}` : 'Draft'}
                          {inv.dueDate ? ` · Due ${new Date(inv.dueDate).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusStyle[inv.status] ?? ''}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                      <p className="text-base font-bold text-gray-900 mt-1.5">{fmt(inv.totalAmount)}</p>
                      {balance > 0 && inv.status !== 'CANCELLED' && (
                        <p className="text-xs text-blue-500 mt-0.5">Balance: {fmt(balance)}</p>
                      )}
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="border-t border-gray-50 px-5 py-3 bg-gray-50/50">
                    {inv.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm py-1">
                        <span className="text-gray-500">{item.description}</span>
                        <span className="font-medium text-gray-800">{fmt(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Payment history */}
                  {inv.payments.length > 0 && (
                    <div className="border-t border-gray-50 px-5 py-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Payments</p>
                      {inv.payments.map((p) => (
                        <div key={p.id} className="flex justify-between text-xs text-gray-500 py-1">
                          <span>{p.method} · {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : ''}</span>
                          <span className="text-blue-600 font-semibold">{fmt(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
