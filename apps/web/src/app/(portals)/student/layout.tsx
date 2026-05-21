import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SidebarNav } from '@/components/ui/sidebar-nav'
import { ForceLight } from '@/components/layout/force-light'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <ForceLight>
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col shadow-sm">
        <SidebarNav portal="student" accentColor="blue" user={session.user} />
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 animate-in">{children}</div>
      </main>
    </div>
    </ForceLight>
  )
}
