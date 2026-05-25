'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ChevronsUp, Loader2, CheckCircle2, AlertCircle, Users,
  GraduationCap, Info, RefreshCw, ChevronDown, ChevronRight,
} from 'lucide-react'

interface Student {
  userId:          string
  studentId:       string
  name:            string
  email:           string
  level:           number
  cgpa:            number
  totalCredits:    number
  programName:     string | null
  programCode:     string | null
  requiredCredits: number | null
  eligible:        boolean
  atFinalYear:     boolean
}

interface PreviewData {
  thresholds:    Record<string, number>
  byLevel:       Record<string, Student[]>
  totalStudents: number
  totalEligible: number
}

const LEVEL_LABEL: Record<number, string> = {
  100: 'Year 1 (Level 100)',
  200: 'Year 2 (Level 200)',
  300: 'Year 3 (Level 300)',
  400: 'Year 4 (Level 400)',
}

export default function PromotionPage() {
  const [data, setData]           = useState<PreviewData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [expanded, setExpanded]   = useState<Set<number>>(new Set([100, 200, 300]))
  const [promoting, setPromoting] = useState(false)
  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [done, setDone]           = useState(false)

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setDone(false)
    setSelected(new Set())
    const res = await fetch('/api/admin/students/promotion-preview')
    if (res.ok) {
      const d: PreviewData = await res.json()
      setData(d)
      // Pre-select all eligible students
      const eligibleIds = Object.values(d.byLevel)
        .flat()
        .filter(s => s.eligible)
        .map(s => s.userId)
      setSelected(new Set(eligibleIds))
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function toggleStudent(userId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  function toggleLevel(level: number) {
    if (!data) return
    const students = data.byLevel[level] ?? []
    const allSelected = students.every(s => selected.has(s.userId))
    setSelected(prev => {
      const next = new Set(prev)
      for (const s of students) {
        if (allSelected) next.delete(s.userId)
        else next.add(s.userId)
      }
      return next
    })
  }

  function toggleExpanded(level: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  }

  async function promote() {
    if (selected.size === 0) return
    setPromoting(true)
    try {
      const res = await fetch('/api/admin/students/promote', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [...selected] }),
      })
      if (res.ok) {
        const { promoted, skipped } = await res.json()
        showToast(
          `${promoted} student${promoted !== 1 ? 's' : ''} promoted successfully${skipped > 0 ? ` · ${skipped} skipped (already at max level)` : ''}`,
          'ok',
        )
        setDone(true)
        await load()
      } else {
        showToast('Promotion failed', 'err')
      }
    } catch {
      showToast('Network error', 'err')
    } finally {
      setPromoting(false)
    }
  }

  const promotableLevels = data
    ? Object.keys(data.byLevel).map(Number).filter(l => l < 400).sort()
    : []

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
          <h2 className="text-xl font-bold text-gray-900">Year Promotion</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Advance eligible students to the next academic level at the end of the year
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={promote}
            disabled={selected.size === 0 || promoting || loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors"
          >
            {promoting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <ChevronsUp className="w-4 h-4" />
            }
            Promote {selected.size > 0 ? `${selected.size} Students` : ''}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 text-sm text-indigo-800">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-400" />
        <div>
          <p className="font-semibold mb-0.5">How promotion works</p>
          <p className="text-indigo-700 text-xs leading-relaxed">
            Students are <strong>pre-selected</strong> if they have earned the minimum credit hours for their level
            (100→200: 30 credits · 200→300: 60 credits · 300→400: 90 credits) and have a CGPA above 0.
            You can manually adjust the selection before confirming. Level 400 students are excluded — use graduation workflows instead.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
            <p className="text-2xl font-bold text-gray-900">{data.totalStudents}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total active students</p>
          </div>
          <div className="bg-white rounded-2xl border border-indigo-100 px-5 py-4">
            <p className="text-2xl font-bold text-indigo-600">{data.totalEligible}</p>
            <p className="text-xs text-gray-400 mt-0.5">Automatically eligible</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
            <p className="text-2xl font-bold text-gray-900">{selected.size}</p>
            <p className="text-xs text-gray-400 mt-0.5">Selected for promotion</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading student data…
        </div>
      ) : !data || promotableLevels.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <GraduationCap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No promotable students found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promotableLevels.map(level => {
            const students   = data.byLevel[level] ?? []
            const isOpen     = expanded.has(level)
            const eligible   = students.filter(s => s.eligible).length
            const levelSelected = students.filter(s => selected.has(s.userId)).length
            const allChecked = students.length > 0 && students.every(s => selected.has(s.userId))
            const someChecked = !allChecked && students.some(s => selected.has(s.userId))

            return (
              <div key={level} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Level header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                  <button
                    onClick={() => toggleExpanded(level)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {isOpen
                      ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    }
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {LEVEL_LABEL[level] ?? `Level ${level}`}
                        <span className="ml-2 text-xs font-normal text-gray-400">→ Level {level + 100}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {students.length} students · {eligible} eligible · {levelSelected} selected
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {eligible > 0 && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-semibold">
                        {eligible} eligible
                      </span>
                    )}
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={el => { if (el) el.indeterminate = someChecked }}
                        onChange={() => toggleLevel(level)}
                        className="w-3.5 h-3.5 rounded accent-indigo-600"
                      />
                      Select all
                    </label>
                  </div>
                </div>

                {/* Student rows */}
                {isOpen && (
                  <div className="divide-y divide-gray-50">
                    {students.map(student => (
                      <label
                        key={student.userId}
                        className={`flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors ${
                          selected.has(student.userId) ? 'bg-indigo-50/40' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(student.userId)}
                          onChange={() => toggleStudent(student.userId)}
                          className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                            <span className="text-xs text-gray-400">{student.studentId}</span>
                            {student.eligible ? (
                              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                Eligible
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                {student.totalCredits}/{student.requiredCredits ?? '—'} credits
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {student.programName ?? 'No program'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 text-right">
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {student.cgpa > 0 ? student.cgpa.toFixed(2) : '—'}
                            </p>
                            <p className="text-[10px] text-gray-400">CGPA</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{student.totalCredits}</p>
                            <p className="text-[10px] text-gray-400">credits</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Final-year students (level 400) info */}
          {data.byLevel[400] && data.byLevel[400].length > 0 && (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-600">
                  Level 400 — Final Year ({data.byLevel[400].length} students)
                </p>
              </div>
              <p className="text-xs text-gray-400">
                These students are at the final year and are not included in year promotion. Use graduation/completion workflows to mark them as graduated.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Confirm footer */}
      {!loading && selected.size > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-100 -mx-6 px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            <strong className="text-gray-900">{selected.size} students</strong> selected for promotion
          </p>
          <button
            onClick={promote}
            disabled={promoting}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
          >
            {promoting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <ChevronsUp className="w-4 h-4" />
            }
            Confirm Promotion
          </button>
        </div>
      )}
    </div>
  )
}
