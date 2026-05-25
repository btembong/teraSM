'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  BookOpen, Search, Filter, Users, Clock, AlertTriangle,
  CheckCircle, AlertCircle, Plus, Minus, ChevronDown, MapPin,
} from 'lucide-react'
import Link from 'next/link'

type ScheduleSlot = { day: string; startTime: string; endTime: string }

type Course = {
  id: string
  code: string
  title: string
  description: string | null
  creditHours: number
  level: number
  department: string
  departmentId: string
  faculty: string | null
  facultyId: string | null
  teacher: string
  room: string | null
  schedule: ScheduleSlot[]
  enrolled: number
  maxStudents: number
  seats: number
  isFull: boolean
  alreadyEnrolled: boolean
  clash: boolean
  missingPrereqs: string[]
  wouldExceedLimit: boolean
  canRegister: boolean
  canWaitlist: boolean
}

type CatalogData = {
  semester: { id: string; name: string; academicYear: string; maxCreditsPerStudent: number; registrationClose?: string | null; addDropDeadline?: string | null } | null
  courses: Course[]
  enrolledCredits: number
  feeClearance: boolean
  registrationStatus: 'OPEN' | 'CLOSED' | 'NOT_OPEN'
  addDropOpen: boolean
  myEnrollments: { id: string; offeringId: string; status: string; waitlistPosition: number | null }[]
}

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const DAY_SHORT: Record<string, string> = {
  MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat',
}

