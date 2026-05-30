import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { SendRemindersButton } from './_components/SendRemindersButton'
import { ApplyScheduleButton } from './_components/ApplyScheduleButton'

const statusColor: Record<string, string> = {
  DRAFT:          'bg-gray-100 text-gray-600',
  SENT:           'bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-600',
  PAID:           'bg-green-100 text-green-700',
  OVERDUE:        'bg-red-100 text-red-700',
  CANCELLED:      'bg-gray-100 text-gray-400',
}

export default async function InvoicesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const [invoices, tenantRow, students, schedules] = await Promise.all([
    prisma.invoice.findMany({
      where: { tenantId },
      include: {
        items:       true,
        payments:    { where: { status: 'SUCCESS' } },
        paymentPlan: { include: { installments: { orderBy: { dueDate: 'asc' } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.user.findMany({
      where: { tenantId, role: 'STUDENT' },
      select: { id: true, firstName: true, lastName: true },
    }),
    (prisma as any).semesterPaymentSchedule
      ? (prisma as any).semesterPaymentSchedule.findMany({
          where: { tenantId, isActive: true },
          select: { id: true, name: true, items: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { name: 'asc' },
        }).catch(() => [])
      : Promise.resolve([]),
  ])

  const currency = (tenantRow as any)?.currency ?? 'USD'
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Invoices</h2>
          <p className="text-sm text-slate-400 mt-0.5">Student fee invoices and payment status</p>
        </div>
        <SendRemindersButton />
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Invoices will appear here once they are created for students."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <table className="w-full text-sm table-hover">
            <thead>
              <tr className="border-b border-gray-50 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Invoice #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Student</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Total</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Paid</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Installments</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Due Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map((inv) => {
                const student = studentMap[inv.studentId]
                const plan    = inv.paymentPlan as any
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 border-r border-gray-100 font-mono text-xs">
                      {inv.invoiceNo}
                    </td>
                    <td className="px-5 py-3.5 border-r border-gray-100">
                      {student
                        ? <p className="font-medium text-slate-800 text-sm">{student.firstName} {student.lastName}</p>
                        : <p className="font-mono text-xs text-slate-400">{inv.studentId.slice(0, 8)}…</p>}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 border-r border-gray-100">
                      {fmt(inv.totalAmount)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-green-600 border-r border-gray-100">
                      {fmt(inv.paidAmount)}
                    </td>
                    <td className="px-5 py-3.5 border-r border-gray-100">
                      {plan ? (
                        <div className="space-y-1">
                          {(plan.installments as any[]).map((inst: any, i: number) => (
                            <div key={inst.id} className="flex items-center gap-2 text-xs">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                inst.status === 'PAID'    ? 'bg-green-500'
                                : inst.status === 'OVERDUE' ? 'bg-red-500'
                                : 'bg-slate-300'
                              }`} />
                              <span className="text-slate-600 font-medium">{fmt(inst.amount)}</span>
                              <span className="text-slate-400">
                                {new Date(inst.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                                inst.status === 'PAID'    ? 'bg-green-100 text-green-700'
                                : inst.status === 'OVERDUE' ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-500'
                              }`}>{inst.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No schedule applied</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 border-r border-gray-100 text-sm">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 border-r border-gray-100">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${statusColor[inv.status] ?? ''}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && schedules.length > 0 && (
                        <ApplyScheduleButton
                          invoiceId={inv.id}
                          invoiceNo={inv.invoiceNo}
                          totalAmount={inv.totalAmount}
                          schedules={schedules as any}
                          currency={currency}
                          hasExistingPlan={!!plan}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
