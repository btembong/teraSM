'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@tera-sm/utils'
import { StepSchoolProfile } from './step-school-profile'
import { StepAcademicSetup } from './step-academic-setup'
import { StepInviteTeam } from './step-invite-team'
import { StepComplete } from './step-complete'
import type { SchoolProfileDto, AcademicSetupDto, InviteTeamDto } from '@tera-sm/types'

export type OnboardingData = {
  profile?: SchoolProfileDto
  academic?: AcademicSetupDto
  invites?: InviteTeamDto
}

const STEPS = [
  { id: 1, label: 'School Profile' },
  { id: 2, label: 'Academics' },
  { id: 3, label: 'Invite Team' },
  { id: 4, label: 'Done' },
]

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({})
  const [saving, setSaving] = useState(false)

  async function saveOnboarding(finalData: OnboardingData) {
    setSaving(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
        credentials: 'include',
      })
    } catch {
      // non-blocking — user can still proceed
    } finally {
      setSaving(false)
    }
  }

  function handleProfile(profile: SchoolProfileDto) {
    setData((d) => ({ ...d, profile }))
    setStep(2)
  }

  function handleAcademic(academic: AcademicSetupDto) {
    setData((d) => ({ ...d, academic }))
    setStep(3)
  }

  async function handleInvites(invites: InviteTeamDto) {
    const final = { ...data, invites }
    setData(final)
    await saveOnboarding(final)
    setStep(4)
  }

  async function handleSkipInvites() {
    await saveOnboarding(data)
    setStep(4)
  }

  function handleFinish() {
    router.push('/admin')
  }

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      {step < 4 && (
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Step {step} of 3</span>
            <span>{STEPS[step - 1]?.label}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100 + 33}%` }}
            />
          </div>
          {/* Step labels */}
          <div className="flex justify-between">
            {STEPS.slice(0, 3).map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    step >= s.id ? 'bg-blue-600' : 'bg-gray-200'
                  )}
                />
                <span
                  className={cn(
                    'text-xs',
                    step >= s.id ? 'text-blue-700 font-medium' : 'text-gray-400'
                  )}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {step === 1 && <StepSchoolProfile onNext={handleProfile} />}
      {step === 2 && (
        <StepAcademicSetup onNext={handleAcademic} onBack={() => setStep(1)} />
      )}
      {step === 3 && (
        <StepInviteTeam
          onNext={handleInvites}
          onSkip={handleSkipInvites}
          onBack={() => setStep(2)}
          saving={saving}
        />
      )}
      {step === 4 && <StepComplete onFinish={handleFinish} />}
    </div>
  )
}