export default function RegistrationPage() {
  const [data, setData] = useState<CatalogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [facultyFilter, setFacultyFilter] = useState('ALL')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [levelFilter, setLevelFilter] = useState('ALL')
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [dropping, setDropping] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/student/registration/catalog')
    const d = await res.json()
    setData(d)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function enroll(offeringId: string) {
    setEnrolling(offeringId)
    const res = await fetch('/api/student/registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offeringId }),
    })
    const d = await res.json()
    if (!res.ok) {
      showToast(d.error ?? 'Failed to enroll', 'error')
    } else {
      showToast(d.status === 'WAITLISTED' ? 'Added to waitlist' : 'Successfully enrolled!', 'success')
      load()
    }
    setEnrolling(null)
  }

  async function drop(offeringId: string) {
    setDropping(offeringId)
    const res = await fetch('/api/student/registration', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offeringId }),
    })
    const d = await res.json()
    if (!res.ok) {
      showToast(d.error ?? 'Failed to drop', 'error')
    } else {
      showToast('Course dropped successfully', 'success')
      load()
    }
    setDropping(null)
  }

  const faculties = useMemo(() => {
    if (!data) return []
    const set = new Set(data.courses.map(c => c.faculty).filter(Boolean) as string[])
    return set.size > 0 ? ['ALL', ...Array.from(set).sort()] : []
  }, [data])

  const departments = useMemo(() => {
    if (!data) return []
    const set = new Set(
      data.courses
        .filter(c => facultyFilter === 'ALL' || c.faculty === facultyFilter)
        .map(c => c.department)
    )
    return ['ALL', ...Array.from(set).sort()]
  }, [data, facultyFilter])

  const filtered = useMemo(() => {
    if (!data) return []
    return data.courses.filter(c => {
      if (search && !`${c.code} ${c.title} ${c.teacher}`.toLowerCase().includes(search.toLowerCase())) return false
      if (facultyFilter !== 'ALL' && c.faculty !== facultyFilter) return false
      if (deptFilter !== 'ALL' && c.department !== deptFilter) return false
      if (levelFilter !== 'ALL' && String(c.level) !== levelFilter) return false
      if (showEnrolledOnly && !c.alreadyEnrolled) return false
      return true
    })
  }, [data, search, facultyFilter, deptFilter, levelFilter, showEnrolledOnly])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data?.semester) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Course Registration</h1>
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-500">No active semester</p>
          <p className="text-sm text-gray-400 mt-1">Registration opens when your school activates a semester.</p>
        </div>
      </div>
    )
  }

  const { semester, enrolledCredits, feeClearance, registrationStatus, myEnrollments } = data
  const myEnrolledCount = myEnrollments.filter(e => e.status === 'ENROLLED').length

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4" />
            : <AlertCircle className="w-4 h-4" />
          }
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Registration</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {semester.name} — {semester.academicYear}
          </p>
        </div>
        <Link href="/student/registration/my-courses"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
          <BookOpen className="w-4 h-4" />
          My Registrations ({myEnrolledCount})
        </Link>
      </div>

      {/* Status bar */}
      <div className={`flex flex-wrap gap-4 px-5 py-4 rounded-2xl border text-sm ${
        registrationStatus === 'OPEN'
          ? 'bg-blue-50 border-blue-100'
          : 'bg-yellow-50 border-yellow-100'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${registrationStatus === 'OPEN' ? 'bg-blue-500' : 'bg-yellow-500'}`} />
          <span className={`font-semibold ${registrationStatus === 'OPEN' ? 'text-blue-700' : 'text-yellow-700'}`}>
            Registration {registrationStatus === 'OPEN' ? 'Open' : registrationStatus === 'CLOSED' ? 'Closed' : 'Not Open Yet'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <BookOpen className="w-4 h-4" />
          <span>{enrolledCredits} / {semester.maxCreditsPerStudent} credit hours enrolled</span>
        </div>
        <div className={`flex items-center gap-2 ${feeClearance ? 'text-blue-700' : 'text-red-600'}`}>
          {feeClearance
            ? <><CheckCircle className="w-4 h-4" /> Fees cleared</>
            : <><AlertTriangle className="w-4 h-4" /> <Link href="/student/fees" className="underline font-medium">Fees outstanding — pay to register</Link></>
          }
        </div>
        {semester.registrationClose && (
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Registration closes {new Date(semester.registrationClose).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
        {data.addDropOpen && semester.addDropDeadline && (
          <div className="flex items-center gap-2 text-gray-500">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span>Add/drop deadline: <span className="font-semibold text-yellow-700">{new Date(semester.addDropDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></span>
          </div>
        )}
      </div>

      {/* Credit progress */}
      <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Credit hours this semester</span>
          <span className="font-semibold text-gray-900">{enrolledCredits} / {semester.maxCreditsPerStudent}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${Math.min((enrolledCredits / semester.maxCreditsPerStudent) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses, lecturers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {faculties.length > 1 && (
          <select
            value={facultyFilter}
            onChange={e => { setFacultyFilter(e.target.value); setDeptFilter('ALL') }}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {faculties.map(f => <option key={f} value={f}>{f === 'ALL' ? 'All Faculties' : f}</option>)}
          </select>
        )}
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {departments.map(d => <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>)}
        </select>
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Levels</option>
          {[100, 200, 300, 400, 500, 600].map(l => <option key={l} value={String(l)}>Level {l}</option>)}
        </select>
        <button
          onClick={() => setShowEnrolledOnly(v => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
            showEnrolledOnly
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          My courses only
        </button>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400">{filtered.length} course{filtered.length !== 1 ? 's' : ''}</p>

      {/* Course cards */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
            <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No courses match your filters.</p>
          </div>
        )}

        {filtered.map(course => {
          const myEnr = myEnrollments.find(e => e.offeringId === course.id)
          const isExpanded = expanded === course.id

          return (
            <div key={course.id}
              className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                course.alreadyEnrolled ? 'border-blue-200' : 'border-gray-100'
              }`}
            >
              {/* Main row */}
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Code + title */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{course.code}</span>
                    <span className="text-sm font-semibold text-gray-900 truncate">{course.title}</span>
                    {course.alreadyEnrolled && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        myEnr?.status === 'WAITLISTED'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {myEnr?.status === 'WAITLISTED'
                          ? `Waitlisted${myEnr.waitlistPosition ? ` #${myEnr.waitlistPosition}` : ''}`
                          : 'Enrolled'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500">{course.teacher}</span>
                    {course.faculty && <span className="text-xs text-gray-400">{course.faculty}</span>}
                    <span className="text-xs text-gray-400">{course.department}</span>
                    <span className="text-xs text-gray-400">{course.creditHours} cr · Level {course.level}</span>
                    {course.room && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />{course.room}
                      </span>
                    )}
                  </div>
                  {/* Schedule pills */}
                  {course.schedule.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {course.schedule.map((s, i) => (
                        <span key={i} className="text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                          {DAY_SHORT[s.day] ?? s.day} {fmt12(s.startTime)} – {fmt12(s.endTime)}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Warnings */}
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {course.clash && (
                      <span className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Schedule clash
                      </span>
                    )}
                    {course.missingPrereqs.length > 0 && (
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Missing: {course.missingPrereqs.join(', ')}
                      </span>
                    )}
                    {course.wouldExceedLimit && (
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Exceeds credit limit
                      </span>
                    )}
                  </div>
                </div>

                {/* Seats */}
                <div className="flex-shrink-0 text-center w-14">
                  <p className={`text-sm font-bold ${course.isFull ? 'text-red-500' : 'text-blue-600'}`}>
                    {course.isFull ? 'Full' : `${course.seats}`}
                  </p>
                  <p className="text-xs text-gray-400">{course.isFull ? 'waitlist' : 'seats'}</p>
                </div>

                {/* Action */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : course.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {course.alreadyEnrolled ? (
                    <button
                      onClick={() => drop(course.id)}
                      disabled={dropping === course.id || !data.addDropOpen}
                      title={!data.addDropOpen ? 'Add/drop period has ended' : 'Drop this course'}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      {dropping === course.id ? '...' : 'Drop'}
                    </button>
                  ) : course.isFull ? (
                    <button
                      onClick={() => enroll(course.id)}
                      disabled={enrolling === course.id || !course.canWaitlist || !feeClearance}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-yellow-200 text-yellow-700 text-xs font-semibold rounded-xl hover:bg-yellow-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      {enrolling === course.id ? '...' : 'Waitlist'}
                    </button>
                  ) : (
                    <button
                      onClick={() => enroll(course.id)}
                      disabled={enrolling === course.id || !course.canRegister || !feeClearance}
                      title={!feeClearance ? 'Clear outstanding fees to register' : course.clash ? 'Schedule clash' : ''}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {enrolling === course.id ? '...' : 'Enroll'}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded description */}
              {isExpanded && (
                <div className="border-t border-gray-50 px-5 py-4 bg-gray-50/50">
                  {course.description ? (
                    <p className="text-sm text-gray-600 leading-relaxed">{course.description}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No description available.</p>
                  )}
                  {course.schedule.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {course.schedule.map((s, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs bg-white border border-gray-100 text-gray-600 px-3 py-1.5 rounded-lg">
                          <Clock className="w-3 h-3 text-blue-500" />
                          {DAY_SHORT[s.day] ?? s.day} · {fmt12(s.startTime)} – {fmt12(s.endTime)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
