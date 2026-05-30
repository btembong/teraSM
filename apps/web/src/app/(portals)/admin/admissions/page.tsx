'use client'

import { useEffect, useState } from 'react'
import {
  ClipboardList, Search, RefreshCw, Eye, Loader2, Download,
  X, Save, CheckCircle, XCircle, FileText,
  BarChart2, TrendingUp, UserPlus, Star, AlertCircle, Link2,
} from 'lucide-react'
import { SkeletonTable } from '@/components/ui/skeleton'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUSES = ['ALL', 'SUBMITTED', 'DOCS_REVIEW', 'REVIEWING', 'INTERVIEW', 'DOCS_VERIFIED', 'OFFERED', 'WAITLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']

const STATUS_STYLE: Record<string, string> = {
  SUBMITTED:     'bg-gray-100 text-gray-700',
  DOCS_REVIEW:   'bg-amber-100 text-amber-700',
  REVIEWING:     'bg-blue-100 text-blue-700',
  INTERVIEW:     'bg-purple-100 text-purple-700',
  DOCS_VERIFIED: 'bg-teal-100 text-teal-700',
  OFFERED:       'bg-green-100 text-green-700',
  WAITLISTED:    'bg-orange-100 text-orange-700',
  ACCEPTED:      'bg-green-100 text-green-800',
  REJECTED:      'bg-red-100 text-red-700',
  WITHDRAWN:     'bg-gray-100 text-gray-500',
}

