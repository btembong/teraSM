import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Set up your school' }

export default function OnboardingPage() {
  return <OnboardingWizard />
}
