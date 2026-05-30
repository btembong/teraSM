'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, User, Phone, Calendar, ChevronRight, ChevronLeft, Check, AlertCircle, BookOpen } from 'lucide-react'

type FormData = {
  phone: string
  dateOfBirth: string
  gender: string
  emergencyName: string
  emergencyPhone: string
  emergencyRelation: string
}

type StudentInfo = {
  firstName: string
  studentId: string
  program: string | null
  level: number
}

const STEPS = [
  { id: 1, label: 'Your Profile' },
  { id: 2, label: 'Emergency Contact' },
  { id: 3, label: 'Your Programme' },
]

const inp = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

export default function StudentOnboardingPage() {
  const router = useRouter()
  const [step, setSt]   = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [info, setInfo]     = useState<StudentInfo | null>(null)
  const [done, setDone]     = useState(false)

  const [form, setForm] = useState<FormData>({
    phone: '', dateOfBirth: '', gender: '',
    emergencyName: '', emergencyPhone: '', emergencyRelation: '',
  })

  useEffect(() => {
    // Fetch own student profile info to display on step 3
    fetch('/api/student/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setInfo({
          firstName: d.firstName,
          studentId: d.studentProfile?.studentId ?? '—',
          program:   d.studentProfile?.program?.name ?? null,
          level:     d.studentProfile?.level ?? 100,
        })
      })
      .catch(() => {})
  }, [])

  function set(field: keyof FormData, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function finish() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/student/onboarding', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong.')
        return
      }
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

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
        {!done && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Step {step} of {STEPS.length}</span>
              <span>{STEPS[step - 1]?.label}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress + (100 / STEPS.length)}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              {STEPS.map(s => (
                <span key={s.id} className={`text-xs font-medium ${step >= s.id ? 'text-blue-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

          {/* ── Step 1: Profile ── */}
          {!done && step === 1 && (
            <div className="space-y-5">
              <div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Your profile</h2>
                <p className="text-sm text-gray-500">A few details so your school can reach you.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" placeholder="+233 24 000 0000" value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" value={form.dateOfBirth}
                    onChange={e => set('dateOfBirth', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inp}>
                  <option value="">Prefer not to say</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <button onClick={() => setSt(2)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => setSt(2)} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Skip this step
              </button>
            </div>
          )}

          {/* ── Step 2: Emergency Contact ── */}
          {!done && step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Emergency contact</h2>
                <p className="text-sm text-gray-500">Who should the school contact in an emergency?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                <input type="text" placeholder="e.g. Mrs. Abena Mensah" value={form.emergencyName}
                  onChange={e => set('emergencyName', e.target.value)} className={inp} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship</label>
                <select value={form.emergencyRelation} onChange={e => set('emergencyRelation', e.target.value)} className={inp}>
                  <option value="">Select relationship</option>
                  <option value="Parent">Parent</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" placeholder="+233 24 000 0000" value={form.emergencyPhone}
                    onChange={e => set('emergencyPhone', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setSt(1)}
                  className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => setSt(3)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button onClick={() => setSt(3)} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Skip this step
              </button>
            </div>
          )}

          {/* ── Step 3: Programme Confirmation ── */}
          {!done && step === 3 && (
            <div className="space-y-5">
              <div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Your programme</h2>
                <p className="text-sm text-gray-500">Confirm the details the admissions office has assigned to you.</p>
              </div>

              <div className="bg-blue-50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-500 font-medium uppercase tracking-wide">Student ID</span>
                  <span className="font-bold text-blue-900 font-mono">{info?.studentId ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-500 font-medium uppercase tracking-wide">Programme</span>
                  <span className="font-semibold text-blue-900">{info?.program ?? 'Not yet assigned'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-500 font-medium uppercase tracking-wide">Level</span>
                  <span className="font-semibold text-blue-900">{info?.level ?? 100} Level</span>
                </div>
              </div>

              {!info?.program && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  Your programme hasn&apos;t been assigned yet. Contact the admissions office if this doesn&apos;t change within 24 hours.
                </div>
              )}

              <p className="text-xs text-gray-400">
                If any of these details are incorrect, contact the registrar&apos;s office before proceeding.
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setSt(2)}
                  className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={finish} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors">
                  {saving ? 'Saving…' : 'Complete setup'}
                </button>
              </div>
            </div>
          )}

          {/* ── Done ── */}
          {done && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Profile complete!</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Your profile is set up. Head to your dashboard to explore your courses, results, timetable, and more.
                </p>
              </div>
              <div className="space-y-2 text-left bg-gray-50 rounded-2xl p-4">
                {['View your enrolled courses', 'Check your timetable', 'Download your student ID', 'Pay or check your fees'].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/student')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">
                Go to my dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
