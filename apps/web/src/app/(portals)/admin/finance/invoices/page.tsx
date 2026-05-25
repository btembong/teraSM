import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FileText } from 'lucide-react'
import { SendRemindersButton } from './_components/SendRemindersButton'

const statusColor: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-600',
  PAID: 'bg-blue-600 text-white',
  OVERDUE: 'bg-gray-900 text-white',
  CANCELLED: 'bg-gray-100 text-gray-400',
}

export default async function InvoicesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const [invoices, tenantRow] = await Promise.all([
    prisma.invoice.findMany({
      where: { tenantId },
      include: { items: true, payments: { where: { status: 'SUCCESS' } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
  ])

  const currency = (tenantRow as any)?.currency ?? 'USD'
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

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
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-2xl">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No invoices yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Invoice #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Student</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Total</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Paid</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Due Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900 border-r border-gray-100">{inv.invoiceNo}</td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-xs border-r border-gray-100">{inv.studentId.slice(0, 8)}…</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900 border-r border-gray-100">{fmt(inv.totalAmount)}</td>
                  <td className="px-5 py-3.5 text-indigo-600 font-semibold border-r border-gray-100">{fmt(inv.paidAmount)}</td>
                  <td className="px-5 py-3.5 text-slate-500 border-r border-gray-100">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[inv.status] ?? ''}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
