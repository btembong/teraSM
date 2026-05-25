'use client'

import { useEffect, useState, useCallback } from 'react'
import { GraduationCap, Save, Send, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface GradeBoundary { letter: string; min: number }

interface StudentGrade {
  id: string
  firstName: string
  lastName: string
  email: string
  grade: {
    id: string
    caScore:     number | null
    examScore:   number | null
    totalScore:  number | null
    letterGrade: string | null
    gradePoint:  number | null
    remark:      string | null
    publishedAt: string | null
  } | null
}

interface OfferingInfo {
  id: string
  course: { code: string; title: string; creditHours: number }
  gradingScale: string
  passMark: number
  gradeBoundaries: GradeBoundary[] | null
}

interface Draft {
  caScore: string
  examScore: string
}

const LETTER_COLOR: Record<string, string> = {
  'A+': 'text-emerald-600', 'A': 'text-emerald-600',
  'B+': 'text-blue-600',    'B': 'text-blue-600',
  'C+': 'text-amber-600',   'C': 'text-amber-600',
  'D': 'text-orange-500',   'F': 'text-red-500',
}

function scoreToLetter(score: number, bounds: GradeBoundary[]): string {
  const sorted = [...bounds].sort((a, b) => b.min - a.min)
  for (const b of sorted) { if (score >= b.min) return b.letter }
  return 'F'
}

function letterToGP(l: string): number {
  const map: Record<string, number> = { 'A+': 5, A: 4, 'B+': 3.5, B: 3, 'C+': 2.5, C: 2, 'D+': 1.5, D: 1, E: 0.5, F: 0 }
  return map[l] ?? 0
}

function previewGrade(ca: string, exam: string, bounds: GradeBoundary[]): { total: number; letter: string; gp: number } | null {
  const caNum   = ca   !== '' ? parseFloat(ca)   : null
  const examNum = exam !== '' ? parseFloat(exam) : null
  if (caNum === null && examNum === null) return null
  const total = (caNum ?? 0) + (examNum ?? 0)
  const letter = scoreToLetter(total, bounds)
  return { total, letter, gp: letterToGP(letter) }
}

const DEFAULT_BOUNDARIES: GradeBoundary[] = [
  { letter: 'A+', min: 95 }, { letter: 'A', min: 90 },
  { letter: 'B+', min: 85 }, { letter: 'B', min: 80 },
  { letter: 'C+', min: 75 }, { letter: 'C', min: 70 },
  { letter: 'D',  min: 60 }, { letter: 'F', min: 0  },
]

const inp = 'w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white'

export default function AcademicGradesPanel({ offeringId }: { offeringId: string }) {
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [offering, setOffering] = useState<OfferingInfo | null>(null)
  const [students, setStudents] = useState<StudentGrade[]>([])
  const [drafts, setDrafts]     = useState<Record<string, Draft>>({})
  const [saving, setSaving]     = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [toast, setToast]       = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/academic-grades?courseOfferingId=${offeringId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOffering(data.offering)
      setStudents(data.students)
      // Init drafts from existing grades
      const d: Record<string, Draft> = {}
      for (const s of data.students) {
        d[s.id] = {
          caScore:   s.grade?.caScore?.toString()   ?? '',
          examScore: s.grade?.examScore?.toString() ?? '',
        }
      }
      setDrafts(d)
    } catch {
      showToast('Failed to load academic grades', 'err')
    } finally {
      setLoading(false)
    }
  }, [offeringId])

  useEffect(() => { if (open) load() }, [open, load])

  async function saveGrade(studentId: string) {
    const draft = drafts[studentId]
    setSaving(studentId)
    try {
      const res = await fetch('/api/staff/academic-grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseOfferingId: offeringId,
          studentId,
          caScore:   draft.caScore   !== '' ? parseFloat(draft.caScore)   : null,
          examScore: draft.examScore !== '' ? parseFloat(draft.examScore) : null,
        }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, grade: updated } : s))
      showToast('Grade saved', 'ok')
    } catch {
      showToast('Failed to save grade', 'err')
    } finally {
      setSaving(null)
    }
  }

  async function publishAll() {
    if (!confirm('Publish all grades? This will update student CGPAs and notify them.')) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/staff/academic-grades/publish?courseOfferingId=${offeringId}`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      showToast(`${data.published} grade(s) published — ${data.studentsUpdated} CGPA(s) updated`, 'ok')
      await load()
    } catch {
      showToast('Failed to publish grades', 'err')
    } finally {
      setPublishing(false)
    }
  }

  const bounds = offering?.gradeBoundaries ?? DEFAULT_BOUNDARIES

  const unpublishedCount = students.filter(s => s.grade && !s.grade.publishedAt).length
  const publishedCount   = students.filter(s => s.grade?.publishedAt).length

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <GraduationCap className="w-4 h-4 text-indigo-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-slate-900 text-sm">Academic Grades (Transcript)</p>
          <p className="text-xs text-slate-400 mt-0.5">Enter CA + exam scores to generate official grades and update student CGPAs</p>
        </div>
        {!loading && students.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {publishedCount > 0 && (
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{publishedCount} published</span>
            )}
            {unpublishedCount > 0 && (
              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">{unpublishedCount} pending</span>
            )}
          </div>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {/* Toast */}
          {toast && (
            <div className={`mx-6 mt-4 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm ${
              toast.type === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
            }`}>
              {toast.type === 'ok'
                ? <CheckCircle2 className="w-4 h-4" />
                : <AlertCircle  className="w-4 h-4" />}
              {toast.msg}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading grades…</span>
            </div>
          ) : students.length === 0 ? (
            <p className="text-center py-10 text-sm text-slate-400">No enrolled students found.</p>
          ) : (
            <>
              <div className="px-6 py-3 flex items-center justify-between border-b border-gray-50">
                <p className="text-xs text-slate-500">
                  {students.length} students · {offering?.course.creditHours} credit hours · Scale: {offering?.gradingScale}
                </p>
                <button
                  onClick={publishAll}
                  disabled={publishing || unpublishedCount === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Publish All Grades
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 bg-slate-50/50">
                      <th className="text-left px-6 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                      <th className="text-center px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">CA Score</th>
                      <th className="text-center px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Exam Score</th>
                      <th className="text-center px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total</th>
                      <th className="text-center px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Grade</th>
                      <th className="text-center px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">GP</th>
                      <th className="text-center px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map(student => {
                      const draft = drafts[student.id] ?? { caScore: '', examScore: '' }
                      const preview = previewGrade(draft.caScore, draft.examScore, bounds as GradeBoundary[])
                      const isPublished = !!student.grade?.publishedAt
                      const isDirty = student.grade
                        ? draft.caScore   !== (student.grade.caScore?.toString()   ?? '') ||
                          draft.examScore !== (student.grade.examScore?.toString() ?? '')
                        : draft.caScore !== '' || draft.examScore !== ''

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-6 py-3">
                            <p className="font-semibold text-slate-900">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-slate-400">{student.email}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              disabled={isPublished}
                              className={inp}
                              placeholder="—"
                              value={draft.caScore}
                              onChange={e => setDrafts(prev => ({ ...prev, [student.id]: { ...prev[student.id], caScore: e.target.value } }))}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              disabled={isPublished}
                              className={inp}
                              placeholder="—"
                              value={draft.examScore}
                              onChange={e => setDrafts(prev => ({ ...prev, [student.id]: { ...prev[student.id], examScore: e.target.value } }))}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {preview ? (
                              <span className="font-bold text-slate-900">{preview.total.toFixed(1)}</span>
                            ) : student.grade?.totalScore !== null && student.grade?.totalScore !== undefined ? (
                              <span className="font-bold text-slate-900">{student.grade.totalScore.toFixed(1)}</span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {preview ? (
                              <span className={`font-bold text-sm ${LETTER_COLOR[preview.letter] ?? 'text-slate-600'}`}>
                                {preview.letter}
                              </span>
                            ) : student.grade?.letterGrade ? (
                              <span className={`font-bold text-sm ${LETTER_COLOR[student.grade.letterGrade] ?? 'text-slate-600'}`}>
                                {student.grade.letterGrade}
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center text-xs font-mono text-slate-500">
                            {preview ? preview.gp.toFixed(1)
                            : student.grade?.gradePoint !== null && student.grade?.gradePoint !== undefined
                              ? student.grade.gradePoint.toFixed(1)
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isPublished ? (
                              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Published</span>
                            ) : student.grade ? (
                              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">Draft</span>
                            ) : (
                              <span className="text-xs text-slate-300">Not entered</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {!isPublished && isDirty && (
                              <button
                                onClick={() => saveGrade(student.id)}
                                disabled={saving === student.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 transition-colors"
                              >
                                {saving === student.id
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <Save className="w-3 h-3" />}
                                Save
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Grade boundary legend */}
              <div className="px-6 py-3 border-t border-gray-50 bg-slate-50/30">
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest mb-2">Grading Scale</p>
                <div className="flex flex-wrap gap-2">
                  {(bounds as GradeBoundary[]).map((b, i, arr) => {
                    const max = i === 0 ? 100 : arr[i - 1].min - 1
                    return (
                      <span key={b.letter} className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-100 ${LETTER_COLOR[b.letter] ?? 'text-slate-600'}`}>
                        {b.letter}: {b.min}–{max}
                      </span>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
