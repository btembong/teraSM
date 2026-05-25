'use client'

import { useEffect, useState } from 'react'
import { User, Phone, Calendar, Save, CheckCircle, AlertCircle, Camera } from 'lucide-react'

type Profile = {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  avatarUrl: string
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', gender: '', avatarUrl: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/student/profile')
      .then(r => r.json())
      .then(data => {
        setProfile({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '',
          gender: data.gender ?? '',
          avatarUrl: data.avatarUrl ?? '',
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function set(field: keyof Profile, value: string) {
    setProfile(p => ({ ...p, [field]: value }))
    setStatus('idle')
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) {
        const d = await res.json()
        setErrorMsg(d.error ?? 'Failed to save.')
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Update your personal information</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border border-gray-100" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{initials || <User className="w-8 h-8" />}</span>
                </div>
              )}
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                <Camera className="w-3.5 h-3.5 text-gray-500" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Photo URL</label>
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={profile.avatarUrl}
                onChange={e => set('avatarUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Paste a direct link to your photo. File upload coming soon.</p>
            </div>
          </div>
        </div>

        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Personal Information</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">First name</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={e => set('firstName', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Last name</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={e => set('lastName', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact admin to update.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone number</span>
              </label>
              <input
                type="tel"
                placeholder="+233 24 000 0000"
                value={profile.phone}
                onChange={e => set('phone', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Date of birth</span>
              </label>
              <input
                type="date"
                value={profile.dateOfBirth}
                onChange={e => set('dateOfBirth', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender</label>
            <select
              value={profile.gender}
              onChange={e => set('gender', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </div>
        </div>

        {/* Status messages */}
        {status === 'success' && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Profile saved successfully.
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
