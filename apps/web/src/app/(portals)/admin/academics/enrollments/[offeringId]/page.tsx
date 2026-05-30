'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Users, CheckCircle, Clock, XCircle, Printer, AlertCircle,
} from 'lucide-react'

type EnrollmentRow = {
  id: string
  studentId: string
  name: string
  email: string
  status: string
  enrolledAt: string
  droppedAt: string | null
  waitlistPosition: number | null
}

type OfferingInfo = {
  id: string
  code: string
  title: string
  department: string
  teacher: string
  maxStudents: number
  room: string | null
  schedule: any[]
}

type Data = { offering: OfferingInfo; enrollments: EnrollmentRow[] }

const STATUS_STYLE: Record<string, string> = {
  ENROLLED: 'bg-blue-50 text-blue-700',
  WAITLISTED: 'bg-yellow-50 text-yellow-700',
  DROPPED: 'bg-gray-100 text-gray-500',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  ENROLLED: <CheckCircle className="w-3.5 h-3.5" />,
  WAITLISTED: <Clock className="w-3.5 h-3.5" />,
  DROPPED: <XCircle className="w-3.5 h-3.5" />,
}

export default function RosterPage() {
  const { offeringId } = useParams<{ offeringId: string }>()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  function load() {
    fetch(`/api/admin/enrollments/${offeringId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }

  useEffect(() => { load() }, [offeringId])

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function changeStatus(enrollmentId: string, status: string) {
    setUpdating(enrollmentId)
    const res = await fetch(`/api/admin/enrollments/${offeringId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollmentId, status }),
    })
    if (res.ok) { showToast('Status updated', 'success'); load() }
    else { showToast('Failed to update', 'error') }
    setUpdating(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return <p className="text-sm text-gray-400">Not found.</p>

  const { offering, enrollments } = data
  const filtered = statusFilter === 'ALL' ? enrollments : enrollments.filter(e => e.status === statusFilter)
  const enrolled = enrollments.filter(e => e.status === 'ENROLLED')
  const waitlisted = enrollments.filter(e => e.status === 'WAITLISTED')

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin/academics/enrollments"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> All offerings
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{offering.code} — {offering.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{offering.department} · {offering.teacher}{offering.room ? ` · ${offering.room}` : ''}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 print:hidden"
        >
          <Printer className="w-4 h-4" /> Print roster
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Enrolled', value: enrolled.length, max: offering.maxStudents, color: 'bg-blue-50 text-blue-700' },
          { label: 'Waitlisted', value: waitlisted.length, max: null, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Capacity', value: offering.maxStudents, max: null, color: 'bg-gray-50 text-gray-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color}`}>
            <p className="text-3xl font-bold">{s.value}{s.max ? <span className="text-lg font-normal opacity-60"> / {s.max}</span> : ''}</p>
            <p className="text-sm font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['ALL', 'ENROLLED', 'WAITLISTED', 'DROPPED'].map(s => (
          <button key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s === 'ALL' ? `All (${enrollments.length})` : `${s[0] + s.slice(1).toLowerCase()} (${enrollments.filter(e => e.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Roster table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden print:border-gray-300">
        {/* Print header */}
        <div className="hidden print:flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <p className="text-lg font-bold">{offering.code} — {offering.title}</p>
            <p className="text-sm text-gray-500">{offering.department} · {offering.teacher}</p>
          </div>
          <p className="text-sm text-gray-500">Printed {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
        </div>

        <table className="w-full text-sm table-hover">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-4 py-3 print:hidden" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-400">No students found.</td></tr>
            )}
            {filtered.map((e, idx) => (
              <tr key={e.id} className="hover:bg-gray-50/40 transition-colors">
                <td className="px-5 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{e.name}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{e.email}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[e.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_ICON[e.status]}
                    {e.status === 'WAITLISTED' && e.waitlistPosition ? `#${e.waitlistPosition} Waitlist` : e.status[0] + e.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {e.status === 'DROPPED' && e.droppedAt
                    ? new Date(e.droppedAt).toLocaleDateString()
                    : new Date(e.enrolledAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 print:hidden">
                  {e.status !== 'DROPPED' && (
                    <select
                      disabled={updating === e.id}
                      value={e.status}
                      onChange={ev => changeStatus(e.id, ev.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ENROLLED">Enrolled</option>
                      <option value="WAITLISTED">Waitlisted</option>
                      <option value="DROPPED">Drop</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @media print {
          nav, aside, header, .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
