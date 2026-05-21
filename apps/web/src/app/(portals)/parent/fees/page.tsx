import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react'

const statusColor: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'bg-blue-50 text-blue-600',
  PAID: 'bg-blue-100 text-blue-700',
  OVERDUE: 'bg-gray-900 text-white',
  CANCELLED: 'bg-gray-100 text-gray-400',
}

export default async function ParentFeesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const parentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const links = await prisma.parentStudent.findMany({ where: { tenantId, parentId } })
  const studentIds = links.map((l) => l.studentId)
  const children = await prisma.user.findMany({ where: { id: { in: studentIds } }, select: { id: true, firstName: true, lastName: true } })

  const feesByChild = await Promise.all(
    children.map(async (child) => {
      const invoices = await prisma.invoice.findMany({
        where: { tenantId, studentId: child.id },
        include: { items: true, payments: { orderBy: { createdAt: 'desc' }, take: 3 } },
        orderBy: { createdAt: 'desc' },
      })
      const totalOwed = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0)
      return { child, invoices, totalOwed }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
        <p className="text-gray-500">View invoices and outstanding balances</p>
      </div>

      {feesByChild.map(({ child, invoices, totalOwed }) => (
        <div key={child.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{child.firstName} {child.lastName}</h2>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${totalOwed > 0 ? 'bg-gray-900 text-white' : 'bg-blue-50 text-blue-700'}`}>
              {totalOwed > 0 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              {totalOwed > 0 ? `$${totalOwed.toLocaleString()} outstanding` : 'All paid up'}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200">
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No invoices yet</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{inv.invoiceNo}</p>
                        <p className="text-xs text-gray-400">
                          {inv.dueDate ? `Due ${new Date(inv.dueDate).toLocaleDateString()}` : new Date(inv.createdAt).toLocaleDateString()}
                          {' · '}{inv.items.length} item{inv.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">${inv.totalAmount.toLocaleString()}</p>
                        {inv.paidAmount > 0 && <p className="text-xs text-gray-400">${inv.paidAmount.toLocaleString()} paid</p>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[inv.status] ?? ''}`}>{inv.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
