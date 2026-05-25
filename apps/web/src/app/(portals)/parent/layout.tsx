import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PortalShell } from '@/components/ui/portal-shell'
import { ForceLight } from '@/components/layout/force-light'
import { OnboardingVideo } from '@/components/ui/onboarding-video'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <ForceLight>
      <PortalShell portal="parent" accentColor="blue" user={session.user}>
        {children}
      </PortalShell>
      <OnboardingVideo
        storageKey="tera_onboarding_parent"
        title="Welcome, Parent"
        subtitle="How to track your child's progress"
        videoSrc=""
      />
    </ForceLight>
  )
}