const STATUS_NEXT: Record<string, string[]> = {
  SUBMITTED:     ['DOCS_REVIEW', 'REVIEWING', 'REJECTED', 'WITHDRAWN'],
  DOCS_REVIEW:   ['REVIEWING', 'DOCS_VERIFIED', 'REJECTED', 'WITHDRAWN'],
  REVIEWING:     ['INTERVIEW', 'DOCS_VERIFIED', 'OFFERED', 'REJECTED', 'WITHDRAWN'],
  INTERVIEW:     ['DOCS_VERIFIED', 'OFFERED', 'WAITLISTED', 'REJECTED', 'WITHDRAWN'],
  DOCS_VERIFIED: ['OFFERED', 'WAITLISTED', 'REJECTED', 'WITHDRAWN'],
  OFFERED:       ['ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  WAITLISTED:    ['OFFERED', 'REJECTED', 'WITHDRAWN'],
  ACCEPTED:      ['WITHDRAWN'],
  REJECTED:      ['REVIEWING'],
  WITHDRAWN:     ['REVIEWING'],
}

const DOC_TYPE_LABEL: Record<string, string> = {
  ID_CARD: 'ID Card', PASSPORT_PHOTO: 'Passport Photo', CERTIFICATE: 'Certificate',
  TRANSCRIPT: 'Transcript', RECOMMENDATION: 'Recommendation', OTHER: 'Other',
}

function fmtStatus(s: string) {
  return s.replace(/_/g, ' ').charAt(0) + s.replace(/_/g, ' ').slice(1).toLowerCase()
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Doc {
  id: string; docType: string; fileName: string; fileUrl: string; status: string; rejectionReason: string | null
}
interface Application {
  id: string; referenceNumber: string | null; firstName: string; lastName: string; email: string; phone: string | null
  dateOfBirth: string | null; gender: string | null; nationality: string | null; address: string | null
  programOfInterest: string | null; entryLevel: string | null; previousSchool: string | null
  qualifications: string | null; personalStatement: string | null
  status: string; waitlistPosition: number | null; offerExpiry: string | null; offerLetterUrl: string | null
  rejectionReason: string | null; convertedUserId: string | null; adminNote: string | null; createdAt: string
  admissionDocuments: Doc[]
}
interface Analytics {
  total: number; submitted: number; reviewing: number; offered: number; waitlisted: number
  accepted: number; rejected: number; acceptanceRate: number; conversionRate: number
  byProgram: { program: string; count: number }[]
  monthly: { month: string; count: number }[]
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
const lbl = 'block text-xs font-medium text-gray-600 mb-1'
const field = 'bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-700'
const TH = 'text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100'
const TD = 'px-5 py-3.5 border-r border-gray-100'

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminAdmissionsPage() {
  const [tab, setTab]               = useState<'applications' | 'analytics'>('applications')
  const [apps, setApps]             = useState<Application[]>([])
  const [loading, setLoading]       = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<Application | null>(null)
  const [saving, setSaving]         = useState(false)
  const [converting, setConverting] = useState(false)
  const [note, setNote]             = useState('')
  const [newStatus, setNewStatus]   = useState('')
  const [waitlistPos, setWaitlistPos] = useState('')
  const [rejReason, setRejReason]   = useState('')
  const [convertResult, setConvertResult] = useState<{ tempPassword?: string; userId?: string } | null>(null)
  const [analytics, setAnalytics]   = useState<Analytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [generatingOffer, setGeneratingOffer] = useState(false)
  const [tenantSlug, setTenantSlug]           = useState('')

  // Fetch own tenant slug once (used to build public apply URL)
  useEffect(() => {
    fetch('/api/admin/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.tenant?.slug) setTenantSlug(d.tenant.slug)
    }).catch(() => {})
  }, [])

  const load = async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (statusFilter !== 'ALL') p.set('status', statusFilter)
    if (search) p.set('search', search)
    const data = await fetch(`/api/admin/admissions?${p}`).then(r => r.json())
    setApps(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const loadAnalytics = async () => {
    if (analytics) return
    setAnalyticsLoading(true)
    const data = await fetch('/api/admin/admissions/analytics').then(r => r.json()).catch(() => null)
    setAnalytics(data)
    setAnalyticsLoading(false)
  }

  useEffect(() => { load() }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'analytics') loadAnalytics() }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const openDetail = (app: Application) => {
    setSelected(app)
    setNote(app.adminNote ?? '')
    setNewStatus(app.status)
    setWaitlistPos(app.waitlistPosition ? String(app.waitlistPosition) : '')
    setRejReason(app.rejectionReason ?? '')
    setConvertResult(null)
  }

  const saveChanges = async () => {
    if (!selected) return
    setSaving(true)
    const body: any = { status: newStatus, adminNote: note }
    if (newStatus === 'WAITLISTED' && waitlistPos) body.waitlistPosition = parseInt(waitlistPos)
    if (newStatus === 'REJECTED' && rejReason) body.rejectionReason = rejReason
    const res  = await fetch(`/api/admin/admissions/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json()
    setApps(prev => prev.map(a => a.id === data.id ? data : a))
    setSelected(data)
    setSaving(false)
  }

  const verifyDoc = async (docId: string, status: 'VERIFIED' | 'REJECTED' | 'PENDING', reason?: string) => {
    if (!selected) return
    const res = await fetch(`/api/admin/admissions/${selected.id}/documents/${docId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectionReason: reason ?? null }),
    })
    const doc = await res.json()
    const updatedApp: Application = {
      ...selected,
      admissionDocuments: selected.admissionDocuments.map(d => d.id === docId ? doc : d),
    }
    if (status === 'VERIFIED' && updatedApp.admissionDocuments.every(d => d.status === 'VERIFIED')) {
      updatedApp.status = 'DOCS_VERIFIED'
      setNewStatus('DOCS_VERIFIED')
    }
    setSelected(updatedApp)
    setApps(prev => prev.map(a => a.id === selected.id ? updatedApp : a))
  }

  const convertToStudent = async () => {
    if (!selected) return
    setConverting(true)
    const res  = await fetch(`/api/admin/admissions/${selected.id}/convert`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setConvertResult({ tempPassword: data.tempPassword, userId: data.userId })
      const updatedApp = { ...selected, ...data.application }
      setSelected(updatedApp)
      setApps(prev => prev.map(a => a.id === selected.id ? updatedApp : a))
    }
    setConverting(false)
  }

  const generateOfferLetter = async () => {
    if (!selected) return
    setGeneratingOffer(true)
    try {
      const res  = await fetch(`/api/admin/admissions/${selected.id}/offer-letter`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.message ?? 'Failed to generate offer letter.'); return }
      const updatedApp = { ...selected, offerLetterUrl: data.offerLetterUrl, referenceNumber: data.referenceNumber }
      setSelected(updatedApp)
      setApps(prev => prev.map(a => a.id === selected.id ? updatedApp : a))
      // Open PDF in new tab
      window.open(data.offerLetterUrl, '_blank')
    } catch { alert('Network error.') }
    finally { setGeneratingOffer(false) }
  }

  const deleteApp = async (id: string) => {
    if (!confirm('Delete this application? This cannot be undone.')) return
    await fetch(`/api/admin/admissions/${id}`, { method: 'DELETE' })
    setApps(prev => prev.filter(a => a.id !== id))
    setSelected(null)
  }

  const exportCsv = () => {
    const header = 'Ref,Name,Email,Phone,Program,Level,Status,Applied'
    const rows = apps.map(a => [
      a.referenceNumber ?? '', `${a.firstName} ${a.lastName}`, a.email, a.phone ?? '',
      a.programOfInterest ?? '', a.entryLevel ?? '', a.status,
      new Date(a.createdAt).toLocaleDateString('en-GB'),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([[header, rows].join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `admissions-${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'ALL' ? apps.length : apps.filter(a => a.status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Applications</h2>
          <p className="text-sm text-gray-400">{apps.length} application{apps.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={load}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ── Public apply link banner ── */}
      {tenantSlug && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-sm">
          <Link2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-indigo-700 font-medium">Public application link: </span>
            <span className="text-indigo-500 font-mono text-xs truncate">{window.location.origin}/apply/{tenantSlug}</span>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/apply/${tenantSlug}`).catch(() => {})}
            className="flex-shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Copy
          </button>
          <a href={`/apply/${tenantSlug}`} target="_blank" rel="noreferrer"
            className="flex-shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors">
            Open ↗
          </a>
        </div>
      )}

      {/* ── Sub-tabs ── */}
      <div className="flex items-center gap-0.5 bg-indigo-100/70 rounded-2xl p-1 w-fit">
        {([
          ['applications', 'Applications', ClipboardList],
          ['analytics',    'Analytics',    BarChart2],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              tab === key
                ? 'bg-white text-indigo-700 font-semibold shadow-sm border border-indigo-100'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${tab === key ? 'text-indigo-500' : 'text-slate-400'}`} />
            {label}
          </button>
        ))}
      </div>

      {/* ── APPLICATIONS TAB ── */}
      {tab === 'applications' && (
        <>
          {/* Status pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}>
                {s === 'ALL' ? 'All' : fmtStatus(s)}
                {counts[s] > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${statusFilter === s ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {counts[s]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && load()}
              />
            </div>
            <button onClick={load}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
              Search
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <SkeletonTable rows={5} />
          ) : apps.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
              <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No applications found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm table-hover">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className={TH}>Applicant</th>
                    <th className={TH}>Program / Level</th>
                    <th className={TH}>Documents</th>
                    <th className={TH}>Status</th>
                    <th className={TH}>Applied</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {apps.map(app => {
                    const docCount      = app.admissionDocuments?.length ?? 0
                    const verifiedCount = app.admissionDocuments?.filter(d => d.status === 'VERIFIED').length ?? 0
                    const allVerified   = docCount > 0 && verifiedCount === docCount
                    return (
                      <tr key={app.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className={TD}>
                          <p className="font-semibold text-gray-900">{app.firstName} {app.lastName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{app.email}</p>
                          {app.referenceNumber && (
                            <p className="text-xs text-gray-300 font-mono mt-0.5">{app.referenceNumber}</p>
                          )}
                        </td>
                        <td className={TD}>
                          <p className="text-sm text-gray-700">{app.programOfInterest ?? <span className="text-gray-300">—</span>}</p>
                          {app.entryLevel && (
                            <p className="text-xs text-gray-400 mt-0.5">{app.entryLevel}</p>
                          )}
                        </td>
                        <td className={TD}>
                          {docCount > 0 ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${allVerified ? 'text-green-600' : 'text-amber-600'}`}>
                              {allVerified
                                ? <CheckCircle className="w-3.5 h-3.5" />
                                : <AlertCircle className="w-3.5 h-3.5" />
                              }
                              {verifiedCount}/{docCount} verified
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">None</span>
                          )}
                        </td>
                        <td className={TD}>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {fmtStatus(app.status)}
                          </span>
                        </td>
                        <td className={TD}>
                          <span className="text-sm text-gray-500">
                            {new Date(app.createdAt).toLocaleDateString('en-GB')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end">
                            <button onClick={() => openDetail(app)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === 'analytics' && (
        analyticsLoading ? (
          <SkeletonTable rows={3} />
        ) : analytics ? (
          <div className="space-y-5">
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Applications', value: analytics.total,              Icon: ClipboardList, color: 'text-indigo-600 bg-indigo-50' },
                { label: 'Offers Extended',    value: analytics.offered,            Icon: Star,          color: 'text-green-600  bg-green-50'  },
                { label: 'Enrolled Students',  value: analytics.accepted,           Icon: UserPlus,      color: 'text-teal-600   bg-teal-50'   },
                { label: 'Acceptance Rate',    value: `${analytics.acceptanceRate}%`, Icon: TrendingUp,  color: 'text-purple-600 bg-purple-50' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${kpi.color}`}>
                    <kpi.Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                    <p className="text-xs text-gray-500">{kpi.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Funnel */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Application Funnel</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Total Applied',  count: analytics.total,      color: 'bg-indigo-500' },
                  { label: 'Under Review',   count: analytics.reviewing,  color: 'bg-blue-500'   },
                  { label: 'Offered',        count: analytics.offered,    color: 'bg-green-500'  },
                  { label: 'Waitlisted',     count: analytics.waitlisted, color: 'bg-orange-400' },
                  { label: 'Enrolled',       count: analytics.accepted,   color: 'bg-teal-500'   },
                  { label: 'Rejected',       count: analytics.rejected,   color: 'bg-red-400'    },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-28 flex-shrink-0">{row.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${row.color} transition-all`}
                        style={{ width: analytics.total > 0 ? `${Math.round((row.count / analytics.total) * 100)}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-8 text-right">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monthly trend */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Monthly Applications</h3>
                <div className="flex items-end gap-2 h-28">
                  {analytics.monthly.map(m => {
                    const max = Math.max(...analytics.monthly.map(x => x.count), 1)
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-600 font-medium">{m.count || ''}</span>
                        <div className="w-full bg-indigo-100 rounded-t-lg" style={{ height: `${Math.round((m.count / max) * 80)}px` }}>
                          <div className="w-full h-full bg-indigo-500 rounded-t-lg opacity-80" />
                        </div>
                        <span className="text-[9px] text-gray-400">{m.month}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* By program */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Top Programs Applied</h3>
                <div className="space-y-2">
                  {analytics.byProgram.slice(0, 6).map(p => (
                    <div key={p.program} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 flex-1 truncate">{p.program}</span>
                      <div className="w-20 bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-indigo-400"
                          style={{ width: `${Math.round((p.count / (analytics.byProgram[0]?.count || 1)) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-6 text-right">{p.count}</span>
                    </div>
                  ))}
                  {analytics.byProgram.length === 0 && <p className="text-sm text-gray-400">No data yet.</p>}
                </div>
              </div>
            </div>

            {/* Conversion stats */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Conversion Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Offer Rate',      value: `${analytics.total > 0 ? Math.round((analytics.offered / analytics.total) * 100) : 0}%`, sub: 'of applicants offered' },
                  { label: 'Acceptance Rate', value: `${analytics.acceptanceRate}%`,  sub: 'of offers accepted'  },
                  { label: 'Conversion',      value: `${analytics.conversionRate}%`,  sub: 'applied → enrolled'  },
                ].map(m => (
                  <div key={m.label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-gray-900">{m.value}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{m.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
            <BarChart2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">Failed to load analytics.</p>
          </div>
        )
      )}

      {/* ── DETAIL DRAWER ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

            {/* Drawer header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <p className="font-semibold text-gray-900">{selected.firstName} {selected.lastName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{selected.referenceNumber ?? selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[selected.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {fmtStatus(selected.status)}
                </span>
                {selected.convertedUserId && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                    Student account created
                  </span>
                )}
              </div>

              {/* Personal info */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Personal</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {([
                    ['Email', selected.email],
                    ['Phone', selected.phone],
                    ['DOB', selected.dateOfBirth ? new Date(selected.dateOfBirth).toLocaleDateString('en-GB') : null],
                    ['Gender', selected.gender],
                    ['Nationality', selected.nationality],
                  ] as [string, string | null][]).map(([k, v]) => v ? (
                    <div key={k}>
                      <p className="text-xs text-gray-400">{k}</p>
                      <p className="font-medium text-gray-900 mt-0.5">{v}</p>
                    </div>
                  ) : null)}
                  {selected.address && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">Address</p>
                      <p className="font-medium text-gray-900 mt-0.5">{selected.address}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Academic */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Academic</h3>
                <div className="space-y-2 text-sm">
                  {([
                    ['Program', selected.programOfInterest],
                    ['Level', selected.entryLevel],
                    ['Previous School', selected.previousSchool],
                  ] as [string, string | null][]).map(([k, v]) => v && (
                    <div key={k} className="flex gap-4">
                      <span className="text-gray-400 w-32 flex-shrink-0">{k}</span>
                      <span className="text-gray-900 font-medium">{v}</span>
                    </div>
                  ))}
                  {selected.qualifications && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Qualifications</p>
                      <div className={field}>{selected.qualifications}</div>
                    </div>
                  )}
                </div>
              </section>

              {/* Personal statement */}
              {selected.personalStatement && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Personal Statement</h3>
                  <div className={`${field} whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto`}>
                    {selected.personalStatement}
                  </div>
                </section>
              )}

              {/* Documents */}
              {selected.admissionDocuments && selected.admissionDocuments.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Documents
                    <span className="ml-2 text-gray-300 normal-case font-normal">
                      {selected.admissionDocuments.filter(d => d.status === 'VERIFIED').length}/{selected.admissionDocuments.length} verified
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {selected.admissionDocuments.map(doc => (
                      <div key={doc.id} className={`border rounded-xl p-3 ${
                        doc.status === 'VERIFIED' ? 'border-green-200 bg-green-50' :
                        doc.status === 'REJECTED' ? 'border-red-200 bg-red-50' :
                        'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-800">{DOC_TYPE_LABEL[doc.docType] ?? doc.docType}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[180px]">{doc.fileName}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold ${
                            doc.status === 'VERIFIED' ? 'text-green-600' :
                            doc.status === 'REJECTED' ? 'text-red-600' :
                            'text-amber-600'
                          }`}>{doc.status}</span>
                        </div>
                        {doc.status === 'REJECTED' && doc.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1">Reason: {doc.rejectionReason}</p>
                        )}
                        {doc.status === 'PENDING' && (
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => verifyDoc(doc.id, 'VERIFIED')}
                              className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium">
                              <CheckCircle className="w-3 h-3" /> Verify
                            </button>
                            <button onClick={() => { const r = prompt('Rejection reason (optional):') ?? undefined; verifyDoc(doc.id, 'REJECTED', r) }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs rounded-lg font-medium border border-red-200">
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        )}
                        {doc.status !== 'PENDING' && (
                          <button onClick={() => verifyDoc(doc.id, 'PENDING')}
                            className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                            Reset to pending
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Review decision */}
              <section className="border-t border-gray-100 pt-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Review Decision</h3>

                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Status</label>
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className={inp}>
                      <option value={selected.status}>{fmtStatus(selected.status)} (current)</option>
                      {(STATUS_NEXT[selected.status] ?? []).map(s => (
                        <option key={s} value={s}>{fmtStatus(s)}</option>
                      ))}
                    </select>
                  </div>

                  {newStatus === 'WAITLISTED' && (
                    <div>
                      <label className={lbl}>Waitlist Position</label>
                      <input type="number" min="1" value={waitlistPos} onChange={e => setWaitlistPos(e.target.value)}
                        className={inp} placeholder="e.g. 3" />
                    </div>
                  )}

                  {newStatus === 'REJECTED' && (
                    <div>
                      <label className={lbl}>Rejection Reason <span className="font-normal text-gray-400">(shown to applicant)</span></label>
                      <textarea rows={2} value={rejReason} onChange={e => setRejReason(e.target.value)}
                        className={`${inp} resize-none`}
                        placeholder="Optional — visible to applicant on tracking page" />
                    </div>
                  )}

                  <div>
                    <label className={lbl}>Admin Note <span className="font-normal text-gray-400">(internal only)</span></label>
                    <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                      className={`${inp} resize-none`} placeholder="Add internal notes…" />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap mt-4">
                  <button onClick={saveChanges} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>

                  {(selected.status === 'OFFERED' || selected.status === 'ACCEPTED') && !selected.convertedUserId && (
                    <button onClick={convertToStudent} disabled={converting}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                      {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      Convert to Student
                    </button>
                  )}

                  {(selected.status === 'OFFERED' || selected.status === 'ACCEPTED') && (
                    <button onClick={generateOfferLetter} disabled={generatingOffer}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                      {generatingOffer ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      {selected.offerLetterUrl ? 'Regenerate Offer Letter' : 'Generate Offer Letter'}
                    </button>
                  )}

                  {selected.offerLetterUrl && (
                    <a href={selected.offerLetterUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm font-semibold rounded-xl transition-colors">
                      <Download className="w-4 h-4" /> Download Letter
                    </a>
                  )}

                  <button onClick={() => deleteApp(selected.id)}
                    className="px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors ml-auto">
                    Delete
                  </button>
                </div>

                {/* Conversion result */}
                {convertResult && (
                  <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-sm">
                    <p className="font-semibold text-teal-800 flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4" /> Student account created
                    </p>
                    {convertResult.tempPassword && (
                      <p className="text-teal-700 text-xs">
                        Temporary password: <code className="bg-teal-100 px-1.5 py-0.5 rounded font-mono">{convertResult.tempPassword}</code>
                        <span className="text-teal-500 ml-2">(share securely with the student)</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Tracking link */}
                {tenantSlug && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
                    <p className="font-semibold text-gray-700 mb-1">Applicant Tracking Link</p>
                    <p className="text-gray-400 mb-1.5 break-all font-mono truncate">
                      /apply/{tenantSlug}/track/{selected.id.slice(0, 8)}…
                    </p>
                    <button
                      className="text-indigo-600 hover:text-indigo-800 underline text-left"
                      onClick={() => navigator.clipboard.writeText(
                        `${window.location.origin}/apply/${tenantSlug}/track/${(selected as any).trackingToken}`
                      ).catch(() => {})}
                    >
                      Copy tracking link ↗
                    </button>
                  </div>
                )}
              </section>

              <p className="text-xs text-gray-400">Applied {new Date(selected.createdAt).toLocaleString('en-GB')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
