import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ModuleTabs } from '@/components/ui/module-tabs'
import { DollarSign, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId as string | undefined

  const [unpaidCount, feeCount, scholarshipCount] = await Promise.all([
    tenantId ? prisma.invoice.count({ where: { tenantId, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } } }) : 0,
    tenantId ? prisma.feeStructure.count({ where: { tenantId } }) : 0,
    tenantId ? prisma.scholarship.count({ where: { tenantId } }) : 0,
  ])

  const tabs = [
    { label: 'Overview',       href: '/admin/finance' },
    { label: 'Fee Structures', href: '/admin/finance/fees',         badge: feeCount },
    { label: 'Invoices',       href: '/admin/finance/invoices',     badge: unpaidCount },
    { label: 'Scholarships',   href: '/admin/finance/scholarships', badge: scholarshipCount },
  ]

  return (
    <div>
      <div className="mb-8 -mt-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Link href="/admin" className="hover:text-gray-600 transition-colors">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">Finance</span>
        </div>
        {/* Module identity */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Finance</h1>
            <p className="text-sm text-gray-400 mt-0.5">Fee structures, invoices, payments and scholarships</p>
          </div>
        </div>
        {/* Tab bar — only serializable data */}
        <ModuleTabs tabs={tabs} />
      </div>
      {children}
    </div>
  )
}
