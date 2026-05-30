'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Building2, ChevronRight, Search, Users, BookOpen, Clock,
  CheckCircle2, XCircle, Loader2, AlertCircle, UserCheck,
} from 'lucide-react'
import { SkeletonTable } from '@/components/ui/skeleton'
import { NoActiveSemester } from '@/components/ui/no-active-semester'

// ── Types ────────────────────────────────────────────────────────────────────

type PendingEnrollment = {
  id: string
  enrolledAt: string
  student: { id: string; name: string; email: string }
  course: { offeringId: string; code: string; title: string }
}

type Offering = {
  id: string; code: string; title: string
  department: string; departmentCode: string
  teacher: string; creditHours: number
  maxStudents: number; room: string | null
  pending: number; enrolled: number; waitlisted: number; dropped: number
}

type RosterData = {
  semester: { id: string; name: string; academicYear: string } | null
  offerings: Offering[]
}

type PendingData = {
  semester: { id: string; name: string } | null
  pending: PendingEnrollment[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EnrollmentsPage() {
  const [roster, setRoster]       = useState<RosterData | null>(null)
  const [pendingData, setPending] = useState<PendingData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [acting, setActing]       = useState<Record<string, boolean>>({})
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    const [r, p] = await Promise.all([
      fetch('/api/admin/enrollments').then(r => r.json()),
      fetch('/api/admin/enrollments/pending').then(r => r.json()),
    ])
    setRoster(r)
    setPending(p)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAction(enrollmentId: string, action: 'approve' | 'reject') {
    setActing(a => ({ ...a, [enrollmentId]: true }))
    const res = await fetch('/api/admin/enrollments/pending', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollmentId, action }),
    })
    setActing(a => ({ ...a, [enrollmentId]: false }))
    if (res.ok) {
      showToast(action === 'approve' ? 'Enrollment approved' : 'Enrollment rejected', res.ok)
      await load()
    } else {
      showToast('Action failed', false)
    }
  }

  if (loading) return <SkeletonTable rows={8} />

  if (!roster?.semester) return <NoActiveSemester feature="Enrollment roster" />

  const pending = pendingData?.pending ?? []
  const filtered = (roster.offerings ?? []).filter(o =>
    !search || `${o.code} ${o.title} ${o.department} ${o.teacher}`.toLowerCase().includes(search.toLowerCase())
  )

  const totalPending    = roster.offerings.reduce((s, o) => s + o.pending, 0)
  const totalEnrolled   = roster.offerings.reduce((s, o) => s + o.enrolled, 0)
  const totalWaitlisted = roster.offerings.reduce((s, o) => s + o.waitlisted, 0)
  const fullOfferings   = roster.offerings.filter(o => o.enrolled >= o.maxStudents && o.maxStudents > 0).length

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
          <h2 className="text-xl font-bold text-slate-900">Enrollment Roster</h2>
          <p className="text-sm text-slate-400 mt-0.5">{roster.semester.name} · {roster.semester.academicYear}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending Approval', value: totalPending,    icon: Clock,      accent: totalPending > 0 },
          { label: 'Total Enrolled',   value: totalEnrolled,   icon: Users,      accent: true },
          { label: 'On Waitlist',      value: totalWaitlisted, icon: BookOpen,   accent: false },
          { label: 'Full Courses',     value: fullOfferings,   icon: AlertCircle, accent: false },
        ].map(s => (
          <div key={s.label} className={`border rounded-2xl p-4 ${s.accent && s.value > 0 ? (s.label === 'Pending Approval' ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100') : 'bg-white border-gray-100'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${s.label === 'Pending Approval' && s.value > 0 ? 'bg-amber-100' : 'bg-slate-50'}`}>
              <s.icon className={`w-4 h-4 ${s.label === 'Pending Approval' && s.value > 0 ? 'text-amber-600' : s.accent ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
            <p className={`text-2xl font-bold ${s.label === 'Pending Approval' && s.value > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Pending Approvals Queue ─────────────────────────────────────────── */}
      {pending.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-amber-100 bg-amber-50">
            <UserCheck className="w-4 h-4 text-amber-600" />
            <p className="font-semibold text-amber-900 text-sm">
              Pending Approvals
              <span className="ml-2 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            </p>
            <p className="text-xs text-amber-600 ml-auto">Approve or reject each registration request</p>
          </div>
          <div className="divide-y divide-gray-50">
            {pending.map(e => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-3.5">
                {/* Student */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{e.student.name}</p>
                  <p className="text-xs text-gray-400 truncate">{e.student.email}</p>
                </div>
                {/* Course */}
                <div className="flex-1 min-w-0 hidden sm:block">
                  <p className="text-sm font-medium text-gray-800 truncate">{e.course.code}</p>
                  <p className="text-xs text-gray-400 truncate">{e.course.title}</p>
                </div>
                {/* Date */}
                <p className="text-xs text-gray-400 flex-shrink-0 hidden md:block">
                  {new Date(e.enrolledAt).toLocaleDateString()}
                </p>
                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAction(e.id, 'approve')}
                    disabled={acting[e.id]}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {acting[e.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(e.id, 'reject')}
                    disabled={acting[e.id]}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    <XCircle className="w-3 h-3" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Course Roster Table ─────────────────────────────────────────────── */}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by course, department, or lecturer…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full text-sm table-hover">
          <thead>
            <tr className="border-b border-gray-100 bg-slate-50/60">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Course</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Dept</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Lecturer</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Cap</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wide border-r border-gray-100">Pending</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Enrolled</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Waitlist</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Fill</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="py-12 text-center text-sm text-slate-400">No courses found.</td></tr>
            )}
            {filtered.map(o => {
              const fillPct = o.maxStudents > 0 ? Math.round((o.enrolled / o.maxStudents) * 100) : 0
              const isFull  = o.enrolled >= o.maxStudents && o.maxStudents > 0
              return (
                <tr key={o.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-5 py-3.5 border-r border-gray-100">
                    <p className="font-semibold text-slate-900">{o.code}</p>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-[220px] truncate">{o.title}</p>
                  </td>
                  <td className="px-4 py-3.5 border-r border-gray-100">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Building2 className="w-3 h-3" />{o.departmentCode}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600 border-r border-gray-100">{o.teacher}</td>
                  <td className="px-4 py-3.5 text-center text-slate-600 font-medium border-r border-gray-100">{o.maxStudents || '∞'}</td>
                  <td className="px-4 py-3.5 text-center border-r border-gray-100">
                    {o.pending > 0
                      ? <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">{o.pending}</span>
                      : <span className="text-slate-200">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-center border-r border-gray-100">
                    <span className={`font-bold text-sm ${isFull ? 'text-red-500' : 'text-slate-900'}`}>{o.enrolled}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center border-r border-gray-100">
                    {o.waitlisted > 0
                      ? <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{o.waitlisted}</span>
                      : <span className="text-slate-200">—</span>}
                  </td>
                  <td className="px-4 py-3.5 border-r border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${fillPct >= 100 ? 'bg-red-400' : fillPct >= 80 ? 'bg-amber-400' : 'bg-indigo-500'}`}
                          style={{ width: `${Math.min(fillPct, 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-7">{fillPct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/admin/academics/enrollments/${o.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                      Roster <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
