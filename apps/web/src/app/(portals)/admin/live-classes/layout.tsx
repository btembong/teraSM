import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ModuleTabs } from '@/components/ui/module-tabs'
import { Video, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function LiveClassesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId as string | undefined

  const [liveCount, scheduledCount] = await Promise.all([
    tenantId ? prisma.liveClass.count({ where: { tenantId, status: 'LIVE' } }) : 0,
    tenantId ? prisma.liveClass.count({ where: { tenantId, status: 'SCHEDULED' } }) : 0,
  ])

  const tabs = [
    { label: 'All Sessions',  href: '/admin/live-classes',           icon: 'Video',       group: 'overview' },
    { label: 'Live Now',      href: '/admin/live-classes/live',      icon: 'Radio',       badge: liveCount,       group: 'status' },
    { label: 'Scheduled',     href: '/admin/live-classes/scheduled', icon: 'CalendarDays', badge: scheduledCount, group: 'status' },
  ]

  return (
    <div>
      <div className="mb-8 -mt-1">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Link href="/admin" className="hover:text-gray-600 transition-colors">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">Live Classes</span>
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Video className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Live Classes</h1>
            <p className="text-sm text-gray-400 mt-0.5">Schedule, host, and review video class sessions</p>
          </div>
        </div>
        <ModuleTabs tabs={tabs} />
      </div>
      {children}
    </div>
  )
}
