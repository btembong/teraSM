import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SidebarNav } from '@/components/ui/sidebar-nav'
import { ForceLight } from '@/components/layout/force-light'
import { CommandPalette } from '@/components/ui/command-palette'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Fetch school branding
  const tenant = session.user.tenantId
    ? await prisma.tenant.findUnique({
        where:  { id: session.user.tenantId },
        select: { name: true, logoUrl: true },
      })
    : null

  return (
    <ForceLight>
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col shadow-sm">
        <SidebarNav
          portal="admin"
          accentColor="blue"
          user={session.user}
          schoolName={tenant?.name ?? 'My School'}
          schoolLogo={tenant?.logoUrl ?? null}
        />
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 animate-in">{children}</div>
      </main>
    </div>
    <CommandPalette />
    </ForceLight>
  )
}
