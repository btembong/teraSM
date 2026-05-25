import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Video, Users, Clock, CheckCircle, XCircle, Radio } from 'lucide-react'
import { getActiveSemester } from '@/lib/active-semester'
import { NoActiveSemester } from '@/components/ui/no-active-semester'

const statusColor: Record<string, string> = {
  SCHEDULED: 'bg-indigo-50 text-indigo-700',
  LIVE: 'bg-indigo-600 text-white',
  ENDED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-gray-100 text-gray-400',
}

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  SCHEDULED: Clock,
  LIVE: Radio,
  ENDED: CheckCircle,
  CANCELLED: XCircle,
}

export default async function AdminLiveClassesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const activeSemester = await getActiveSemester(tenantId)
  if (!activeSemester) return <NoActiveSemester feature="Live class management" />

  const [liveClasses, stats] = await Promise.all([
    prisma.liveClass.findMany({
      where: { tenantId },
      include: {
        courseOffering: { include: { course: true } },
        _count: { select: { participants: true, recordings: true } },
      },
      orderBy: { scheduledAt: 'desc' },
      take: 50,
    }),
    prisma.liveClass.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    }),
  ])

  const statMap = Object.fromEntries(stats.map((s) => [s.status, s._count]))
  const total = liveClasses.length
  const live = statMap['LIVE'] ?? 0
  const scheduled = statMap['SCHEDULED'] ?? 0
  const ended = statMap['ENDED'] ?? 0

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Sessions', value: total, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Video },
          { label: 'Live Now', value: live, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Radio },
          { label: 'Scheduled', value: scheduled, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Clock },
          { label: 'Completed', value: ended, color: 'text-gray-600', bg: 'bg-gray-100', icon: CheckCircle },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Live classes list */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Sessions</h2>
        </div>
        {liveClasses.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No live classes scheduled yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {liveClasses.map((lc) => {
              const StatusIcon = statusIcon[lc.status] ?? Clock
              return (
                <div key={lc.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-5 h-5 ${lc.status === 'LIVE' ? 'text-indigo-600 animate-pulse' : 'text-gray-400'}`} />
                    <div>
                      <p className="font-medium text-gray-900">{lc.title}</p>
                      <p className="text-sm text-gray-500">
                        {lc.courseOffering.course.title} · {new Date(lc.scheduledAt).toLocaleString()} · {lc.durationMins}min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Users className="w-4 h-4" />
                      {lc._count.participants}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[lc.status] ?? ''}`}>
                      {lc.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
