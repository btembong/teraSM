'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, Save, Send, CheckCircle2, AlertCircle,
  GraduationCap, Info, RotateCcw,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface GradeBoundary { letter: string; min: number }

interface StudentGrade {
  id:        string
  firstName: string | null
  lastName:  string | null
  email:     string
  grade: {
    caScore:     number | null
    examScore:   number | null
    totalScore:  number | null
    letterGrade: string | null
    gradePoint:  number | null
    remark:      string | null
    status:      string
  } | null
}

interface ResitStudent {
  resitId:       string
  studentId:     string
  student:       { id: string; firstName: string | null; lastName: string | null; email: string } | null
  caScore:       number | null
  examScore:     number | null
  totalScore:    number | null
  letterGrade:   string | null
  gradePoint:    number | null
  remark:        string | null
  isCapped:      boolean
  capGrade:      string
  status:        string
  originalGrade: string | null
  originalTotal: number | null
}

interface OfferingInfo {
  id:              string
  course:          { code: string; title: string; creditHours: number }
  gradingScale:    string
  passMark:        number
  gradeBoundaries: GradeBoundary[] | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GRADE_ORDER = ['F', 'D', 'C', 'C+', 'B', 'B+', 'A', 'A+']

function applyGradeCap(letter: string, capGrade: string): string {
  const idx    = GRADE_ORDER.indexOf(letter)
  const capIdx = GRADE_ORDER.indexOf(capGrade)
  if (idx === -1 || capIdx === -1) return letter
  return idx > capIdx ? capGrade : letter
}

function computeLetter(total: number, boundaries: GradeBoundary[] | null): string {
  if (!boundaries || boundaries.length === 0) {
    if (total >= 90) return 'A+'
    if (total >= 80) return 'A'
    if (total >= 70) return 'B'
    if (total >= 60) return 'C'
    if (total >= 50) return 'D'
    return 'F'
  }
  const sorted = [...boundaries].sort((a, b) => b.min - a.min)
  for (const b of sorted) if (total >= b.min) return b.letter
  return 'F'
}

const LETTER_COLOR: Record<string, string> = {
  'A+': 'text-emerald-600', A: 'text-emerald-600',
  'B+': 'text-blue-600',    B: 'text-blue-600',
  'C+': 'text-amber-500',   C: 'text-amber-500',
  D: 'text-orange-500',     F: 'text-red-500',
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-600',
  PENDING:   'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-amber-50 text-amber-700 border border-amber-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

const inp = 'w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400'

// ─── Page ────────────────────────────────────────────────────────────────────

type Tab = 'academic' | 'resit'

export default function GradeEntryPage() {
  const params      = useParams()
  const offeringId  = params.offeringId as string
  const [tab, setTab] = useState<Tab>('academic')

  const [offering, setOffering]     = useState<OfferingInfo | null>(null)
  const [students, setStudents]     = useState<StudentGrade[]>([])
  const [resitStudents, setResitStudents] = useState<ResitStudent[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast]           = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [drafts, setDrafts]         = useState<Record<string, { ca: string; exam: string }>>({})
  const [resitExams, setResitExams] = useState<Record<string, string>>({}) // resitId → examScore

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [mainRes, resitRes] = await Promise.all([
      fetch(`/api/staff/academic-grades?courseOfferingId=${offeringId}`),
      fetch(`/api/staff/resit-grades?courseOfferingId=${offeringId}`),
    ])

    if (mainRes.ok) {
      const data = await mainRes.json()
      setOffering(data.offering)
      setStudents(data.students)
      const init: typeof drafts = {}
      for (const s of data.students as StudentGrade[]) {
        init[s.id] = {
          ca:   s.grade?.caScore   != null ? String(s.grade.caScore)   : '',
          exam: s.grade?.examScore != null ? String(s.grade.examScore) : '',
        }
      }
      setDrafts(init)
    }

    if (resitRes.ok) {
      const data = await resitRes.json()
      if (!offering) setOffering(data.offering)
      setResitStudents(data.resits)
      const init: typeof resitExams = {}
      for (const r of data.resits as ResitStudent[]) {
        init[r.resitId] = r.examScore != null ? String(r.examScore) : ''
      }
      setResitExams(init)
    }

    setLoading(false)
  }, [offeringId])

