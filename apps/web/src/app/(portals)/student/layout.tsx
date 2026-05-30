import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PortalShell } from '@/components/ui/portal-shell'
import { ForceLight } from '@/components/layout/force-light'
import { PushNotificationRegister } from '@/components/push-notification-register'
import { OnboardingVideo } from '@/components/ui/onboarding-video'
import { ToastProvider } from '@/components/ui/toast'
import { LockScreenModal } from '@/components/ui/lock-screen'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const tenantId = (session.user as any).tenantId as string | undefined
  const tenant = tenantId
    ? await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, logoUrl: true, studentOnboardingVideoUrl: true },
      })
    : null

  return (
    <ForceLight>
      <ToastProvider>
        <PortalShell portal="student" accentColor="blue" user={session.user}>
          {children}
        </PortalShell>
        <PushNotificationRegister />
        <OnboardingVideo
          storageKey="tera_onboarding_student"
          title="Welcome to Tera SM"
          subtitle="Here's how your student portal works"
          videoSrc={(tenant as any)?.studentOnboardingVideoUrl ?? ''}
        />
        <LockScreenModal schoolName={tenant?.name ?? null} schoolLogo={tenant?.logoUrl ?? null} />
      </ToastProvider>
    </ForceLight>
  )
}
