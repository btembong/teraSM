import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Radio, Clock, CheckCircle, XCircle, Users, Video } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { SectionCard, SectionRow } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'

const statusStyle: Record<string, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700',
  LIVE:       'bg-blue-600 text-white',
  ENDED:      'bg-gray-100 text-gray-500',
  CANCELLED:  'bg-gray-100 text-gray-400',
}

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  SCHEDULED: Clock,
  LIVE:      Radio,
  ENDED:     CheckCircle,
  CANCELLED: XCircle,
}

export default async function StaffLiveClassesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const teacherId = (session.user as any).id
  const tenantId  = (session.user as any).tenantId

  const liveClasses = await prisma.liveClass.findMany({
    where: { tenantId, teacherId },
    include: {
      courseOffering: { include: { course: true } },
      _count: { select: { participants: true, recordings: true } },
    },
    orderBy: { scheduledAt: 'desc' },
    take: 50,
  })

  const live      = liveClasses.filter((c) => c.status === 'LIVE').length
  const scheduled = liveClasses.filter((c) => c.status === 'SCHEDULED').length

  return (
    <div className="space-y-7">
      <PageHeader
        title="My Live Classes"
        description="Manage and host your live class sessions."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Sessions" value={liveClasses.length} icon={Video} iconBg="bg-gray-100" iconColor="text-gray-500" />
        <StatCard label="Live Now" value={live} icon={Radio} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="Scheduled" value={scheduled} icon={Clock} iconBg="bg-blue-50" iconColor="text-blue-600" />
      </div>

      {/* Sessions */}
      <SectionCard title="All Sessions" icon={Video} iconColor="text-blue-500" noPadding>
        {liveClasses.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No live classes yet"
            description="Schedule your first live class from a course offering."
            iconBg="bg-blue-50"
            iconColor="text-blue-400"
          />
        ) : (
          <div>
            {liveClasses.map((lc) => {
              const StatusIcon = statusIcon[lc.status] ?? Clock
              const isLive = lc.status === 'LIVE'
              const isScheduled = lc.status === 'SCHEDULED'

              return (
                <SectionRow key={lc.id}>
                  <Link href={`/staff/live-classes/${lc.id}`} className="flex items-center justify-between w-full group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isLive ? 'bg-blue-50' : 'bg-gray-100'}`}>
                        <StatusIcon className={`w-4 h-4 ${isLive ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{lc.title}</p>
                        <p className="text-xs text-gray-400">
                          {lc.courseOffering.course.code} · {new Date(lc.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {lc.durationMins}min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3.5 h-3.5" />{lc._count.participants}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusStyle[lc.status] ?? ''}`}>
                        {lc.status}
                      </span>
                      {(isLive || isScheduled) && (
                        <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold text-white ${isLive ? 'bg-blue-600' : 'bg-blue-500'}`}>
                          {isLive ? 'Host Now' : 'Start'}
                        </span>
                      )}
                    </div>
                  </Link>
                </SectionRow>
              )
            })}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
