'use client'

import { useEffect, useState } from 'react'
import {
  BookOpen, ChevronDown, ChevronUp, MessageSquare,
  CheckCircle2, XCircle, AlertCircle, Clock, Eye,
  FileText, Download, Loader2, Send,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonTable } from '@/components/ui/skeleton'

interface ThesisVersion {
  id: string; version: number; fileUrl: string; fileName: string; uploadedAt: string; note?: string
}
interface ThesisFeedback {
  id: string; content: string; createdAt: string; isPrivate: boolean
  author: { id: string; firstName: string; lastName: string }
}
interface Thesis {
  id: string; title: string; abstract?: string; status: string
  department?: string; program?: string; academicYear?: string
  submittedAt?: string; approvedAt?: string
  student: { id: string; firstName: string; lastName: string; email: string }
  versions: ThesisVersion[]; feedbacks: ThesisFeedback[]
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT:              'bg-gray-100 text-gray-600',
  SUBMITTED:          'bg-blue-100 text-blue-700',
  UNDER_REVIEW:       'bg-yellow-100 text-yellow-700',
  REVISION_REQUESTED: 'bg-orange-100 text-orange-700',
  APPROVED:           'bg-green-100 text-green-700',
  REJECTED:           'bg-red-100 text-red-700',
  PUBLISHED:          'bg-indigo-100 text-indigo-700',
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  DRAFT: FileText, SUBMITTED: Clock, UNDER_REVIEW: Eye,
  REVISION_REQUESTED: AlertCircle, APPROVED: CheckCircle2,
  REJECTED: XCircle, PUBLISHED: BookOpen,
}

const SUPERVISOR_STATUSES = ['UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED']

export default function StaffThesisPage() {
  const [theses, setTheses]     = useState<Thesis[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [isPrivate, setIsPrivate] = useState<Record<string, boolean>>({})
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null)
  const [changingStatus, setChangingStatus]         = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/staff/thesis')
    const data = await res.json()
    setTheses(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addFeedback(thesisId: string) {
    const content = feedback[thesisId]?.trim()
    if (!content) return
    setSubmittingFeedback(thesisId)
    try {
      const res = await fetch(`/api/staff/thesis/${thesisId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, isPrivate: isPrivate[thesisId] ?? false }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.message ?? 'Failed.'); return }
      setTheses(prev => prev.map(t =>
        t.id === thesisId ? { ...t, feedbacks: [data, ...t.feedbacks] } : t
      ))
      setFeedback(prev => ({ ...prev, [thesisId]: '' }))
    } catch { alert('Network error.') }
    finally { setSubmittingFeedback(null) }
  }

  async function changeStatus(thesisId: string, status: string) {
    setChangingStatus(thesisId)
    try {
      const res = await fetch(`/api/staff/thesis/${thesisId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.message ?? 'Failed.'); return }
      setTheses(prev => prev.map(t => t.id === thesisId ? { ...t, ...data } : t))
    } catch { alert('Network error.') }
    finally { setChangingStatus(null) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Supervised Theses</h1>
        <p className="text-gray-500 text-sm">Review, give feedback, and manage student dissertations</p>
      </div>

      {loading ? (
        <SkeletonTable rows={4} />
      ) : theses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No theses assigned"
          description="You have no student theses assigned for supervision yet."
        />
      ) : (
        <div className="space-y-4">
          {theses.map(t => {
            const StatusIcon = STATUS_ICONS[t.status] ?? FileText
            const isOpen = expanded === t.id
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div
                  className="flex items-start gap-4 p-5 cursor-pointer hover:bg-gray-50/60 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : t.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <StatusIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm">{t.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[t.status]}`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.student.firstName} {t.student.lastName} · {t.student.email}
                    </p>
                    {t.program && <p className="text-xs text-gray-400">{t.program}{t.academicYear ? ` · ${t.academicYear}` : ''}</p>}
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 p-5 space-y-5">
                    {t.abstract && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Abstract</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{t.abstract}</p>
                      </div>
                    )}

                    {/* Versions */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Submitted Documents</p>
                      {t.versions.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No document uploaded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {[...t.versions].sort((a, b) => b.version - a.version).map(v => (
                            <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div>
                                <p className="text-sm font-medium text-gray-800">Version {v.version} — {v.fileName}</p>
                                {v.note && <p className="text-xs text-gray-400">{v.note}</p>}
                                <p className="text-xs text-gray-300">{new Date(v.uploadedAt).toLocaleDateString()}</p>
                              </div>
                              <a href={v.fileUrl} target="_blank" rel="noreferrer"
                                className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Status controls */}
                    {t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW' ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Update Status</p>
                        <div className="flex gap-2 flex-wrap">
                          {SUPERVISOR_STATUSES.map(s => (
                            <button
                              key={s}
                              onClick={() => changeStatus(t.id, s)}
                              disabled={changingStatus === t.id || t.status === s}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${STATUS_STYLES[s]}`}
                            >
                              {changingStatus === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : s.replace(/_/g, ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Existing feedback */}
                    {t.feedbacks.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Feedback History</p>
                        <div className="space-y-2">
                          {t.feedbacks.map(fb => (
                            <div key={fb.id} className={`p-3 rounded-xl border ${fb.isPrivate ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                              <p className="text-sm text-gray-700">{fb.content}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {fb.isPrivate ? '🔒 Private · ' : ''}{new Date(fb.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add feedback */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Add Feedback</p>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                        placeholder="Write your feedback or revision notes for the student…"
                        value={feedback[t.id] ?? ''}
                        onChange={e => setFeedback(prev => ({ ...prev, [t.id]: e.target.value }))}
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPrivate[t.id] ?? false}
                            onChange={e => setIsPrivate(prev => ({ ...prev, [t.id]: e.target.checked }))}
                          />
                          Private (supervisor/admin only)
                        </label>
                        <button
                          onClick={() => addFeedback(t.id)}
                          disabled={submittingFeedback === t.id || !feedback[t.id]?.trim()}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
                        >
                          {submittingFeedback === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Send Feedback
                        </button>
                      </div>
                    </div>
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
