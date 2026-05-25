import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ModuleTabs } from '@/components/ui/module-tabs'
import { Users, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function InvitesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId as string | undefined

  const [userCount, inviteCount] = await Promise.all([
    tenantId ? prisma.user.count({ where: { tenantId, status: 'ACTIVE' } }) : 0,
    tenantId ? prisma.invite.count({ where: { tenantId, useCount: 0, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }) : 0,
  ])

  const tabs = [
    { label: 'All Users',   href: '/admin/students', badge: userCount },
    { label: 'Invitations', href: '/admin/invites',  badge: inviteCount },
  ]

  return (
    <div>
      <div className="mb-8 -mt-1">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Link href="/admin" className="hover:text-gray-600 transition-colors">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">Users & Access</span>
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Users & Access</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage students, staff, teachers and invitations</p>
          </div>
        </div>
        <ModuleTabs tabs={tabs} />
      </div>
      {children}
    </div>
  )
}
