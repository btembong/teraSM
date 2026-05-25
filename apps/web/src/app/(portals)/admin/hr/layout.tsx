import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ModuleTabs } from '@/components/ui/module-tabs'
import { UserCog, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function HRLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId as string | undefined

  const [employeeCount, pendingLeave, payrollCount] = await Promise.all([
    tenantId ? prisma.employee.count({ where: { tenantId, status: 'ACTIVE' } }) : 0,
    tenantId ? prisma.leaveRequest.count({ where: { tenantId, status: 'PENDING' } }) : 0,
    tenantId ? prisma.payrollPeriod.count({ where: { tenantId, status: { in: ['DRAFT', 'PROCESSING'] } } }) : 0,
  ])

  const tabs = [
    { label: 'Overview',       href: '/admin/hr',           icon: 'LayoutDashboard', group: 'overview' },
    { label: 'Employees',      href: '/admin/hr/employees', icon: 'Users',           badge: employeeCount, group: 'people' },
    { label: 'Leave Requests', href: '/admin/hr/leave',     icon: 'ClipboardList',   badge: pendingLeave,  group: 'time' },
    { label: 'Payroll',        href: '/admin/hr/payroll',   icon: 'Briefcase',       badge: payrollCount,  group: 'payroll' },
  ]

  return (
    <div>
      <div className="mb-8 -mt-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Link href="/admin" className="hover:text-gray-600 transition-colors">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">HR Management</span>
        </div>
        {/* Module identity */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <UserCog className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">HR Management</h1>
            <p className="text-sm text-gray-400 mt-0.5">Employees, leave management, payroll and performance</p>
          </div>
        </div>
        {/* Tab bar — only serializable data */}
        <ModuleTabs tabs={tabs} />
      </div>
      {children}
    </div>
  )
}
