'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  GraduationCap, Loader2, CheckCircle2, AlertCircle, XCircle,
  Clock, Users, Info, ChevronDown, ChevronRight, RefreshCw,
} from 'lucide-react'

interface Application {
  id:             string
  status:         string
  appliedAt:      string
  reviewedAt:     string | null
  graduationDate: string | null
  gownSize:       string | null
  notes:          string | null
  rejectionReason: string | null
  reviewedBy:     string | null
  student: { id: string; name: string; email: string } | null
  profile: {
    studentId:      string
    level:          number
    cgpa:           number
    totalCredits:   number
    graduatedAt:    string | null
    programName:    string | null
    programCode:    string | null
    requiredCredits: number
  }
}

const STATUS_PILL: Record<string, string> = {
  APPLIED:      'bg-blue-50 text-blue-700 border border-blue-100',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED:     'bg-red-50 text-red-600 border border-red-100',
  GRADUATED:    'bg-indigo-50 text-indigo-700 border border-indigo-100',
}

const STATUS_ORDER = ['APPLIED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'GRADUATED']

export default function AdminGraduationPage() {
  const [apps, setApps]           = useState<Application[]>([])
  const [loading, setLoading]     = useState(true)
  const [actionId, setActionId]   = useState<string | null>(null)
  const [expanded, setExpanded]   = useState<Set<string>>(new Set())
  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [gradDate, setGradDate]   = useState('')
  const [filter, setFilter]       = useState<string>('all')

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/graduation')
    if (res.ok) setApps(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function toggleExpanded(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function doAction(applicationId: string, action: string, extra?: object) {
    setActionId(applicationId)
    try {
      const res = await fetch('/api/admin/graduation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, action, ...extra }),
      })
      if (res.ok) {
        const labels: Record<string, string> = {
          review:   'Marked as under review',
          approve:  'Application approved',
          reject:   'Application rejected',
          graduate: 'Student marked as graduated',
        }
        showToast(labels[action] ?? 'Done', 'ok')
        setRejecting(null)
        setRejectReason('')
        setGradDate('')
        await load()
      } else {
        showToast('Action failed', 'err')
      }
    } catch {
      showToast('Network error', 'err')
    } finally {
      setActionId(null)
    }
  }

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter)
  const counts   = STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: apps.filter(a => a.status === s).length }), {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium ${
          toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Graduation Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">Review applications, approve candidates, and mark students as graduated</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors flex-shrink-0">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All', count: apps.length },
          { key: 'APPLIED',      label: 'Applied',      count: counts.APPLIED      ?? 0 },
          { key: 'UNDER_REVIEW', label: 'Under Review', count: counts.UNDER_REVIEW ?? 0 },
          { key: 'APPROVED',     label: 'Approved',     count: counts.APPROVED     ?? 0 },
          { key: 'REJECTED',     label: 'Rejected',     count: counts.REJECTED     ?? 0 },
          { key: 'GRADUATED',    label: 'Graduated',    count: counts.GRADUATED    ?? 0 },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filter === tab.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <GraduationCap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No graduation applications found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(app => {
            const isOpen = expanded.has(app.id)
            return (
              <div key={app.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Row header */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => toggleExpanded(app.id)}
                >
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{app.student?.name ?? 'Unknown'}</p>
                      <span className="text-xs text-gray-400">{app.profile.studentId}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_PILL[app.status]}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {app.profile.programName ?? 'No program'} · Level {app.profile.level}
                      · CGPA <strong className="text-gray-600">{app.profile.cgpa.toFixed(2)}</strong>
                      · {app.profile.totalCredits}/{app.profile.requiredCredits} credits
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">Applied</p>
                    <p className="text-xs font-medium text-gray-700">{new Date(app.appliedAt).toLocaleDateString()}</p>
                  </div>
                </button>

                {/* Expanded detail + actions */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4">
                    {/* Student info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Email',    value: app.student?.email ?? '—' },
                        { label: 'Program',  value: app.profile.programCode ?? '—' },
                        { label: 'Gown Size', value: app.gownSize ?? 'Not specified' },
                        { label: 'Applied',  value: new Date(app.appliedAt).toLocaleDateString() },
                      ].map(item => (
                        <div key={item.label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-gray-400">{item.label}</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {app.notes && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                        <p className="font-semibold mb-0.5">Student notes:</p>
                        <p>{app.notes}</p>
                      </div>
                    )}

                    {app.rejectionReason && (
                      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-700">
                        <p className="font-semibold mb-0.5">Rejection reason:</p>
                        <p>{app.rejectionReason}</p>
                      </div>
                    )}

                    {app.graduationDate && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-xs text-emerald-700">
                        <p className="font-semibold">Graduation date: {new Date(app.graduationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    )}

                    {/* Rejection form */}
                    {rejecting === app.id && (
                      <div className="space-y-2">
                        <textarea
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          rows={2}
                          placeholder="Reason for rejection (required)…"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => doAction(app.id, 'reject', { rejectionReason: rejectReason })}
                            disabled={!rejectReason.trim() || actionId === app.id}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition-colors"
                          >
                            {actionId === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                            Confirm Rejection
                          </button>
                          <button onClick={() => { setRejecting(null); setRejectReason('') }}
                            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Graduation date for approve */}
                    {app.status === 'UNDER_REVIEW' && rejecting !== app.id && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <input type="date" value={gradDate} onChange={e => setGradDate(e.target.value)}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                        <span className="text-xs text-gray-400">Graduation date (optional)</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    {app.status !== 'GRADUATED' && rejecting !== app.id && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {app.status === 'APPLIED' && (
                          <button onClick={() => doAction(app.id, 'review')} disabled={actionId === app.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 rounded-xl transition-colors">
                            {actionId === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                            Mark Under Review
                          </button>
                        )}
                        {(app.status === 'APPLIED' || app.status === 'UNDER_REVIEW') && (
                          <>
                            <button
                              onClick={() => doAction(app.id, 'approve', { graduationDate: gradDate || undefined })}
                              disabled={actionId === app.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors"
                            >
                              {actionId === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              Approve
                            </button>
                            <button onClick={() => setRejecting(app.id)} disabled={actionId !== null}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 disabled:opacity-50 rounded-xl transition-colors">
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                        {app.status === 'APPROVED' && (
                          <button
                            onClick={() => doAction(app.id, 'graduate')}
                            disabled={actionId === app.id}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors"
                          >
                            {actionId === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <GraduationCap className="w-3 h-3" />}
                            Mark as Graduated
                          </button>
                        )}
                        {app.status === 'REJECTED' && (
                          <button onClick={() => doAction(app.id, 'review')} disabled={actionId === app.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-xl transition-colors">
                            {actionId === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Reconsider
                          </button>
                        )}
                      </div>
                    )}

                    {app.status === 'GRADUATED' && (
                      <div className="flex items-center gap-2 text-xs text-indigo-700">
                        <GraduationCap className="w-4 h-4" />
                        <span>Graduated · {app.reviewedBy && `Processed by ${app.reviewedBy}`}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
