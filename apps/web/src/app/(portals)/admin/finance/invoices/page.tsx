import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FileText } from 'lucide-react'

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

  const invoices = await prisma.invoice.findMany({
    where: { tenantId },
    include: { items: true, payments: { where: { status: 'SUCCESS' } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500">Student fee invoices and payment status</p>
        </div>
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
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Invoice #</th>
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Student</th>
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Total</th>
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Paid</th>
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Due Date</th>
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{inv.invoiceNo}</td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{inv.studentId.slice(0, 8)}…</td>
                  <td className="px-5 py-3 font-semibold text-gray-900">{fmt(inv.totalAmount)}</td>
                  <td className="px-5 py-3 text-blue-600">{fmt(inv.paidAmount)}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[inv.status] ?? ''}`}>
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
