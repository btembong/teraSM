'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Shield, ShieldCheck, ShieldOff, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function SecuritySettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null)
  const [loading, setLoading]   = useState(true)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [saving, setSaving]     = useState(false)
  const [message, setMessage]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    // Fetch current 2FA status
    fetch('/api/profile/2fa/status')
      .then(r => r.json())
      .then(d => { setTwoFactorEnabled(d.twoFactorEnabled); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status, router])

  const handleToggle = async (action: 'enable' | 'disable') => {
    if (!password) { setMessage({ type: 'error', text: 'Please enter your password to confirm.' }); return }
    setSaving(true)
    setMessage(null)
    const res = await fetch('/api/profile/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, password }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setMessage({ type: 'error', text: data.error ?? 'Something went wrong.' })
    } else {
      setTwoFactorEnabled(data.twoFactorEnabled)
      setPassword('')
      setMessage({
        type: 'success',
        text: data.twoFactorEnabled
          ? 'Two-factor authentication enabled. You will receive an email code on your next login.'
          : 'Two-factor authentication has been disabled.',
      })
    }
  }

  const backHref = (() => {
    const role = (session?.user as any)?.role ?? ''
    if (role === 'STUDENT') return '/student'
    if (role === 'TEACHER') return '/staff'
    if (role === 'PARENT') return '/parent'
    return '/admin'
  })()

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <Link href={backHref} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="font-semibold text-gray-900 text-sm">Account Security</span>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">

          {/* 2FA status card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${twoFactorEnabled ? 'bg-green-50' : 'bg-gray-100'}`}>
                {twoFactorEnabled
                  ? <ShieldCheck className="w-6 h-6 text-green-600" />
                  : <Shield className="w-6 h-6 text-gray-400" />
                }
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {twoFactorEnabled
                    ? 'Active — a verification code will be emailed to you each time you sign in.'
                    : 'Not enabled — your account is protected by password only.'
                  }
                </p>
                <span className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 space-y-3">
              <p className="text-xs text-gray-500 font-medium">
                Confirm your password to {twoFactorEnabled ? 'disable' : 'enable'} 2FA
              </p>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your current password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 pl-4 pr-11 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {message && (
                <p className={`text-xs px-3 py-2 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                  {message.text}
                </p>
              )}

              {twoFactorEnabled ? (
                <button
                  onClick={() => handleToggle('disable')}
                  disabled={saving || !password}
                  className="w-full h-11 flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                  Disable Two-Factor Authentication
                </button>
              ) : (
                <button
                  onClick={() => handleToggle('enable')}
                  disabled={saving || !password}
                  className="w-full h-11 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Enable Two-Factor Authentication
                </button>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>How it works:</strong> When 2FA is enabled, after entering your password you will receive a 6-digit code by email. The code expires in 10 minutes.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}
