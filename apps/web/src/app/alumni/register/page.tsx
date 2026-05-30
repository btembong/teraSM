'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { GraduationCap, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 60 }, (_, i) => CURRENT_YEAR - i)

const EMPTY = {
  firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  graduationYear: '', degree: '', major: '',
  currentEmployer: '', currentRole: '', linkedIn: '', bio: '',
}

function AlumniRegisterForm() {
  const searchParams = useSearchParams()
  const school       = searchParams.get('school') ?? ''

  const [form, setForm]         = useState({ ...EMPTY, graduationYear: String(CURRENT_YEAR - 1) })
  const [showPwd, setShowPwd]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')
  const [step, setStep]         = useState<1 | 2>(1)
  const [schoolInfo, setSchoolInfo] = useState<{ name: string; logoUrl?: string; slug: string } | null>(null)
  const [schoolNotFound, setSchoolNotFound] = useState(false)

  useEffect(() => {
    if (!school) return
    fetch(`/api/public/tenant?slug=${encodeURIComponent(school)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSchoolInfo(data); else setSchoolNotFound(true) })
      .catch(() => setSchoolNotFound(true))
  }, [school])

  const f = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  function validateStep1() {
    if (!form.firstName.trim() || !form.lastName.trim()) return 'Please enter your full name.'
    if (!form.email.trim() || !form.email.includes('@')) return 'Please enter a valid email.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    if (!form.graduationYear) return 'Please enter your graduation year.'
    return ''
  }

  async function submit() {
    const err = validateStep1()
    if (err) { setError(err); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/alumni/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, school }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message ?? 'Registration failed.'); return }
      setDone(true)
    } catch { setError('Network error. Please try again.') }
    finally { setSaving(false) }
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  if (!school || schoolNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-500 text-sm">
            {!school
              ? 'This alumni registration link is missing a school identifier. Please use the link provided by your institution.'
              : 'The school in this link was not found. Please check the link and try again.'}
          </p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          {schoolInfo?.logoUrl && (
            <img src={schoolInfo.logoUrl} alt={schoolInfo.name} className="h-12 mx-auto mb-4 object-contain" />
          )}
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">You're in!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Your alumni profile for <strong>{schoolInfo?.name}</strong> has been created.
            Check your email for a welcome message, then log in to complete your profile.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
            Log in now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* School branding */}
        <div className="text-center mb-8">
          {schoolInfo?.logoUrl ? (
            <img src={schoolInfo.logoUrl} alt={schoolInfo.name} className="h-14 mx-auto mb-3 object-contain" />
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-3">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">
            {schoolInfo ? `${schoolInfo.name} Alumni Network` : 'Alumni Network'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create your alumni profile and connect with your community</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>1</div>
            <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
            <span className="text-xs text-gray-400 ml-1">{step === 1 ? 'Account' : 'Profile'}</span>
          </div>

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>First Name *</label>
                  <input className={inp} value={form.firstName} onChange={f('firstName')} placeholder="Jane" />
                </div>
                <div>
                  <label className={lbl}>Last Name *</label>
                  <input className={inp} value={form.lastName} onChange={f('lastName')} placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className={lbl}>Email Address *</label>
                <input className={inp} type="email" value={form.email} onChange={f('email')} placeholder="jane.doe@email.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Password *</label>
                  <div className="relative">
                    <input
                      className={`${inp} pr-10`}
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={f('password')}
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Confirm Password *</label>
                  <input className={inp} type="password" value={form.confirmPassword} onChange={f('confirmPassword')} placeholder="Repeat password" />
                </div>
              </div>
              <div>
                <label className={lbl}>Graduation Year *</label>
                <select className={inp} value={form.graduationYear} onChange={f('graduationYear')}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs text-gray-400">All fields below are optional — you can update them later from your profile.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Degree / Qualification</label>
                  <input className={inp} value={form.degree} onChange={f('degree')} placeholder="BSc, MBA, PhD…" />
                </div>
                <div>
                  <label className={lbl}>Major / Programme</label>
                  <input className={inp} value={form.major} onChange={f('major')} placeholder="Computer Science" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Current Employer</label>
                  <input className={inp} value={form.currentEmployer} onChange={f('currentEmployer')} placeholder="Google, Freelance…" />
                </div>
                <div>
                  <label className={lbl}>Current Role / Title</label>
                  <input className={inp} value={form.currentRole} onChange={f('currentRole')} placeholder="Senior Engineer" />
                </div>
              </div>
              <div>
                <label className={lbl}>LinkedIn URL</label>
                <input className={inp} value={form.linkedIn} onChange={f('linkedIn')} placeholder="https://linkedin.com/in/janedoe" />
              </div>
              <div>
                <label className={lbl}>Bio / About</label>
                <textarea className={`${inp} resize-none`} rows={3} value={form.bio} onChange={f('bio')} placeholder="Tell your community a bit about yourself…" />
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {step === 2 && (
              <button
                onClick={() => { setStep(1); setError('') }}
                className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Back
              </button>
            )}
            <button
              onClick={step === 1 ? () => { const e = validateStep1(); if (e) { setError(e); return } setError(''); setStep(2) } : submit}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {step === 1 ? 'Continue' : saving ? 'Creating Profile…' : 'Create Alumni Profile'}
              {step === 1 && !saving && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AlumniRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>}>
      <AlumniRegisterForm />
    </Suspense>
  )
}
