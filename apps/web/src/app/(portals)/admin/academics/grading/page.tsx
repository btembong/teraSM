'use client'

import { useEffect, useState, useCallback } from 'react'
import { Settings2, Loader2, Save, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Send, XCircle, Users } from 'lucide-react'

interface GradeBoundary { letter: string; min: number }
interface AcademicYear {
  id: string
  name: string
  isCurrent: boolean
  gradingScale: string
  passMark: number
  gradeBoundaries: GradeBoundary[] | null
}

const DEFAULT_BOUNDARIES: GradeBoundary[] = [
  { letter: 'A+', min: 95 },
  { letter: 'A',  min: 90 },
  { letter: 'B+', min: 85 },
  { letter: 'B',  min: 80 },
  { letter: 'C+', min: 75 },
  { letter: 'C',  min: 70 },
  { letter: 'D',  min: 60 },
  { letter: 'F',  min: 0  },
]

const SCALE_LABELS: Record<string, string> = {
  PERCENTAGE: 'Percentage (%)',
  GPA_4:      'GPA 4.0',
  GPA_5:      'GPA 5.0',
  LETTER:     'Letter (A–F)',
}

const LETTER_COLOR: Record<string, string> = {
  'A+': 'text-emerald-600', A: 'text-emerald-600',
  'B+': 'text-blue-600',    B: 'text-blue-600',
  'C+': 'text-amber-600',   C: 'text-amber-600',
  D: 'text-orange-500', F: 'text-red-500',
}

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

interface GradeSheet {
  offeringId:   string
  course:       { code: string; title: string; creditHours: number }
  semester:     string
  academicYear: string
  submittedAt:  string | null
  submittedBy:  string
  studentCount: number
}

