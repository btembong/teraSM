'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  BookOpen, Clock, Users, X, Search, CheckCircle2,
  AlertCircle, Loader2, GraduationCap, Lock,
} from 'lucide-react'
import { NoActiveSemester } from '@/components/ui/no-active-semester'

// ── Types ─────────────────────────────────────────────────────────────────────
type EnrollmentStatus = 'ENROLLED' | 'WAITLISTED' | 'PENDING' | 'DROPPED'

type Offering = {
  id: string
  courseId: string
  courseCode: string
  courseTitle: string
  creditHours: number
  level: number
  department: string
  departmentCode: string
  teacherName: string
  maxStudents: number
  room: string | null
  enrolled: number
  enrollmentStatus?: EnrollmentStatus
  inMyProgramme: boolean
  isRequired: boolean | null
  programLevel: number | null
  prerequisites: string[]
  prerequisitesMet: boolean
  missingPrereqs: string[]
}

type Profile = {
  programName: string | null
  programCode: string | null
  level: number | null
} | null

type Data = {
  semester: { id: string; name: string; academicYear: string } | null
  profile: Profile
  enrolled: Offering[]
  available: Offering[]
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<EnrollmentStatus, { label: string; color: string }> = {
  ENROLLED:   { label: 'Enrolled',          color: 'bg-blue-50 text-blue-700 border-blue-100'     },
  WAITLISTED: { label: 'On Waitlist',       color: 'bg-amber-50 text-amber-700 border-amber-100'  },
  PENDING:    { label: 'Awaiting Approval', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  DROPPED:    { label: 'Dropped',           color: 'bg-gray-100 text-gray-500 border-gray-200'    },
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StudentCoursesPage() {
  const [data, setData]       = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState<string | null>(null)
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  // Available courses filters
  const [view, setView]             = useState<'programme' | 'all'>('programme')
  const [search, setSearch]         = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterLevel, setFilterLevel] = useState('')

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/student/courses')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function enroll(offeringId: string) {
    setBusy(offeringId)
    const res  = await fetch('/api/academics/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseOfferingId: offeringId }),
    })
    const body = await res.json()
    if (res.ok) {
      showToast(body.waitlisted ? 'Added to waitlist' : 'Registration submitted — awaiting admin approval', true)
      await load()
    } else {
      showToast(body.error ?? 'Enrollment failed', false)
    }
    setBusy(null)
  }

  async function drop(offeringId: string, status: EnrollmentStatus) {
    setBusy(offeringId)
    const res = await fetch(`/api/academics/enroll?courseOfferingId=${offeringId}`, { method: 'DELETE' })
    if (res.ok) {
      showToast(status === 'PENDING' ? 'Registration cancelled' : 'Course dropped', true)
      await load()
    } else {
      showToast('Action failed', false)
    }
    setBusy(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    </div>
  )

  if (!data?.semester) return <NoActiveSemester feature="Course registration" />

  const { semester, profile, enrolled, available } = data

  // Derived stats
  const enrolledCredits = enrolled
    .filter(o => o.enrollmentStatus === 'ENROLLED')
    .reduce((s, o) => s + o.creditHours, 0)

  const programmeCount = available.filter(o => o.inMyProgramme).length

  // Unique dept codes and levels for filter dropdowns
  const depts  = [...new Set(available.map(o => o.departmentCode))].sort()
  const levels = [...new Set(available.map(o => o.level))].sort((a, b) => a - b)

  // Filtered available list
  const filtered = available.filter(o => {
    if (view === 'programme' && !o.inMyProgramme) return false
    if (filterDept && o.departmentCode !== filterDept) return false
    if (filterLevel && String(o.level) !== filterLevel) return false
    if (search) {
      const q = search.toLowerCase()
      if (!o.courseCode.toLowerCase().includes(q) && !o.courseTitle.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium ${
          toast.ok ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Registration</h1>
          <p className="text-sm text-gray-500 mt-0.5">{semester.name} · {semester.academicYear}</p>
        </div>
        {profile && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <GraduationCap className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-indigo-900 leading-none">
                {profile.programName ?? 'No programme assigned'}
              </p>
              {profile.level && (
                <p className="text-xs text-indigo-500 mt-0.5">Level {profile.level}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-2xl font-bold text-gray-900">{enrolled.length}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Registered this semester</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-2xl font-bold text-blue-600">{enrolledCredits}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Credit hours confirmed</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-2xl font-bold text-gray-900">{available.length}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Available to register</p>
        </div>
      </div>

      {/* ── My Enrollments ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
          My Enrollments
          <span className="font-normal normal-case text-gray-400">({enrolled.length})</span>
        </h2>

        {enrolled.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-400">
            You have no courses registered for this semester yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {enrolled.map(o => {
              const statusCfg = STATUS_CONFIG[o.enrollmentStatus!]
              const isBusy    = busy === o.id
              return (
                <div key={o.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 hover:shadow-sm transition-all">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">{o.courseCode}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${statusCfg?.color ?? ''}`}>
                      {statusCfg?.label}
                    </span>
                  </div>

                  {/* Course info */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm leading-snug">{o.courseTitle}</p>
                    <p className="text-xs text-gray-400 mt-1">{o.department}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{o.teacherName}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{o.creditHours} cr</span>
                      {o.room && <span>{o.room}</span>}
                    </div>
                    <button
                      onClick={() => drop(o.id, o.enrollmentStatus!)}
                      disabled={isBusy}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                      {o.enrollmentStatus === 'PENDING' ? 'Cancel' : 'Drop'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Available to Register ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            Available to Register
          </h2>

          {/* Programme / All toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-0.5">
            <button
              onClick={() => setView('programme')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                view === 'programme' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Programme
              <span className="ml-1.5 text-gray-400">({programmeCount})</span>
            </button>
            <button
              onClick={() => setView('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                view === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Courses
              <span className="ml-1.5 text-gray-400">({available.length})</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex gap-2 flex-wrap mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by code or title…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {depts.length > 1 && (
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Departments</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          {levels.length > 1 && (
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Levels</option>
              {levels.map(l => <option key={l} value={String(l)}>Level {l}</option>)}
            </select>
          )}
        </div>

        {/* No programme warning */}
        {view === 'programme' && !profile?.programName && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-4 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-semibold">No programme assigned to your profile</p>
              <p className="text-xs mt-0.5 text-amber-600">Contact your registrar to assign a programme. Showing all courses instead.</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl">
            <BookOpen className="w-7 h-7 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {view === 'programme' && programmeCount === 0
                ? 'No courses found for your programme this semester.'
                : 'No courses match your filters.'}
            </p>
            {view === 'programme' && programmeCount === 0 && (
              <button onClick={() => setView('all')} className="mt-2 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                View all available courses →
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Course</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Lecturer</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Seats</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Type</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(o => {
                  const isFull     = o.maxStudents > 0 && o.enrolled >= o.maxStudents
                  const isBusy     = busy === o.id
                  const canEnroll  = o.prerequisitesMet
                  const spotsLeft  = o.maxStudents > 0 ? o.maxStudents - o.enrolled : null

                  return (
                    <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">

                      {/* Course */}
                      <td className="px-5 py-3.5 border-r border-gray-100">
                        <p className="font-semibold text-gray-900">{o.courseCode}</p>
                        <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{o.courseTitle}</p>
                        <p className="text-xs text-gray-300 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{o.creditHours} cr · Lvl {o.level}
                        </p>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 border-r border-gray-100">
                        <p className="text-xs text-gray-600">{o.department}</p>
                        <p className="text-xs font-mono text-gray-300">{o.departmentCode}</p>
                      </td>

                      {/* Lecturer */}
                      <td className="px-4 py-3.5 text-xs text-gray-500 border-r border-gray-100">
                        {o.teacherName}
                        {o.room && <p className="text-gray-300 mt-0.5">{o.room}</p>}
                      </td>

                      {/* Seats */}
                      <td className="px-4 py-3.5 text-center border-r border-gray-100">
                        {o.maxStudents > 0 ? (
                          <>
                            <p className={`text-sm font-bold ${isFull ? 'text-red-500' : 'text-gray-700'}`}>
                              {o.enrolled}/{o.maxStudents}
                            </p>
                            <p className={`text-xs mt-0.5 ${isFull ? 'text-amber-600' : 'text-gray-400'}`}>
                              {isFull ? 'Waitlist' : `${spotsLeft} left`}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">Open</span>
                        )}
                      </td>

                      {/* Type + prereq warning */}
                      <td className="px-4 py-3.5 border-r border-gray-100">
                        {o.inMyProgramme ? (
                          o.isRequired
                            ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">Required</span>
                            : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Elective</span>
                        ) : (
                          <span className="text-xs text-gray-300 italic">Other</span>
                        )}
                        {!o.prerequisitesMet && (
                          <div className="flex items-start gap-1 mt-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 max-w-[140px]">
                            <Lock className="w-2.5 h-2.5 flex-shrink-0 mt-0.5" />
                            <span>Needs: {o.missingPrereqs.join(', ')}</span>
                          </div>
                        )}
                      </td>

                      {/* Register button */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => canEnroll && !isBusy && enroll(o.id)}
                          disabled={isBusy || !canEnroll}
                          title={!canEnroll ? `Prerequisites not met: ${o.missingPrereqs.join(', ')}` : undefined}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                            !canEnroll
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : isFull
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isBusy
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : !canEnroll
                              ? <><Lock className="w-3 h-3" /> Locked</>
                              : isFull
                                ? 'Join Waitlist'
                                : 'Register'}
                        </button>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  )
}
