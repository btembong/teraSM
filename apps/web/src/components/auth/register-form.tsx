'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import {
  SchoolInfoSchema,
  AdminAccountSchema,
  type SchoolInfoDto,
  type AdminAccountDto,
} from '@tera-sm/types'
import { cn, slugify } from '@tera-sm/utils'
import { CheckCircle2, ChevronRight, ChevronLeft, Building2, User } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'School Info', icon: Building2 },
  { id: 2, label: 'Your Account', icon: User },
]

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'UG', name: 'Uganda' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'OTHER', name: 'Other' },
]

export function RegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schoolData, setSchoolData] = useState<SchoolInfoDto | null>(null)

  const schoolForm = useForm<SchoolInfoDto>({
    resolver: zodResolver(SchoolInfoSchema),
    defaultValues: { schoolName: '', slug: '', country: '', plan: 'STARTER' },
  })

  const adminForm = useForm<AdminAccountDto>({
    resolver: zodResolver(AdminAccountSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  })

  // Auto-generate slug from school name
  function handleSchoolNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    schoolForm.setValue('schoolName', e.target.value)
    if (!schoolForm.getValues('slug') || schoolForm.getValues('slug') === slugify(schoolForm.getValues('schoolName'))) {
      schoolForm.setValue('slug', slugify(e.target.value))
    }
  }

  async function onSchoolSubmit(data: SchoolInfoDto) {
    setSchoolData(data)
    setStep(2)
  }

  async function onAdminSubmit(data: AdminAccountDto) {
    if (!schoolData) return
    setLoading(true)
    setError(null)

    // Strip confirmPassword — UI-only field, not accepted by the API
    const { confirmPassword: _, ...adminPayload } = data

    try {
      const res = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school: schoolData, admin: adminPayload }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.message ?? 'Registration failed. Please try again.')
        setLoading(false)
        return
      }

      // Auto sign in after registration
      await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      router.push('/onboarding')
    } catch {
      setError('Could not connect to server. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-3">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all',
                  step > s.id
                    ? 'bg-green-500 text-white'
                    : step === s.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  step === s.id ? 'text-gray-900' : 'text-gray-400'
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('h-px w-8', step > s.id ? 'bg-green-500' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: School Info */}
      {step === 1 && (
        <form onSubmit={schoolForm.handleSubmit(onSchoolSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">School / Institution Name</label>
            <input
              {...schoolForm.register('schoolName')}
              onChange={handleSchoolNameChange}
              placeholder="e.g. Greenfield Academy"
              className={inputClass(!!schoolForm.formState.errors.schoolName)}
            />
            {schoolForm.formState.errors.schoolName && (
              <p className="text-xs text-red-500">{schoolForm.formState.errors.schoolName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Subdomain</label>
            <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <input
                {...schoolForm.register('slug')}
                placeholder="greenfield"
                className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
              />
              <span className="bg-gray-50 px-3 py-2.5 text-sm text-gray-400 border-l border-gray-200">.terasms.com</span>
            </div>
            {schoolForm.formState.errors.slug && (
              <p className="text-xs text-red-500">{schoolForm.formState.errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Country</label>
            <select
              {...schoolForm.register('country')}
              className={inputClass(!!schoolForm.formState.errors.country)}
            >
              <option value="">Select your country</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            {schoolForm.formState.errors.country && (
              <p className="text-xs text-red-500">{schoolForm.formState.errors.country.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Plan</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'STARTER', label: 'Starter', desc: 'Up to 500 students' },
                { value: 'PRO', label: 'Pro', desc: 'Up to 3,000 students' },
              ].map((p) => (
                <label
                  key={p.value}
                  className={cn(
                    'flex cursor-pointer flex-col rounded-xl border p-3 transition-all',
                    schoolForm.watch('plan') === p.value
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'hover:border-blue-200'
                  )}
                >
                  <input type="radio" {...schoolForm.register('plan')} value={p.value} className="sr-only" />
                  <span className="font-semibold text-sm">{p.label}</span>
                  <span className="text-xs text-gray-400">{p.desc}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              All plans include a 14-day free trial. Upgrade anytime.
            </p>
          </div>

          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* Step 2: Admin Account */}
      {step === 2 && (
        <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">First Name</label>
              <input
                {...adminForm.register('firstName')}
                placeholder="John"
                className={inputClass(!!adminForm.formState.errors.firstName)}
              />
              {adminForm.formState.errors.firstName && (
                <p className="text-xs text-red-500">{adminForm.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Last Name</label>
              <input
                {...adminForm.register('lastName')}
                placeholder="Doe"
                className={inputClass(!!adminForm.formState.errors.lastName)}
              />
              {adminForm.formState.errors.lastName && (
                <p className="text-xs text-red-500">{adminForm.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Work Email</label>
            <input
              {...adminForm.register('email')}
              type="email"
              placeholder="admin@greenfield.edu"
              className={inputClass(!!adminForm.formState.errors.email)}
            />
            {adminForm.formState.errors.email && (
              <p className="text-xs text-red-500">{adminForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <input
              {...adminForm.register('password')}
              type="password"
              placeholder="Min. 8 characters"
              className={inputClass(!!adminForm.formState.errors.password)}
            />
            {adminForm.formState.errors.password && (
              <p className="text-xs text-red-500">{adminForm.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Confirm Password</label>
            <input
              {...adminForm.register('confirmPassword')}
              type="password"
              placeholder="Repeat password"
              className={inputClass(!!adminForm.formState.errors.confirmPassword)}
            />
            {adminForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-500">{adminForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating your account...' : 'Create School Account'}
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <a href="/login" className="font-medium text-blue-600 hover:underline">Sign in</a>
      </p>
    </div>
  )
}

function inputClass(hasError: boolean) {
  return cn(
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition',
    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    hasError && 'border-red-400'
  )
}