export default function GradingPage() {
  const [years, setYears]       = useState<AcademicYear[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving]     = useState<string | null>(null)
  const [toast, setToast]       = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  // Grade sheets review
  const [sheets, setSheets]         = useState<GradeSheet[]>([])
  const [sheetsLoading, setSheetsLoading] = useState(true)
  const [actionId, setActionId]     = useState<string | null>(null)

  // Per-year editable state
  const [drafts, setDrafts] = useState<Record<string, {
    gradingScale: string; passMark: number; boundaries: GradeBoundary[]
  }>>({})

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadSheets = useCallback(async () => {
    setSheetsLoading(true)
    const res = await fetch('/api/admin/grade-sheets')
    if (res.ok) setSheets(await res.json())
    setSheetsLoading(false)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/academics/years')
    if (res.ok) {
      const data: AcademicYear[] = await res.json()
      setYears(data)
      // Initialise drafts from fetched data
      const init: typeof drafts = {}
      for (const y of data) {
        init[y.id] = {
          gradingScale: y.gradingScale,
          passMark:     y.passMark,
          boundaries:   y.gradeBoundaries ? [...y.gradeBoundaries] : DEFAULT_BOUNDARIES.map(b => ({ ...b })),
        }
      }
      setDrafts(init)
      // Auto-expand current year
      const current = data.find(y => y.isCurrent) ?? data[0]
      if (current) setExpanded(current.id)
    }
    setLoading(false)
  }, [])

  async function sheetAction(offeringId: string, action: 'publish' | 'reject') {
    setActionId(offeringId)
    try {
      const res = await fetch('/api/admin/grade-sheets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseOfferingId: offeringId, action }),
      })
      if (res.ok) {
        showToast(action === 'publish' ? 'Grades published to students' : 'Grade sheet returned to lecturer', 'ok')
        await loadSheets()
      } else {
        showToast('Action failed', 'err')
      }
    } catch {
      showToast('Network error', 'err')
    } finally {
      setActionId(null)
    }
  }

  useEffect(() => { load(); loadSheets() }, [load, loadSheets])

  function setDraft(yearId: string, patch: Partial<typeof drafts[string]>) {
    setDrafts(prev => ({ ...prev, [yearId]: { ...prev[yearId], ...patch } }))
  }

  function updateBoundary(yearId: string, letter: string, min: number) {
    setDrafts(prev => ({
      ...prev,
      [yearId]: {
        ...prev[yearId],
        boundaries: prev[yearId].boundaries.map(b => b.letter === letter ? { ...b, min } : b),
      },
    }))
  }

  function addBoundary(yearId: string) {
    setDrafts(prev => ({
      ...prev,
      [yearId]: {
        ...prev[yearId],
        boundaries: [...prev[yearId].boundaries, { letter: '', min: 0 }],
      },
    }))
  }

  function removeBoundary(yearId: string, idx: number) {
    setDrafts(prev => ({
      ...prev,
      [yearId]: {
        ...prev[yearId],
        boundaries: prev[yearId].boundaries.filter((_, i) => i !== idx),
      },
    }))
  }

  function updateBoundaryLetter(yearId: string, idx: number, letter: string) {
    setDrafts(prev => ({
      ...prev,
      [yearId]: {
        ...prev[yearId],
        boundaries: prev[yearId].boundaries.map((b, i) => i === idx ? { ...b, letter } : b),
      },
    }))
  }

  async function save(year: AcademicYear) {
    const draft = drafts[year.id]
    if (!draft) return
    setSaving(year.id)
    try {
      const res = await fetch(`/api/academics/years/${year.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradingScale:    draft.gradingScale,
          passMark:        draft.passMark,
          gradeBoundaries: draft.boundaries,
        }),
      })
      if (res.ok) {
        const updated: AcademicYear = await res.json()
        setYears(prev => prev.map(y => y.id === updated.id ? { ...y, ...updated } : y))
        showToast(`Saved grading config for ${year.name}`, 'ok')
      } else {
        showToast('Save failed', 'err')
      }
    } catch {
      showToast('Network error', 'err')
    } finally {
      setSaving(null)
    }
  }

  function resetToDefaults(yearId: string) {
    setDrafts(prev => ({
      ...prev,
      [yearId]: { ...prev[yearId], boundaries: DEFAULT_BOUNDARIES.map(b => ({ ...b })) },
    }))
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium ${
          toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Grade Sheets for Review ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Grade Sheets for Review</h2>
          <p className="text-sm text-gray-400 mt-0.5">Lecturers have submitted these grade sheets — review and publish or return for correction</p>
        </div>

        {sheetsLoading ? (
          <div className="flex items-center gap-2 py-8 text-gray-400 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : sheets.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-2xl py-10 text-center">
            <Send className="w-7 h-7 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No grade sheets awaiting review</p>
            <p className="text-xs text-gray-300 mt-0.5">Lecturers submit grades from their Staff Portal → Course → Grade Entry</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sheets.map(sheet => (
              <div key={sheet.offeringId} className="bg-white rounded-2xl border border-amber-100 px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{sheet.course.code} — {sheet.course.title}</p>
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                      Awaiting Review
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-gray-400">{sheet.academicYear} · {sheet.semester}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Users className="w-3 h-3" /> {sheet.studentCount} students
                    </span>
                    <span className="text-xs text-gray-400">
                      Submitted by <strong className="text-gray-600">{sheet.submittedBy}</strong>
                      {sheet.submittedAt && (
                        <> on {new Date(sheet.submittedAt).toLocaleDateString()}</>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => sheetAction(sheet.offeringId, 'reject')}
                    disabled={actionId === sheet.offeringId}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {actionId === sheet.offeringId ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                    Return
                  </button>
                  <button
                    onClick={() => sheetAction(sheet.offeringId, 'publish')}
                    disabled={actionId === sheet.offeringId}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {actionId === sheet.offeringId ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Publish Grades
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Grading Configuration ── */}
      <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Grading Configuration</h2>
        <p className="text-sm text-gray-400 mt-0.5">Set the grading scale, pass mark, and grade boundaries per academic year</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-sm text-blue-800">
        <Settings2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
        <div>
          <p className="font-semibold mb-0.5">Per-year configuration</p>
          <p className="text-blue-700 text-xs leading-relaxed">
            Each academic year can have its own grading scale and grade boundaries. Changes apply to all courses and students within that year. The <strong>pass mark</strong> is the minimum score a student needs to pass a course.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : years.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <Settings2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No academic years yet. Create one in the Calendar tab first.</p>
          <a href="/admin/academics/calendar" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Go to Calendar →</a>
        </div>
      ) : (
        <div className="space-y-3">
          {years.map(year => {
            const draft   = drafts[year.id]
            const isOpen  = expanded === year.id

            return (
              <div key={year.id} className={`bg-white rounded-2xl border overflow-hidden ${year.isCurrent ? 'border-blue-200' : 'border-gray-200'}`}>
                {/* Year header */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : year.id)}
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{year.name}</p>
                        {year.isCurrent && (
                          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-semibold">Current</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {SCALE_LABELS[year.gradingScale] ?? year.gradingScale} · Pass mark: {year.passMark}%
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {year.gradeBoundaries ? `${year.gradeBoundaries.length} grade levels` : 'Default boundaries'}
                  </span>
                </button>

                {/* Editor */}
                {isOpen && draft && (
                  <div className="border-t border-gray-100 px-5 pb-6 pt-4 space-y-5">

                    {/* Scale + pass mark */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Grading Scale</label>
                        <select className={inp} value={draft.gradingScale}
                          onChange={e => setDraft(year.id, { gradingScale: e.target.value })}>
                          <option value="PERCENTAGE">Percentage (%)</option>
                          <option value="GPA_4">GPA 4.0</option>
                          <option value="GPA_5">GPA 5.0</option>
                          <option value="LETTER">Letter (A–F)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Pass Mark (%)</label>
                        <input type="number" min={0} max={100} className={inp} value={draft.passMark}
                          onChange={e => setDraft(year.id, { passMark: Number(e.target.value) })} />
                        <p className="text-xs text-gray-400 mt-1">Minimum score to pass a course</p>
                      </div>
                    </div>

                    {/* Grade boundaries */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Grade Boundaries</p>
                          <p className="text-xs text-gray-400 mt-0.5">Minimum score (%) required for each grade</p>
                        </div>
                        <button onClick={() => resetToDefaults(year.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          Reset to defaults
                        </button>
                      </div>

                      <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                        <div className="grid grid-cols-[80px_1fr_80px_40px] text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2 border-b border-gray-100">
                          <span>Grade</span>
                          <span>Label (optional)</span>
                          <span>Min %</span>
                          <span />
                        </div>
                        <div className="divide-y divide-gray-100">
                          {draft.boundaries.map((b, idx) => (
                            <div key={idx} className="grid grid-cols-[80px_1fr_80px_40px] items-center px-4 py-2 gap-2">
                              <input
                                className={`border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 ${LETTER_COLOR[b.letter] ?? 'text-gray-700'}`}
                                value={b.letter}
                                onChange={e => updateBoundaryLetter(year.id, idx, e.target.value.toUpperCase())}
                                maxLength={3}
                                placeholder="A+"
                              />
                              <span className="text-xs text-gray-400 italic">
                                {b.letter === 'F' ? 'Fail — below all others' :
                                 b.letter.startsWith('A') ? 'Excellent' :
                                 b.letter.startsWith('B') ? 'Good' :
                                 b.letter.startsWith('C') ? 'Average' :
                                 b.letter === 'D' ? 'Below average' : ''}
                              </span>
                              <input
                                type="number" min={0} max={100}
                                disabled={b.letter === 'F'}
                                value={b.min}
                                onChange={e => updateBoundary(year.id, b.letter, Number(e.target.value))}
                                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-400"
                              />
                              <button onClick={() => removeBoundary(year.id, idx)}
                                className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors text-center">
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="px-4 py-2 border-t border-gray-100">
                          <button onClick={() => addBoundary(year.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                            + Add grade level
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Save */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => save(year)}
                        disabled={saving === year.id}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                      >
                        {saving === year.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      </div>{/* end grading config */}
    </div>
  )
}
