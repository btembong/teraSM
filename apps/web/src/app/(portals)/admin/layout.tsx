import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SidebarNav } from '@/components/ui/sidebar-nav'
import { ForceLight } from '@/components/layout/force-light'
import { CommandPalette } from '@/components/ui/command-palette'
import { AdminTopBar } from '@/components/ui/admin-top-bar'
import { OnboardingVideo } from '@/components/ui/onboarding-video'
import { ToastProvider } from '@/components/ui/toast'
import { AdminOnboardingTour } from '@/components/ui/onboarding-tour'
import { LockScreenModal } from '@/components/ui/lock-screen'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const tenantId = (session.user as any).tenantId as string | undefined

  const [tenant, currentSemester] = await Promise.all([
    tenantId
      ? prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, logoUrl: true } })
      : null,
    tenantId
      ? prisma.semester.findFirst({
          where: { isCurrent: true, academicYear: { tenantId } },
          select: { name: true, academicYear: { select: { name: true } } },
        })
      : null,
  ])

  const user = session.user as any
  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Admin'
  const semesterLabel = currentSemester
    ? `${currentSemester.academicYear.name} · ${currentSemester.name}`
    : undefined

  return (
    <ForceLight>
    <ToastProvider>
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside data-tour="sidebar" className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col shadow-sm">
        <SidebarNav
          portal="admin"
          accentColor="blue"
          user={session.user}
          schoolName={tenant?.name ?? 'My School'}
          schoolLogo={tenant?.logoUrl ?? null}
        />
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopBar
          userName={userName}
          userEmail={user.email ?? ''}
          semester={semesterLabel}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-6 animate-in">{children}</div>
        </main>
      </div>
    </div>
    <CommandPalette />
    <AdminOnboardingTour />
    <LockScreenModal schoolName={tenant?.name ?? null} schoolLogo={tenant?.logoUrl ?? null} />
    <OnboardingVideo
      storageKey="tera_onboarding_admin"
      title="Welcome to your Admin Panel"
      subtitle="Quick 2-min tour to get started"
      videoSrc={process.env.ADMIN_ONBOARDING_VIDEO_URL ?? ''}
    />
    </ToastProvider>
    </ForceLight>
  )
}
