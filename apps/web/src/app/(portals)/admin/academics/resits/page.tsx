'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  RotateCcw, Loader2, CheckCircle2, AlertCircle, ChevronDown,
  ChevronRight, Users, Info, Send, XCircle,
} from 'lucide-react'

interface FailedGrade {
  gradeId:          string
  studentId:        string
  studentName:      string
  studentEmail:     string
  courseCode:       string
  courseTitle:      string
  creditHours:      number
  semester:         string
  academicYear:     string
  courseOfferingId: string
  caScore:          number | null
  examScore:        number | null
  totalScore:       number | null
  letterGrade:      string | null
}

interface ResitRecord {
  resitId:          string
  gradeId:          string
  studentId:        string
  studentName:      string
  studentEmail:     string
  courseCode:       string
  courseTitle:      string
  creditHours:      number
  semester:         string
  academicYear:     string
  courseOfferingId: string
  originalGrade:    string | null
  originalTotal:    number | null
  caScore:          number | null
  examScore:        number | null
  totalScore:       number | null
  letterGrade:      string | null
  gradePoint:       number | null
  remark:           string | null
  isCapped:         boolean
  capGrade:         string
  status:           string
  submittedAt:      string | null
  publishedAt:      string | null
}

const GRADE_COLOR: Record<string, string> = {
  'A+': 'text-emerald-600', A: 'text-emerald-600',
  'B+': 'text-blue-600',    B: 'text-blue-600',
  'C+': 'text-amber-500',   C: 'text-amber-500',
  D: 'text-orange-500',     F: 'text-red-500',
}

