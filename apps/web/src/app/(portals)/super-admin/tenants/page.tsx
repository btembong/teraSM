import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function SuperAdminTenantsPage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') redirect('/dashboard')

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true } } },
  })

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
        <h1 className="text-2xl font-bold text-white">Schools</h1>
        <p className="text-gray-400">{tenants.length} registered institutions</p>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800">
        <div className="divide-y divide-gray-800">
          {tenants.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-white text-sm">{t.name}</p>
                <p className="text-xs text-gray-500">
                  {t.slug} · {t.country} · {t._count.users} users · cap: {t.studentCap}
                </p>
                <p className="text-xs text-gray-600">{t.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${planColors[t.plan] ?? ''}`}>{t.plan}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[t.status] ?? ''}`}>{t.status}</span>
                <span className="text-xs text-gray-600">{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
