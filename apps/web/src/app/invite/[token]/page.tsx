'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { CheckCircle2, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

interface InviteMeta {
  tenantName: string
  tenantLogo: string | null
  tenantSlug: string
  role: string
  email: string | null
  expiresAt: string | null
}

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Student', TEACHER: 'Teacher', STAFF: 'Staff',
  PARENT: 'Parent', REGISTRAR: 'Registrar',
  FINANCE_ADMIN: 'Finance Admin', HR_ADMIN: 'HR Admin', TENANT_ADMIN: 'School Admin',
}

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [meta, setMeta]       = useState<InviteMeta | null>(null)
  const [fetchError, setFetchError] = useState('')
  const [loading, setLoading] = useState(true)

  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setFetchError(d.error); return }
        setMeta(d)
        if (d.email) setEmail(d.email)
      })
      .catch(() => setFetchError('Failed to load invite. Please try again.'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!meta) return
    setSubmitting(true)
    setError('')

    const res = await fetch(`/api/invite/${token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, password, email }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setSubmitting(false)
      return
    }

    setDone(true)

    // Auto sign-in
    await signIn('credentials', {
      email: data.email,
      password,
      redirect: false,
    })

    setTimeout(() => router.push('/dashboard'), 1200)
  }

  const field = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-sm w-full bg-white rounded-3xl border border-gray-200 p-10 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invite unavailable</h1>
          <p className="text-sm text-gray-500">{fetchError}</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-sm w-full bg-white rounded-3xl border border-gray-200 p-10 text-center shadow-sm">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Account created!</h1>
          <p className="text-sm text-gray-500">Signing you in to {meta?.tenantName}…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">

        {/* School card */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 mb-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
            {meta?.tenantLogo
              ? <img src={meta.tenantLogo} alt={meta.tenantName} className="w-full h-full object-cover" />
              : <span className="text-blue-700 font-black text-2xl">{meta?.tenantName?.[0]}</span>
            }
          </div>
          <h1 className="text-lg font-black text-gray-900">{meta?.tenantName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            You've been invited to join as a{' '}
            <span className="font-semibold text-blue-600">{ROLE_LABELS[meta?.role ?? ''] ?? meta?.role}</span>
          </p>
        </div>

        {/* Registration form */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">First name</label>
                <input
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className={field}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Last name</label>
                <input
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className={field}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email address</label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={!!meta?.email} // locked if email-specific invite
                className={`${field} ${meta?.email ? 'bg-gray-50 text-gray-500' : ''}`}
                placeholder="you@example.com"
              />
              {meta?.email && (
                <p className="text-xs text-gray-400 mt-1">Email is locked for this invite.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
                  className={`${field} pr-10`}
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-all"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                : 'Create account & join'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 font-medium hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  )
}
