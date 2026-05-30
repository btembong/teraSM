'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'

export default function ChangePasswordPage() {
  const router  = useRouter()
  const [newPassword, setNewPassword]     = useState('')
  const [confirm, setConfirm]             = useState('')
  const [showNew, setShowNew]             = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')
  const [done, setDone]                   = useState(false)

  const strength = (() => {
    let s = 0
    if (newPassword.length >= 8)               s++
    if (/[A-Z]/.test(newPassword))             s++
    if (/[0-9]/.test(newPassword))             s++
    if (/[^A-Za-z0-9]/.test(newPassword))      s++
    return s
  })()
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-500'][strength]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (newPassword !== confirm) { setError('Passwords do not match.'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/user/change-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed. Please try again.'); return }
      setDone(true)
      // Re-login to get a fresh JWT without mustChangePassword
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow mb-4">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set your password</h1>
          <p className="text-sm text-gray-500 mt-1">
            You were given a temporary password. Please set a new one to continue.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7">
          {done ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-semibold text-gray-900">Password updated!</p>
              <p className="text-sm text-gray-500">Redirecting you to your dashboard…</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className={inp}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength meter */}
                {newPassword.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-gray-100'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">{strengthLabel}</p>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    className={`${inp} ${confirm && confirm !== newPassword ? 'border-red-300 focus:ring-red-400' : ''}`}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirm && confirm !== newPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <button type="submit" disabled={saving || !newPassword || !confirm}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors mt-2">
                {saving ? 'Saving…' : 'Set new password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <span className="font-semibold text-blue-600">Tera SM</span>
        </p>
      </div>
    </div>
  )
}
