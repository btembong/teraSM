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
    STARTER:    'bg-gray-700 text-gray-200',
    PRO:        'bg-blue-900 text-blue-200',
    ENTERPRISE: 'bg-blue-800 text-blue-100',
    UNIVERSITY: 'bg-blue-950 text-blue-100',
  }

  const statusColors: Record<string, string> = {
    TRIAL:     'bg-indigo-900/50 text-indigo-300',
    ACTIVE:    'bg-emerald-900/50 text-emerald-300',
    SUSPENDED: 'bg-gray-700 text-gray-300',
    CANCELLED: 'bg-gray-800 text-gray-500',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Schools</h2>
        <p className="text-sm text-gray-400 mt-0.5">{tenants.length} registered institution{tenants.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-800">School</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-800">Country</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-800">Users</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-800">Cap</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-800">Plan</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-800">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {tenants.length === 0 && (
              <tr>
                <td colSpan={7} className="py-14 text-center text-sm text-gray-500">No schools registered yet.</td>
              </tr>
            )}
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-5 py-3.5 border-r border-gray-800">
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.slug}{t.email ? ` · ${t.email}` : ''}</p>
                </td>
                <td className="px-4 py-3.5 text-gray-400 text-xs border-r border-gray-800">{t.country ?? '—'}</td>
                <td className="px-4 py-3.5 text-center border-r border-gray-800">
                  <span className="font-semibold text-white">{t._count.users}</span>
                </td>
                <td className="px-4 py-3.5 text-center text-gray-400 border-r border-gray-800">{t.studentCap.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-center border-r border-gray-800">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${planColors[t.plan] ?? 'bg-gray-700 text-gray-300'}`}>
                    {t.plan}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center border-r border-gray-800">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[t.status] ?? 'bg-gray-700 text-gray-300'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-500">
                  {new Date(t.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
