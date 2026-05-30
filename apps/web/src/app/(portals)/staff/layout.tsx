import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PortalShell } from '@/components/ui/portal-shell'
import { ForceLight } from '@/components/layout/force-light'
import { OnboardingVideo } from '@/components/ui/onboarding-video'
import { ToastProvider } from '@/components/ui/toast'
import { LockScreenModal } from '@/components/ui/lock-screen'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const tenantId = (session.user as any).tenantId as string | undefined
  const tenant = tenantId
    ? await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, logoUrl: true, staffOnboardingVideoUrl: true },
      })
    : null

  return (
    <ForceLight>
      <ToastProvider>
        <PortalShell portal="staff" accentColor="blue" user={session.user}>
          {children}
        </PortalShell>
        <OnboardingVideo
          storageKey="tera_onboarding_staff"
          title="Welcome, Staff"
          subtitle="Quick guide to your staff portal"
          videoSrc={(tenant as any)?.staffOnboardingVideoUrl ?? ''}
        />
        <LockScreenModal schoolName={tenant?.name ?? null} schoolLogo={tenant?.logoUrl ?? null} />
      </ToastProvider>
    </ForceLight>
  )
}