const STATUS_PILL: Record<string, string> = {
  PENDING:   'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-amber-50 text-amber-700 border border-amber-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

export default function ResitsPage() {
  const [failedGrades, setFailedGrades] = useState<FailedGrade[]>([])
  const [resits, setResits]             = useState<ResitRecord[]>([])
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState<Set<string>>(new Set()) // gradeIds
  const [isCapped, setIsCapped]         = useState(true)
  const [capGrade, setCapGrade]         = useState('C')
  const [marking, setMarking]           = useState(false)
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set())
  const [toast, setToast]               = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [failExpanded, setFailExpanded] = useState(true)
  const [resitExpanded, setResitExpanded] = useState(true)

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/resits')
    if (res.ok) {
      const d = await res.json()
      setFailedGrades(d.failed)
      setResits(d.resits)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function toggleGrade(gradeId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(gradeId)) next.delete(gradeId)
      else next.add(gradeId)
      return next
    })
  }

  async function markEligible() {
    if (selected.size === 0) return
    setMarking(true)
    try {
      const res = await fetch('/api/admin/resits', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gradeIds: [...selected], isCapped, capGrade }),
      })
      if (res.ok) {
        const { created } = await res.json()
        showToast(`${created} student${created !== 1 ? 's' : ''} marked eligible for resit`, 'ok')
        setSelected(new Set())
        await load()
      } else {
        showToast('Failed to mark eligible', 'err')
      }
    } catch {
      showToast('Network error', 'err')
    } finally {
      setMarking(false)
    }
  }

  async function publishResit(resitId: string) {
    setPublishingIds(prev => new Set([...prev, resitId]))
    try {
      const res = await fetch('/api/admin/resits/publish', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resitIds: [resitId] }),
      })
      if (res.ok) {
        showToast('Resit result published — CGPA updated', 'ok')
        await load()
      } else {
        showToast('Publish failed', 'err')
      }
    } catch {
      showToast('Network error', 'err')
    } finally {
      setPublishingIds(prev => { const n = new Set(prev); n.delete(resitId); return n })
    }
  }

  async function publishAllSubmitted() {
    const submittedIds = resits.filter(r => r.status === 'SUBMITTED').map(r => r.resitId)
    if (submittedIds.length === 0) return
    setMarking(true)
    try {
      const res = await fetch('/api/admin/resits/publish', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resitIds: submittedIds }),
      })
      if (res.ok) {
        const { published } = await res.json()
        showToast(`${published} resit result${published !== 1 ? 's' : ''} published`, 'ok')
        await load()
      } else {
        showToast('Publish failed', 'err')
      }
    } catch {
      showToast('Network error', 'err')
    } finally {
      setMarking(false)
    }
  }

  const submittedResits = resits.filter(r => r.status === 'SUBMITTED')
  const pendingResits   = resits.filter(r => r.status === 'PENDING')
  const publishedResits = resits.filter(r => r.status === 'PUBLISHED')

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
          <h2 className="text-xl font-bold text-gray-900">Resit Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Mark failed students eligible for resit, review submitted scores, and publish results
          </p>
        </div>
        {submittedResits.length > 0 && (
          <button
            onClick={publishAllSubmitted}
            disabled={marking}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors flex-shrink-0"
          >
            {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Publish All Submitted ({submittedResits.length})
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 text-sm text-amber-800">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
        <div>
          <p className="font-semibold mb-0.5">Resit workflow</p>
          <p className="text-amber-700 text-xs leading-relaxed">
            1. Select failed students below and click <strong>Mark Eligible</strong> to create resit slots.&nbsp;
            2. Lecturers enter resit exam scores via <strong>Staff Portal → Course → Grade Entry → Resit tab</strong> and submit.&nbsp;
            3. Review submitted resits here and <strong>Publish</strong> to update student transcripts and CGPA.
            The original fail stays on the transcript — the resit result appears alongside it.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-4">

          {/* ── Submitted resits awaiting publish ── */}
          {submittedResits.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
                Awaiting Publish — {submittedResits.length}
              </p>
              {submittedResits.map(r => (
                <div key={r.resitId} className="bg-white rounded-2xl border border-amber-100 px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{r.studentName}</p>
                      <span className="text-xs text-gray-400">{r.courseCode}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_PILL[r.status]}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
                      <span>{r.courseTitle}</span>
                      <span>{r.academicYear} · {r.semester}</span>
                      <span>
                        Original: <strong className={`${GRADE_COLOR[r.originalGrade ?? ''] ?? 'text-gray-600'}`}>
                          {r.originalGrade ?? '—'}
                        </strong>
                        {' → '}
                        Resit: <strong className={`${GRADE_COLOR[r.letterGrade ?? ''] ?? 'text-gray-600'}`}>
                          {r.letterGrade ?? '—'}
                        </strong>
                        {r.isCapped && <span className="ml-1 text-gray-300">(capped at {r.capGrade})</span>}
                      </span>
                      {r.remark && (
                        <span className={r.remark === 'PASS' ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                          {r.remark}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => publishResit(r.resitId)}
                    disabled={publishingIds.has(r.resitId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    {publishingIds.has(r.resitId) ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Publish
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Pending resits (waiting for lecturer to enter scores) ── */}
          {pendingResits.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Pending Lecturer Entry — {pendingResits.length}
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {pendingResits.map(r => (
                    <div key={r.resitId} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 text-sm">{r.studentName}</p>
                          <span className="text-xs text-gray-400">{r.courseCode} · {r.semester}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_PILL[r.status]}`}>
                            Awaiting Lecturer
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{r.courseTitle}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">CA carried over</p>
                        <p className="text-sm font-bold text-gray-900">{r.caScore ?? '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Failed grades — mark eligible ── */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50"
              onClick={() => setFailExpanded(v => !v)}
            >
              {failExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900 text-sm">
                  Failed Students — Eligible for Resit
                  <span className="ml-2 text-xs font-normal text-gray-400">({failedGrades.length} students)</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Select students to mark eligible, configure cap policy, then confirm</p>
              </div>
              {selected.size > 0 && (
                <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-semibold">
                  {selected.size} selected
                </span>
              )}
            </button>

            {failExpanded && (
              <>
                {failedGrades.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <CheckCircle2 className="w-7 h-7 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No failed students awaiting resit eligibility</p>
                  </div>
                ) : (
                  <>
                    {/* Cap policy config */}
                    <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-4 flex-wrap">
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isCapped}
                          onChange={e => setIsCapped(e.target.checked)}
                          className="w-3.5 h-3.5 rounded accent-indigo-600"
                        />
                        Cap resit grade at maximum
                      </label>
                      {isCapped && (
                        <select
                          value={capGrade}
                          onChange={e => setCapGrade(e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          {['C+', 'C', 'D'].map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      )}
                      <p className="text-xs text-gray-400 italic">
                        {isCapped
                          ? `Students can earn at most grade ${capGrade} from the resit exam`
                          : 'Students can earn any grade from the resit exam'}
                      </p>
                    </div>

                    {/* Student list */}
                    <div className="divide-y divide-gray-50">
                      {failedGrades.map(g => (
                        <label
                          key={g.gradeId}
                          className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${
                            selected.has(g.gradeId) ? 'bg-indigo-50/40' : 'hover:bg-gray-50/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(g.gradeId)}
                            onChange={() => toggleGrade(g.gradeId)}
                            className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-gray-900 text-sm">{g.studentName}</p>
                              <span className="text-xs text-gray-400">{g.courseCode}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {g.courseTitle} · {g.academicYear} · {g.semester}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0 text-right">
                            <div>
                              <p className="text-sm font-bold text-red-500">{g.letterGrade ?? 'F'}</p>
                              <p className="text-[10px] text-gray-400">Grade</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-700">{g.totalScore?.toFixed(1) ?? '—'}</p>
                              <p className="text-[10px] text-gray-400">Total</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-700">{g.caScore ?? '—'}</p>
                              <p className="text-[10px] text-gray-400">CA</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Mark eligible action */}
                    {selected.size > 0 && (
                      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between gap-4">
                        <p className="text-xs text-gray-500">
                          {selected.size} student{selected.size !== 1 ? 's' : ''} selected
                          {isCapped && ` · grade capped at ${capGrade}`}
                        </p>
                        <button
                          onClick={markEligible}
                          disabled={marking}
                          className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors"
                        >
                          {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                          Mark Eligible for Resit
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* ── Published history ── */}
          {publishedResits.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Published — {publishedResits.length}
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {publishedResits.map(r => (
                    <div key={r.resitId} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 text-sm">{r.studentName}</p>
                          <span className="text-xs text-gray-400">{r.courseCode} · {r.semester}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_PILL.PUBLISHED}`}>
                            Published
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {r.courseTitle} · {r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 text-right">
                        <div>
                          <p className={`text-sm font-bold ${GRADE_COLOR[r.originalGrade ?? ''] ?? 'text-gray-600'}`}>
                            {r.originalGrade ?? '—'}
                          </p>
                          <p className="text-[10px] text-gray-400">Original</p>
                        </div>
                        <span className="text-gray-300 text-lg">→</span>
                        <div>
                          <p className={`text-sm font-bold ${GRADE_COLOR[r.letterGrade ?? ''] ?? 'text-gray-600'}`}>
                            {r.letterGrade ?? '—'}
                          </p>
                          <p className="text-[10px] text-gray-400">Resit</p>
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${r.remark === 'PASS' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {r.remark ?? '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {failedGrades.length === 0 && resits.length === 0 && (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
              <RotateCcw className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No resit data yet</p>
              <p className="text-xs text-gray-300 mt-1">Failed grades will appear here once final grades are published</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
