'use client'

import { useEffect, useState } from 'react'
import {
  BookOpen, ChevronDown, ChevronUp, Download, Loader2,
  FileText, Clock, CheckCircle2, XCircle, AlertCircle, Eye, Search,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonTable } from '@/components/ui/skeleton'

interface ThesisVersion {
  id: string; version: number; fileUrl: string; fileName: string; uploadedAt: string
}
interface Thesis {
  id: string; title: string; status: string; department?: string; program?: string
  academicYear?: string; submittedAt?: string; approvedAt?: string; publishedAt?: string
  student:    { id: string; firstName: string; lastName: string; email: string }
  supervisor: { id: string; firstName: string; lastName: string } | null
  versions:   ThesisVersion[]
  feedbacks:  { id: string; content: string; isPrivate: boolean; author: { firstName: string; lastName: string } }[]
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

const ALL_STATUSES = ['DRAFT','SUBMITTED','UNDER_REVIEW','REVISION_REQUESTED','APPROVED','REJECTED','PUBLISHED']

export default function AdminThesisPage() {
  const [theses, setTheses]         = useState<Thesis[]>([])
  const [teachers, setTeachers]     = useState<{ id: string; firstName: string; lastName: string }[]>([])
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch]         = useState('')
  const [changingStatus, setChangingStatus]   = useState<string | null>(null)
  const [changingSupervisor, setChangingSupervisor] = useState<string | null>(null)
  const [supervisorInputs, setSupervisorInputs] = useState<Record<string, string>>({})

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const [tRes, uRes] = await Promise.all([
      fetch(`/api/admin/thesis?${params}`),
      fetch('/api/academics/teachers'),
    ])
    const [tData, uData] = await Promise.all([tRes.json(), uRes.json()])
    setTheses(Array.isArray(tData) ? tData : [])
    setTeachers(Array.isArray(uData) ? uData : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  async function updateStatus(id: string, status: string) {
    setChangingStatus(id)
    try {
      const res = await fetch(`/api/admin/thesis/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.message ?? 'Failed.'); return }
      setTheses(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    } catch { alert('Network error.') }
    finally { setChangingStatus(null) }
  }

  async function assignSupervisor(id: string) {
    const supervisorId = supervisorInputs[id]
    setChangingSupervisor(id)
    try {
      const res = await fetch(`/api/admin/thesis/${id}/supervisor`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supervisorId: supervisorId || null }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.message ?? 'Failed.'); return }
      setTheses(prev => prev.map(t => t.id === id ? { ...t, supervisor: data.supervisor } : t))
    } catch { alert('Network error.') }
    finally { setChangingSupervisor(null) }
  }

  const filtered = theses.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.title.toLowerCase().includes(q) ||
      `${t.student.firstName} ${t.student.lastName}`.toLowerCase().includes(q) ||
      t.student.email.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thesis Portal</h1>
        <p className="text-gray-500 text-sm">Manage all student theses and dissertations</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-xl bg-white">
          <Search className="w-4 h-4 text-gray-300" />
          <input
            className="flex-1 text-sm outline-none"
            placeholder="Search by title or student…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No theses found"
          description={theses.length === 0 ? 'No theses have been submitted yet.' : 'No theses match your filters.'}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(t => {
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
                    <p className="text-xs text-gray-400">
                      {t.supervisor
                        ? `Supervisor: ${t.supervisor.firstName} ${t.supervisor.lastName}`
                        : 'No supervisor assigned'}
                      {t.program ? ` · ${t.program}` : ''}
                      {t.academicYear ? ` · ${t.academicYear}` : ''}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 p-5 space-y-5">
                    {/* Versions */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Uploaded Versions</p>
                      {t.versions.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">None uploaded.</p>
                      ) : (
                        <div className="space-y-2">
                          {[...t.versions].sort((a, b) => b.version - a.version).map(v => (
                            <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <p className="text-sm font-medium text-gray-800">v{v.version} — {v.fileName}</p>
                              <a href={v.fileUrl} target="_blank" rel="noreferrer"
                                className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600">
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Assign supervisor */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Assign Supervisor</p>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={supervisorInputs[t.id] ?? t.supervisor?.id ?? ''}
                          onChange={e => setSupervisorInputs(prev => ({ ...prev, [t.id]: e.target.value }))}
                        >
                          <option value="">— None —</option>
                          {teachers.map((tc: any) => (
                            <option key={tc.id} value={tc.id}>{tc.firstName} {tc.lastName}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => assignSupervisor(t.id)}
                          disabled={changingSupervisor === t.id}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl"
                        >
                          {changingSupervisor === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </button>
                      </div>
                    </div>

                    {/* Status control */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Status Override</p>
                      <div className="flex gap-2 flex-wrap">
                        {ALL_STATUSES.map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(t.id, s)}
                            disabled={changingStatus === t.id || t.status === s}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 ${STATUS_STYLES[s]}`}
                          >
                            {changingStatus === t.id && t.status === s ? <Loader2 className="w-3 h-3 animate-spin" /> : s.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feedbacks */}
                    {t.feedbacks.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Feedback</p>
                        <div className="space-y-2">
                          {t.feedbacks.map(fb => (
                            <div key={fb.id} className={`p-3 rounded-xl border ${fb.isPrivate ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                              <p className="text-sm text-gray-700">{fb.content}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {fb.isPrivate ? '🔒 Private · ' : ''}By {fb.author.firstName} {fb.author.lastName}
                              </p>
                            </div>
                          ))}
                        </div>
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
