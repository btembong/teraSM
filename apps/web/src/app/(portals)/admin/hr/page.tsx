import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, DollarSign, TrendingUp, Clock } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { SectionCard, SectionRow } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'

const payrollStyle: Record<string, string> = {
  DRAFT:      'bg-gray-100 text-gray-500',
  PROCESSING: 'bg-indigo-50 text-blue-700',
  PAID:       'bg-indigo-100 text-indigo-800',
  CANCELLED:  'bg-gray-100 text-gray-400',
}

export default async function AdminHRPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const [employeeStats, leaveStats, payrollPeriods, recentLeaveRequests] = await Promise.all([
    prisma.employee.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
    prisma.leaveRequest.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
    prisma.payrollPeriod.findMany({
      where: { tenantId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 4,
      include: { _count: { select: { payslips: true } } },
    }),
    prisma.leaveRequest.findMany({
      where: { tenantId, status: 'PENDING' },
      include: { leaveType: true, employee: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ])

  const empMap  = Object.fromEntries(employeeStats.map((s) => [s.status, s._count]))
  const leaveMap = Object.fromEntries(leaveStats.map((s) => [s.status, s._count]))

  const totalEmployees  = employeeStats.reduce((sum, s) => sum + s._count, 0)
  const activeEmployees = empMap['ACTIVE'] ?? 0
  const pendingLeave    = leaveMap['PENDING'] ?? 0

  const userIds = recentLeaveRequests.map((r) => r.employee.userId)
  const users   = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true },
  })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  return (
    <div className="space-y-7">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={totalEmployees} icon={Users} iconBg="bg-indigo-50" iconColor="text-indigo-600" href="/admin/hr/employees" />
        <StatCard label="Active Staff" value={activeEmployees} icon={TrendingUp} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <StatCard label="Pending Leave" value={pendingLeave} icon={Clock} iconBg="bg-indigo-50" iconColor="text-indigo-500" href="/admin/hr/leave" />
        <StatCard label="Payroll Periods" value={payrollPeriods.length} icon={DollarSign} iconBg="bg-indigo-50" iconColor="text-indigo-600" href="/admin/hr/payroll" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Pending leave */}
        <SectionCard
          title="Pending Leave Requests"
          icon={Clock}
          iconColor="text-indigo-500"
          action={<Link href="/admin/hr/leave" className="text-xs text-indigo-600 hover:underline font-medium">View all</Link>}
          noPadding
        >
          {recentLeaveRequests.length === 0 ? (
            <EmptyState icon={Clock} title="No pending requests" iconBg="bg-indigo-50" iconColor="text-indigo-400" />
          ) : (
            <div>
              {recentLeaveRequests.map((req) => {
                const user = userMap[req.employee.userId]
                return (
                  <SectionRow key={req.id}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {user?.firstName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-gray-400">{req.leaveType.name} · {req.days}d</p>
                      </div>
                    </div>
                    <span className="text-xs bg-indigo-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold ml-2 flex-shrink-0">Pending</span>
                  </SectionRow>
                )
              })}
            </div>
          )}
        </SectionCard>

        {/* Recent payroll */}
        <SectionCard
          title="Recent Payroll"
          icon={DollarSign}
          iconColor="text-indigo-500"
          action={<Link href="/admin/hr/payroll" className="text-xs text-indigo-600 hover:underline font-medium">View all</Link>}
          noPadding
        >
          {payrollPeriods.length === 0 ? (
            <EmptyState icon={DollarSign} title="No payroll periods yet" iconBg="bg-indigo-50" iconColor="text-indigo-400" />
          ) : (
            <div>
              {payrollPeriods.map((p) => (
                <SectionRow key={p.id}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p._count.payslips} payslips</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ml-2 flex-shrink-0 ${payrollStyle[p.status] ?? ''}`}>
                    {p.status}
                  </span>
                </SectionRow>
              ))}
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  )
}
