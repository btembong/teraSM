import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Building2, Users, CreditCard, Activity } from 'lucide-react'

export default async function SuperAdminDashboard() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') redirect('/dashboard')

  const [tenantCount, userCount, tenantsByPlan, recentTenants] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.tenant.groupBy({ by: ['plan'], _count: { id: true } }),
    prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, slug: true, plan: true, status: true, studentCap: true, createdAt: true },
    }),
  ])

  const planColors: Record<string, string> = {
    STARTER: 'bg-gray-100 text-gray-600',
    PRO: 'bg-blue-50 text-blue-700',
    ENTERPRISE: 'bg-blue-100 text-blue-800',
    UNIVERSITY: 'bg-blue-900 text-white',
  }

  const statusColors: Record<string, string> = {
    TRIAL: 'bg-blue-50 text-blue-700',
    ACTIVE: 'bg-blue-100 text-blue-700',
    SUSPENDED: 'bg-gray-900 text-white',
    CANCELLED: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Platform Overview</h2>
        <p className="text-sm text-gray-400 mt-0.5">Tera SM — Super Admin Dashboard</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Schools', value: tenantCount, icon: Building2, color: 'text-violet-400' },
          { label: 'Total Users', value: userCount.toLocaleString(), icon: Users, color: 'text-blue-400' },
          { label: 'Active Plans', value: tenantsByPlan.length, icon: CreditCard, color: 'text-green-400' },
          { label: 'Activity', value: '—', icon: Activity, color: 'text-orange-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {tenantsByPlan.map((p) => (
          <div key={p.plan} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{p.plan}</p>
            <p className="text-xl font-bold text-white">{p._count.id}</p>
            <p className="text-xs text-gray-600">schools</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">Recent Schools</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {recentTenants.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-white text-sm">{t.name}</p>
                <p className="text-xs text-gray-500">{t.slug} · {new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${planColors[t.plan] ?? ''}`}>{t.plan}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[t.status] ?? ''}`}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
