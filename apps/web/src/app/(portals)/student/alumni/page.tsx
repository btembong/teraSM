'use client'

import { useEffect, useState } from 'react'
import {
  GraduationCap, Search, Briefcase,
  UserCheck, Loader2, MessageSquare, Users, Save, CheckCircle2, AlertCircle, User,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

interface AlumniProfile {
  id: string; userId: string; graduationYear: number
  degree?: string; major?: string; currentEmployer?: string
  currentRole?: string; linkedIn?: string; bio?: string
  user: { id: string; firstName: string; lastName: string; profilePicUrl?: string }
}
interface Mentorship {
  id: string; status: string; mentorId: string; message?: string; goals?: string
  createdAt: string
  mentor:  { id: string; firstName: string; lastName: string; profilePicUrl?: string }
  student: { id: string; firstName: string; lastName: string }
}

const MENTORSHIP_STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  ACTIVE:    'bg-green-100 text-green-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  DECLINED:  'bg-red-100 text-red-700',
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 60 }, (_, i) => CURRENT_YEAR - i)

const EMPTY_PROFILE = {
  graduationYear: String(CURRENT_YEAR - 1),
  degree: '', major: '', currentEmployer: '',
  currentRole: '', linkedIn: '', bio: '', isPublic: true,
}

export default function StudentAlumniPage() {
  const [alumni, setAlumni]           = useState<AlumniProfile[]>([])
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [myProfile, setMyProfile]     = useState<AlumniProfile | null>(null)
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState<'browse' | 'my-requests' | 'my-profile'>('browse')
  const [search, setSearch]           = useState('')
  const [requesting, setRequesting]   = useState<string | null>(null)
  const [requestMsg, setRequestMsg]   = useState<Record<string, string>>({})
  const [requestGoals, setRequestGoals] = useState<Record<string, string>>({})
  const [showModal, setShowModal]     = useState<AlumniProfile | null>(null)

  // Profile form
  const [profileForm, setProfileForm]   = useState(EMPTY_PROFILE)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function load() {
    setLoading(true)
    const [aRes, mRes] = await Promise.all([
      fetch(`/api/alumni?search=${encodeURIComponent(search)}`),
      fetch('/api/alumni/mentorship'),
    ])
    const [aData, mData] = await Promise.all([aRes.json(), mRes.json()])
    setAlumni(Array.isArray(aData) ? aData : [])
    setMentorships(Array.isArray(mData) ? mData : [])
    setLoading(false)
  }

  // Load own profile
  async function loadMyProfile() {
    const res  = await fetch('/api/alumni/me')
    if (res.ok) {
      const data = await res.json()
      setMyProfile(data)
      setProfileForm({
        graduationYear:  String(data.graduationYear ?? CURRENT_YEAR - 1),
        degree:          data.degree          ?? '',
        major:           data.major           ?? '',
        currentEmployer: data.currentEmployer ?? '',
        currentRole:     data.currentRole     ?? '',
        linkedIn:        data.linkedIn        ?? '',
        bio:             data.bio             ?? '',
        isPublic:        data.isPublic        ?? true,
      })
    }
  }

  useEffect(() => { load(); loadMyProfile() }, [])

  async function saveProfile() {
    if (!profileForm.graduationYear) {
      setProfileMsg({ type: 'err', text: 'Graduation year is required.' }); return
    }
    setSavingProfile(true); setProfileMsg(null)
    try {
      const res = await fetch('/api/alumni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileForm,
          graduationYear: Number(profileForm.graduationYear),
          isPublic: profileForm.isPublic,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setProfileMsg({ type: 'err', text: data.message ?? 'Save failed.' }); return }
      setMyProfile(data)
      setProfileMsg({ type: 'ok', text: 'Profile saved! You now appear in the alumni directory.' })
    } catch { setProfileMsg({ type: 'err', text: 'Network error.' }) }
    finally { setSavingProfile(false) }
  }

  async function requestMentorship(mentorId: string) {
    setRequesting(mentorId)
    try {
      const res = await fetch('/api/alumni/mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId,
          message: requestMsg[mentorId]?.trim() || null,
          goals:   requestGoals[mentorId]?.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.message ?? 'Request failed.'); return }
      setMentorships(prev => [data, ...prev])
      setShowModal(null)
    } catch { alert('Network error.') }
    finally { setRequesting(null) }
  }

  const filtered = alumni.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      `${a.user.firstName} ${a.user.lastName}`.toLowerCase().includes(q) ||
      a.major?.toLowerCase().includes(q) ||
      a.currentEmployer?.toLowerCase().includes(q) ||
      a.currentRole?.toLowerCase().includes(q)
    )
  })

  const myMentorIds = new Set(
    mentorships.filter(m => ['PENDING', 'ACTIVE'].includes(m.status)).map(m => m.mentorId)
  )

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alumni Network</h1>
        <p className="text-gray-500 text-sm">Connect with alumni mentors and build your career network</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {([
          { key: 'browse',      label: 'Browse Alumni' },
          { key: 'my-requests', label: `My Requests (${mentorships.length})` },
          { key: 'my-profile',  label: myProfile ? '✓ My Profile' : 'Register as Alumni' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Browse tab ── */}
      {tab === 'browse' && (
        <>
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-white max-w-md">
            <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <input
              className="flex-1 text-sm outline-none"
              placeholder="Search by name, major, employer…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse space-y-3">
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100" />
                    <div className="space-y-1 flex-1">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No alumni found"
              description="Try a different search or check back later."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(a => {
                const hasRequest = myMentorIds.has(a.userId)
                const initials = `${a.user.firstName[0]}${a.user.lastName[0]}`.toUpperCase()
                return (
                  <div key={a.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      {a.user.profilePicUrl ? (
                        <img src={a.user.profilePicUrl} alt={initials} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">{initials}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{a.user.firstName} {a.user.lastName}</p>
                        <p className="text-xs text-gray-400">Class of {a.graduationYear}</p>
                        {a.degree && <p className="text-xs text-gray-500">{a.degree}{a.major ? ` · ${a.major}` : ''}</p>}
                      </div>
                    </div>

                    {(a.currentRole || a.currentEmployer) && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{[a.currentRole, a.currentEmployer].filter(Boolean).join(' at ')}</span>
                      </div>
                    )}

                    {a.bio && <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{a.bio}</p>}

                    <div className="mt-auto pt-2">
                      <button
                        onClick={() => setShowModal(a)}
                        disabled={hasRequest}
                        className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-colors ${
                          hasRequest
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {hasRequest ? <UserCheck className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                        {hasRequest ? 'Requested' : 'Request Mentorship'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── My Requests tab ── */}
      {tab === 'my-requests' && (
        mentorships.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No mentorship requests yet"
            description="Browse alumni and send a mentorship request to get started."
          />
        ) : (
          <div className="space-y-3">
            {mentorships.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {m.mentor.firstName[0]}{m.mentor.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{m.mentor.firstName} {m.mentor.lastName}</p>
                    <p className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${MENTORSHIP_STATUS_STYLES[m.status]}`}>
                    {m.status}
                  </span>
                </div>
                {m.message && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Your message</p>
                    <p className="text-sm text-gray-700">{m.message}</p>
                  </div>
                )}
                {m.goals && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Goals</p>
                    <p className="text-sm text-gray-700">{m.goals}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ── My Profile tab ── */}
      {tab === 'my-profile' && (
        <div className="max-w-xl space-y-5">
          {!myProfile && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Register as an Alumni</p>
                  <p className="text-sm text-blue-700 mt-0.5">
                    Have you graduated? Fill in your profile to join the alumni directory and become available as a mentor for current students.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">{myProfile ? 'Edit My Alumni Profile' : 'Create Alumni Profile'}</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={lbl}>Graduation Year *</label>
                <select
                  className={inp}
                  value={profileForm.graduationYear}
                  onChange={e => setProfileForm(f => ({ ...f, graduationYear: e.target.value }))}
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Degree / Qualification</label>
                <input className={inp} value={profileForm.degree} onChange={e => setProfileForm(f => ({ ...f, degree: e.target.value }))} placeholder="BSc, MBA, PhD…" />
              </div>
              <div>
                <label className={lbl}>Major / Programme</label>
                <input className={inp} value={profileForm.major} onChange={e => setProfileForm(f => ({ ...f, major: e.target.value }))} placeholder="Computer Science" />
              </div>
              <div>
                <label className={lbl}>Current Employer</label>
                <input className={inp} value={profileForm.currentEmployer} onChange={e => setProfileForm(f => ({ ...f, currentEmployer: e.target.value }))} placeholder="Google, Freelance…" />
              </div>
              <div>
                <label className={lbl}>Current Role / Title</label>
                <input className={inp} value={profileForm.currentRole} onChange={e => setProfileForm(f => ({ ...f, currentRole: e.target.value }))} placeholder="Senior Engineer" />
              </div>
              <div className="col-span-2">
                <label className={lbl}>LinkedIn URL</label>
                <input className={inp} value={profileForm.linkedIn} onChange={e => setProfileForm(f => ({ ...f, linkedIn: e.target.value }))} placeholder="https://linkedin.com/in/yourprofile" />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Bio</label>
                <textarea className={`${inp} resize-none`} rows={3} value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell students about your career journey…" />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={profileForm.isPublic}
                    onChange={e => setProfileForm(f => ({ ...f, isPublic: e.target.checked }))}
                    className="rounded"
                  />
                  Make my profile visible to current students
                </label>
              </div>
            </div>

            {profileMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${profileMsg.type === 'ok' ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {profileMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {profileMsg.text}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {myProfile ? 'Save Changes' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request mentorship modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                Request Mentorship from {showModal.user.firstName} {showModal.user.lastName}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={lbl}>Introduction message</label>
                <textarea
                  className={`${inp} resize-none`}
                  rows={3}
                  placeholder="Introduce yourself and why you're reaching out…"
                  value={requestMsg[showModal.userId] ?? ''}
                  onChange={e => setRequestMsg(prev => ({ ...prev, [showModal.userId]: e.target.value }))}
                />
              </div>
              <div>
                <label className={lbl}>Mentorship goals</label>
                <textarea
                  className={`${inp} resize-none`}
                  rows={2}
                  placeholder="What do you hope to achieve through this mentorship?"
                  value={requestGoals[showModal.userId] ?? ''}
                  onChange={e => setRequestGoals(prev => ({ ...prev, [showModal.userId]: e.target.value }))}
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button
                onClick={() => requestMentorship(showModal.userId)}
                disabled={requesting === showModal.userId}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
              >
                {requesting === showModal.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