  useEffect(() => { load() }, [load])

  // ── Academic grade actions ──────────────────────────────────────────────────

  function setField(studentId: string, field: 'ca' | 'exam', value: string) {
    setDrafts(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }))
  }

  async function saveOne(studentId: string) {
    const d = drafts[studentId]
    if (!d) return
    setSaving(studentId)
    try {
      const res = await fetch('/api/staff/academic-grades', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseOfferingId: offeringId,
          studentId,
          caScore:   d.ca   !== '' ? parseFloat(d.ca)   : null,
          examScore: d.exam !== '' ? parseFloat(d.exam) : null,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, grade: updated } : s))
        showToast('Saved', 'ok')
      } else showToast('Save failed', 'err')
    } catch { showToast('Network error', 'err') }
    setSaving(null)
  }

  async function saveAll() {
    setSaving('__all__')
    let ok = 0
    for (const s of students) {
      const d = drafts[s.id]
      if (!d) continue
      try {
        const res = await fetch('/api/staff/academic-grades', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseOfferingId: offeringId, studentId: s.id,
            caScore:   d.ca   !== '' ? parseFloat(d.ca)   : null,
            examScore: d.exam !== '' ? parseFloat(d.exam) : null,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          setStudents(prev => prev.map(x => x.id === s.id ? { ...x, grade: updated } : x))
          ok++
        }
      } catch { /* continue */ }
    }
    setSaving(null)
    showToast(`Saved ${ok} students`, 'ok')
  }

  async function submitForReview() {
    setSubmitting(true)
    await saveAll()
    try {
      const res = await fetch(`/api/staff/academic-grades/submit?courseOfferingId=${offeringId}`, { method: 'POST' })
      if (res.ok) {
        const { submitted } = await res.json()
        showToast(`${submitted} grade${submitted !== 1 ? 's' : ''} submitted for review`, 'ok')
        await load()
      } else showToast('Submission failed', 'err')
    } catch { showToast('Network error', 'err') }
    setSubmitting(false)
  }

  // ── Resit grade actions ─────────────────────────────────────────────────────

  async function saveResitOne(resitId: string, isCapped: boolean, capGrade: string) {
    const examStr = resitExams[resitId]
    if (!examStr || examStr === '') { showToast('Enter exam score first', 'err'); return }
    setSaving(`resit_${resitId}`)
    try {
      const res = await fetch('/api/staff/resit-grades', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resitId, examScore: parseFloat(examStr) }),
      })
      if (res.ok) {
        const updated = await res.json()
        setResitStudents(prev => prev.map(r => r.resitId === resitId
          ? { ...r, examScore: updated.examScore, totalScore: updated.totalScore, letterGrade: updated.letterGrade, gradePoint: updated.gradePoint, remark: updated.remark }
          : r
        ))
        showToast('Resit score saved', 'ok')
      } else showToast('Save failed', 'err')
    } catch { showToast('Network error', 'err') }
    setSaving(null)
  }

  async function submitResits() {
    setSubmitting(true)
    // Save all first
    for (const r of resitStudents) {
      if (resitExams[r.resitId]) {
        await fetch('/api/staff/resit-grades', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resitId: r.resitId, examScore: parseFloat(resitExams[r.resitId]) }),
        })
      }
    }
    try {
      const res = await fetch(`/api/staff/resit-grades/submit?courseOfferingId=${offeringId}`, { method: 'POST' })
      if (res.ok) {
        const { submitted } = await res.json()
        showToast(`${submitted} resit result${submitted !== 1 ? 's' : ''} submitted for admin review`, 'ok')
        await load()
      } else showToast('Submit failed', 'err')
    } catch { showToast('Network error', 'err') }
    setSubmitting(false)
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const allStatuses  = students.map(s => s.grade?.status ?? 'DRAFT')
  const isPublished  = allStatuses.every(s => s === 'PUBLISHED')
  const isSubmitted  = !isPublished && allStatuses.some(s => s === 'SUBMITTED')
  const hasAnyScore  = students.some(s => { const d = drafts[s.id]; return d && (d.ca !== '' || d.exam !== '') })
  const hasResits    = resitStudents.length > 0
  const resitHasScore = resitStudents.some(r => resitExams[r.resitId] !== '')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading grade sheet…
      </div>
    )
  }

  if (!offering) return <div className="text-center py-24 text-gray-400">Offering not found.</div>

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
      <div className="flex items-start gap-3">
        <Link href={`/staff/courses/${offeringId}`} className="mt-1 p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Grade Entry</h1>
          <p className="text-gray-500 text-sm mt-0.5">{offering.course.code} · {offering.course.title}</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('academic')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'academic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Academic Grades
          {isSubmitted && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
          {isPublished  && <span className="w-2 h-2 bg-emerald-500 rounded-full" />}
        </button>
        <button
          onClick={() => setTab('resit')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'resit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Resit Grades
          {hasResits && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
              {resitStudents.length}
            </span>
          )}
        </button>
      </div>

      {/* ── ACADEMIC GRADES TAB ── */}
      {tab === 'academic' && (
        <AcademicTab
          students={students}
          offering={offering}
          drafts={drafts}
          setField={setField}
          saveOne={saveOne}
          saveAll={saveAll}
          submitForReview={submitForReview}
          saving={saving}
          submitting={submitting}
          isPublished={isPublished}
          isSubmitted={isSubmitted}
          hasAnyScore={hasAnyScore}
        />
      )}

      {/* ── RESIT TAB ── */}
      {tab === 'resit' && (
        <ResitTab
          resitStudents={resitStudents}
          offering={offering}
          resitExams={resitExams}
          setResitExam={(id, v) => setResitExams(prev => ({ ...prev, [id]: v }))}
          saveResitOne={saveResitOne}
          submitResits={submitResits}
          saving={saving}
          submitting={submitting}
          resitHasScore={resitHasScore}
        />
      )}
    </div>
  )
}

