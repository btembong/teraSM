'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, User, Phone, Calendar, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react'

type FormData = {
  phone: string
  dateOfBirth: string
  gender: string
  emergencyName: string
  emergencyPhone: string
  emergencyRelation: string
}

const STEPS = [
  { id: 1, label: 'Your Profile'   },
  { id: 2, label: 'Emergency Contact' },
  { id: 3, label: 'All Done'       },
]

export default function StudentOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormData>({
    phone: '',
    dateOfBirth: '',
    gender: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  })

  function set(field: keyof FormData, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function finish() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/student/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSaving(false)
        return
      }
      setStep(3)
    } catch {
      setError('Network error. Please try again.')
      setSaving(false)
    }
  }

  const progress = ((step - 1) / 2) * 100

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">Profile Setup</span>
        </div>

        {/* Progress */}
        {step < 3 && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Step {step} of 2</span>
              <span>{STEPS[step - 1]?.label}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progress + 50}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {STEPS.slice(0, 2).map(s => (
                <span key={s.id} className={`text-xs font-medium ${step >= s.id ? 'text-blue-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

          {/* ── Step 1: Profile ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Your profile</h2>
                <p className="text-sm text-gray-500">A few details so your school can reach you.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="+233 24 000 0000"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date of birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={e => set('dateOfBirth', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Gender
                </label>
                <select
                  value={form.gender}
                  onChange={e => set('gender', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Prefer not to say</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setStep(2)}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip this step
              </button>
            </div>
          )}

          {/* ── Step 2: Emergency Contact ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Emergency contact</h2>
                <p className="text-sm text-gray-500">Who should the school contact in an emergency?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mrs. Abena Mensah"
                  value={form.emergencyName}
                  onChange={e => set('emergencyName', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Relationship
                </label>
                <select
                  value={form.emergencyRelation}
                  onChange={e => set('emergencyRelation', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select relationship</option>
                  <option value="Parent">Parent</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="+233 24 000 0000"
                    value={form.emergencyPhone}
                    onChange={e => set('emergencyPhone', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={finish}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {saving ? 'Saving...' : 'Complete setup'}
                </button>
              </div>
              <button
                onClick={finish}
                disabled={saving}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip and finish
              </button>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Profile complete!</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Your profile is set up. Head to your dashboard to explore your
                  courses, results, timetable, and more.
                </p>
              </div>
              <div className="space-y-2 text-left bg-gray-50 rounded-2xl p-4">
                {[
                  'View your enrolled courses',
                  'Check your timetable',
                  'Download your student ID',
                  'Pay or check your fees',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push('/student')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
              >
                Go to my dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