// ─── Academic Grades Tab ──────────────────────────────────────────────────────

function AcademicTab({ students, offering, drafts, setField, saveOne, saveAll, submitForReview, saving, submitting, isPublished, isSubmitted, hasAnyScore }: {
  students: StudentGrade[]
  offering: OfferingInfo
  drafts: Record<string, { ca: string; exam: string }>
  setField: (id: string, f: 'ca' | 'exam', v: string) => void
  saveOne: (id: string) => void
  saveAll: () => void
  submitForReview: () => void
  saving: string | null
  submitting: boolean
  isPublished: boolean
  isSubmitted: boolean
  hasAnyScore: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Status banners */}
      {isSubmitted && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 text-sm text-amber-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold mb-0.5">Awaiting admin review</p>
            <p className="text-xs text-amber-700">Submitted. The registrar will publish these grades to students.</p>
          </div>
        </div>
      )}
      {isPublished && (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
          <div>
            <p className="font-semibold mb-0.5">Grades published</p>
            <p className="text-xs text-emerald-700">Students can now see their results. Contact the registrar for corrections.</p>
          </div>
        </div>
      )}
      {!isSubmitted && !isPublished && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-sm text-blue-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
          <p className="text-xs text-blue-700">
            Enter <strong>CA</strong> and <strong>Exam</strong> scores. Save draft any time — submit when all scores are ready. Pass mark: <strong>{offering.passMark}%</strong>.
          </p>
        </div>
      )}

      {/* Grade table */}
      {students.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl text-gray-400">
          <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No enrolled students.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-500" />
            <p className="font-semibold text-gray-900 text-sm">Grade Sheet — {students.length} students</p>
            <span className="ml-auto text-xs text-gray-400">Pass mark: {offering.passMark}%</span>
            {!isPublished && (
              <div className="flex items-center gap-2">
                <button onClick={saveAll} disabled={saving === '__all__' || submitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                  {saving === '__all__' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Draft
                </button>
                <button onClick={submitForReview} disabled={!hasAnyScore || submitting || saving !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
                  {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Submit
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Student</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">CA (/40)</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Exam (/60)</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Grade</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Result</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student, idx) => {
                  const d       = drafts[student.id] ?? { ca: '', exam: '' }
                  const locked  = student.grade?.status === 'SUBMITTED' || student.grade?.status === 'PUBLISHED'
                  const caVal   = d.ca   !== '' ? parseFloat(d.ca)   : null
                  const examVal = d.exam !== '' ? parseFloat(d.exam) : null
                  const total   = caVal !== null && examVal !== null ? caVal + examVal
                                : caVal !== null ? caVal : examVal !== null ? examVal : null
                  const letter  = total !== null ? computeLetter(total, offering.gradeBoundaries) : null
                  const remark  = letter === 'F' ? 'FAIL' : letter ? 'PASS' : null

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-gray-400">{student.email}</p>
                      </td>
                      <td className="text-center px-4 py-3">
                        <input type="number" min={0} max={40} step={0.5} className={inp}
                          value={d.ca} disabled={locked}
                          onChange={e => setField(student.id, 'ca', e.target.value)} placeholder="—" />
                      </td>
                      <td className="text-center px-4 py-3">
                        <input type="number" min={0} max={60} step={0.5} className={inp}
                          value={d.exam} disabled={locked}
                          onChange={e => setField(student.id, 'exam', e.target.value)} placeholder="—" />
                      </td>
                      <td className="text-center px-4 py-3">
                        {total !== null
                          ? <span className={`font-bold text-sm ${total >= offering.passMark ? 'text-gray-900' : 'text-red-500'}`}>{total.toFixed(1)}</span>
                          : <span className="text-gray-300 text-sm">—</span>}
                      </td>
                      <td className="text-center px-4 py-3">
                        {letter
                          ? <span className={`font-bold text-base ${LETTER_COLOR[letter] ?? 'text-gray-700'}`}>{letter}</span>
                          : <span className="text-gray-300 text-sm">—</span>}
                      </td>
                      <td className="text-center px-4 py-3">
                        {remark
                          ? <span className={`text-xs font-semibold ${remark === 'PASS' ? 'text-emerald-600' : 'text-red-500'}`}>{remark}</span>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[student.grade?.status ?? 'DRAFT']}`}>
                          {student.grade?.status ?? 'DRAFT'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!locked && (
                          <button onClick={() => saveOne(student.id)} disabled={saving === student.id || saving === '__all__'}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50">
                            {saving === student.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade boundaries */}
      {offering.gradeBoundaries && (
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Grade Boundaries</p>
          <div className="flex flex-wrap gap-2">
            {[...offering.gradeBoundaries].sort((a, b) => b.min - a.min).map(b => (
              <span key={b.letter} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-xs border border-gray-100">
                <span className={`font-bold ${LETTER_COLOR[b.letter] ?? 'text-gray-700'}`}>{b.letter}</span>
                <span className="text-gray-400">≥ {b.min}%</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Resit Tab ────────────────────────────────────────────────────────────────

function ResitTab({ resitStudents, offering, resitExams, setResitExam, saveResitOne, submitResits, saving, submitting, resitHasScore }: {
  resitStudents: ResitStudent[]
  offering: OfferingInfo
  resitExams: Record<string, string>
  setResitExam: (id: string, v: string) => void
  saveResitOne: (id: string, isCapped: boolean, capGrade: string) => void
  submitResits: () => void
  saving: string | null
  submitting: boolean
  resitHasScore: boolean
}) {
  if (resitStudents.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
        <RotateCcw className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No resit students for this course</p>
        <p className="text-xs text-gray-300 mt-1">
          The registrar marks failed students eligible from Admin → Academics → Resits
        </p>
      </div>
    )
  }

  const allSubmitted = resitStudents.every(r => r.status === 'SUBMITTED' || r.status === 'PUBLISHED')

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 text-sm text-amber-800">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
        <div>
          <p className="font-semibold mb-0.5">Resit exam scores</p>
          <p className="text-xs text-amber-700">
            CA scores are carried over from the original exam. Enter only the <strong>resit exam score</strong>.
            The system applies the grade cap configured by the registrar. Submit when all scores are entered.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-amber-500" />
          <p className="font-semibold text-gray-900 text-sm">Resit Grade Sheet — {resitStudents.length} students</p>
          {!allSubmitted && (
            <button onClick={submitResits} disabled={!resitHasScore || submitting}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition-colors">
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Submit All
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Student</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Original Grade</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">CA (carried)</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Resit Exam</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">New Total</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Grade (capped)</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Result</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {resitStudents.map(r => {
                const locked     = r.status === 'SUBMITTED' || r.status === 'PUBLISHED'
                const examStr    = resitExams[r.resitId] ?? ''
                const examVal    = examStr !== '' ? parseFloat(examStr) : null
                const ca         = r.caScore ?? 0
                const total      = examVal !== null ? ca + examVal : r.totalScore
                const rawLetter  = total !== null ? computeLetter(total, offering.gradeBoundaries) : null
                const letter     = rawLetter && r.isCapped ? applyGradeCap(rawLetter, r.capGrade) : rawLetter
                const remark     = letter && letter !== 'F' ? 'PASS' : letter === 'F' ? 'FAIL' : null
                const studentName = r.student
                  ? [r.student.firstName, r.student.lastName].filter(Boolean).join(' ') || r.student.email
                  : r.studentId

                return (
                  <tr key={r.resitId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">{studentName}</p>
                      <p className="text-xs text-gray-400">{r.student?.email}</p>
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className="font-bold text-red-500">{r.originalGrade ?? 'F'}</span>
                      <span className="text-xs text-gray-400 block">{r.originalTotal?.toFixed(1) ?? '—'}</span>
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className="font-medium text-gray-600">{r.caScore ?? '—'}</span>
                      <span className="text-xs text-gray-400 block">carried</span>
                    </td>
                    <td className="text-center px-4 py-3">
                      <input type="number" min={0} max={60} step={0.5}
                        className={inp} value={examStr} disabled={locked}
                        onChange={e => setResitExam(r.resitId, e.target.value)} placeholder="—" />
                    </td>
                    <td className="text-center px-4 py-3">
                      {total !== null
                        ? <span className={`font-bold text-sm ${total >= offering.passMark ? 'text-gray-900' : 'text-red-500'}`}>{total.toFixed(1)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="text-center px-4 py-3">
                      {letter
                        ? <div>
                            <span className={`font-bold text-base ${LETTER_COLOR[letter] ?? 'text-gray-700'}`}>{letter}</span>
                            {r.isCapped && rawLetter !== letter && (
                              <span className="text-[10px] text-gray-400 block">capped</span>
                            )}
                          </div>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="text-center px-4 py-3">
                      {remark
                        ? <span className={`text-xs font-semibold ${remark === 'PASS' ? 'text-emerald-600' : 'text-red-500'}`}>{remark}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!locked && (
                        <button onClick={() => saveResitOne(r.resitId, r.isCapped, r.capGrade)}
                          disabled={saving === `resit_${r.resitId}`}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50">
                          {saving === `resit_${r.resitId}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
