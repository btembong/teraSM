'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Calendar, Plus, ChevronDown, ChevronRight, Rocket,
  CheckCircle2, Clock, AlertCircle, X, CalendarDays, Sunset, Trash2,
} from 'lucide-react'

interface Semester {
  id: string
  name: string
  termType: string
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
  startDate: string
  endDate: string
  isCurrent: boolean
  launchedAt: string | null
  registrationOpen: string | null
  registrationClose: string | null
  addDropDeadline: string | null
  maxCreditsPerStudent: number
}
interface Holiday {
  id: string; name: string; date: string; endDate: string | null; holidayType: string
}
interface GradeBoundary { letter: string; min: number }
interface AcademicYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
  gradingScale: string
  passMark: number
  gradeBoundaries: GradeBoundary[] | null
  semesters: Semester[]
}

const DEFAULT_BOUNDARIES: GradeBoundary[] = [
  { letter: 'A', min: 90 },
  { letter: 'B', min: 80 },
  { letter: 'C', min: 70 },
  { letter: 'D', min: 60 },
  { letter: 'F', min: 0  },
]

const SEM_STATUS: Record<string, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  UPCOMING:  { label: 'Upcoming',  cls: 'bg-gray-100 text-gray-600',                             Icon: Clock },
  ACTIVE:    { label: 'Active',    cls: 'bg-green-50 text-green-700 border border-green-200',     Icon: CheckCircle2 },
  COMPLETED: { label: 'Completed', cls: 'bg-blue-50 text-blue-600',                              Icon: CheckCircle2 },
}

const inputCls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function AcademicCalendarPage() {
  const [years, setYears]               = useState<AcademicYear[]>([])
  const [loading, setLoading]           = useState(true)
  const [expanded, setExpanded]         = useState<string | null>(null)
  const [showYearForm, setShowYearForm] = useState(false)
  const [showSemForm, setShowSemForm]   = useState<string | null>(null)
  const [savingYear, setSavingYear]     = useState(false)
  const [savingSem, setSavingSem]       = useState(false)
  const [launching, setLaunching]       = useState<string | null>(null)
  const [confirmLaunch, setConfirmLaunch] = useState<Semester & { yearName: string } | null>(null)
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [gradingOpen, setGradingOpen]   = useState<string | null>(null)
  const [boundaries, setBoundaries]     = useState<Record<string, GradeBoundary[]>>({})
  const [savingGrade, setSavingGrade]   = useState(false)
  // Holidays
  const [holidays, setHolidays]         = useState<Record<string, Holiday[]>>({})
  const [holidayOpen, setHolidayOpen]   = useState<string | null>(null)
  const [holidayForm, setHolidayForm]   = useState({ name: '', date: '', endDate: '', holidayType: 'PUBLIC' })
  const [savingHoliday, setSavingHoliday] = useState(false)

  const [yearForm, setYearForm] = useState({
    name: '', startDate: '', endDate: '', gradingScale: 'PERCENTAGE', passMark: 50,
  })
  const [semForm, setSemForm] = useState({
    name: 'FIRST', termType: 'SEMESTER', startDate: '', endDate: '',
    registrationOpen: '', registrationClose: '', addDropDeadline: '', maxCreditsPerStudent: 21,
  })

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/academics/years')
    if (res.ok) setYears(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (years.length > 0 && !expanded) {
      const current = years.find(y => y.isCurrent) ?? years[0]
      setExpanded(current.id)
    }
  }, [years, expanded])

  async function createYear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingYear(true)
    const res = await fetch('/api/academics/years', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(yearForm),
    })
    if (res.ok) {
      setShowYearForm(false)
      setYearForm({ name: '', startDate: '', endDate: '', gradingScale: 'PERCENTAGE', passMark: 50 })
      showToast('Academic year created', 'success')
      load()
    } else {
      showToast('Failed to create year', 'error')
    }
    setSavingYear(false)
  }

  async function createSemester(e: React.FormEvent, yearId: string) {
    e.preventDefault()
    setSavingSem(true)
    const res = await fetch('/api/academics/years/semesters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...semForm, academicYearId: yearId }),
    })
    if (res.ok) {
      setShowSemForm(null)
      setSemForm({ name: 'FIRST', termType: 'SEMESTER', startDate: '', endDate: '', registrationOpen: '', registrationClose: '', addDropDeadline: '', maxCreditsPerStudent: 21 })
      showToast('Semester added', 'success')
      load()
    } else {
      showToast('Failed to add semester', 'error')
    }
    setSavingSem(false)
  }

  async function launchSemester(semId: string) {
    setLaunching(semId)
    const res  = await fetch(`/api/academics/years/semesters/${semId}/launch`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      showToast('Semester launched successfully!', 'success')
      setConfirmLaunch(null)
      load()
    } else {
      showToast(data.error ?? 'Launch failed', 'error')
    }
    setLaunching(null)
  }

  async function saveBoundaries(yearId: string) {
    setSavingGrade(true)
    const res = await fetch(`/api/academics/years/${yearId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gradeBoundaries: boundaries[yearId] }),
    })
    if (res.ok) { showToast('Grade boundaries saved', 'success'); setGradingOpen(null) }
    else { showToast('Failed to save', 'error') }
    setSavingGrade(false)
  }

  function openGrading(year: AcademicYear) {
    setBoundaries(prev => ({
      ...prev,
      [year.id]: year.gradeBoundaries ?? DEFAULT_BOUNDARIES.map(b => ({ ...b })),
    }))
    setGradingOpen(year.id)
  }

  function updateBoundary(yearId: string, letter: string, min: number) {
    setBoundaries(prev => ({
      ...prev,
      [yearId]: (prev[yearId] ?? DEFAULT_BOUNDARIES).map(b => b.letter === letter ? { ...b, min } : b),
    }))
  }

  async function loadHolidays(semesterId: string) {
    const res = await fetch(`/api/academics/holidays?semesterId=${semesterId}`)
    if (res.ok) {
      const data = await res.json()
      setHolidays(prev => ({ ...prev, [semesterId]: data }))
    }
  }

  function openHolidays(semesterId: string) {
    setHolidayOpen(semesterId)
    setHolidayForm({ name: '', date: '', endDate: '', holidayType: 'PUBLIC' })
    if (!holidays[semesterId]) loadHolidays(semesterId)
  }

  async function addHoliday(semesterId: string) {
    if (!holidayForm.name.trim() || !holidayForm.date) return
    setSavingHoliday(true)
    const res = await fetch('/api/academics/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...holidayForm, semesterId, endDate: holidayForm.endDate || null }),
    })
    if (res.ok) {
      const created = await res.json()
      setHolidays(prev => ({ ...prev, [semesterId]: [...(prev[semesterId] ?? []), created] }))
      setHolidayForm({ name: '', date: '', endDate: '', holidayType: 'PUBLIC' })
      showToast('Holiday added', 'success')
    } else {
      showToast('Failed to add holiday', 'error')
    }
    setSavingHoliday(false)
  }

  async function deleteHoliday(semesterId: string, holidayId: string) {
    const res = await fetch(`/api/academics/holidays/${holidayId}`, { method: 'DELETE' })
    if (res.ok) {
      setHolidays(prev => ({ ...prev, [semesterId]: prev[semesterId].filter(h => h.id !== holidayId) }))
      showToast('Holiday removed', 'success')
    }
  }

  const HOLIDAY_TYPE_LABELS: Record<string, string> = {
    PUBLIC: 'Public Holiday', UNIVERSITY: 'University', EXAM_BREAK: 'Exam Break', RECESS: 'Recess',
  }

  const activeSemester = years.flatMap(y => y.semesters).find(s => s.status === 'ACTIVE')

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Academic Calendar</h2>
          <p className="text-sm text-gray-400">Manage academic years, semesters and launch controls</p>
        </div>
        <button
          onClick={() => setShowYearForm(!showYearForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Academic Year
        </button>
      </div>

      {/* Active semester banner */}
      {!loading && (
        activeSemester ? (
          <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-900 text-sm">
                {activeSemester.name.charAt(0) + activeSemester.name.slice(1).toLowerCase()} {activeSemester.termType.charAt(0) + activeSemester.termType.slice(1).toLowerCase()} — Active
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                {new Date(activeSemester.startDate).toLocaleDateString()} – {new Date(activeSemester.endDate).toLocaleDateString()}
                {activeSemester.launchedAt && ` · Launched ${new Date(activeSemester.launchedAt).toLocaleDateString()}`}
              </p>
            </div>
            <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-200 px-3 py-1 rounded-full">CURRENT</span>
          </div>
        ) : (
          <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-900 text-sm">No active semester</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Create an academic year and semester below, then click <strong>Launch</strong> to activate it.
              </p>
            </div>
          </div>
        )
      )}

      {/* Year form */}
      {showYearForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Create Academic Year</h2>
            <button onClick={() => setShowYearForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={createYear} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Year name</label>
                <input className={inputCls} placeholder="e.g. 2025/2026" value={yearForm.name}
                  onChange={e => setYearForm({ ...yearForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Grading scale</label>
                <select className={inputCls} value={yearForm.gradingScale}
                  onChange={e => setYearForm({ ...yearForm, gradingScale: e.target.value })}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="GPA_4">GPA 4.0</option>
                  <option value="GPA_5">GPA 5.0</option>
                  <option value="LETTER">Letter (A–F)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
                <input type="date" className={inputCls} value={yearForm.startDate}
                  onChange={e => setYearForm({ ...yearForm, startDate: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
                <input type="date" className={inputCls} value={yearForm.endDate}
                  onChange={e => setYearForm({ ...yearForm, endDate: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pass mark (%)</label>
                <input type="number" className={inputCls} min={0} max={100} value={yearForm.passMark}
                  onChange={e => setYearForm({ ...yearForm, passMark: Number(e.target.value) })} required />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={savingYear}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {savingYear ? 'Creating...' : 'Create Year'}
              </button>
              <button type="button" onClick={() => setShowYearForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Years list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : years.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No academic years yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first academic year to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {years.map(year => {
            const isOpen    = expanded === year.id
            const hasActive = year.semesters.some(s => s.status === 'ACTIVE')
            return (
              <div key={year.id} className={`bg-white rounded-2xl border overflow-hidden transition-colors ${hasActive ? 'border-green-200' : 'border-gray-200'}`}>
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
                        {hasActive && (
                          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">Current</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(year.startDate).toLocaleDateString()} – {new Date(year.endDate).toLocaleDateString()}
                        {' · '}{year.semesters.length} semester{year.semesters.length !== 1 ? 's' : ''}
                        {' · '}{year.gradingScale}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Semesters */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-3 space-y-2">
                    {year.semesters.length === 0 && (
                      <p className="text-sm text-gray-400 py-2">No semesters yet — add one below.</p>
                    )}

                    {year.semesters.map(sem => {
                      const meta = SEM_STATUS[sem.status]
                      const Icon = meta.Icon
                      return (
                        <div key={sem.id} className={`flex items-center gap-4 border rounded-xl px-4 py-3 ${
                          sem.status === 'ACTIVE' ? 'border-green-200 bg-green-50/30' : 'border-gray-100 bg-gray-50/40'
                        }`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-900">
                                {sem.name.charAt(0) + sem.name.slice(1).toLowerCase()} {sem.termType.charAt(0) + sem.termType.slice(1).toLowerCase()}
                              </p>
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${meta.cls}`}>
                                <Icon className="w-3 h-3" />
                                {meta.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(sem.startDate).toLocaleDateString()} – {new Date(sem.endDate).toLocaleDateString()}
                              {sem.registrationOpen && ` · Reg opens ${new Date(sem.registrationOpen).toLocaleDateString()}`}
                              {sem.registrationClose && ` · closes ${new Date(sem.registrationClose).toLocaleDateString()}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => holidayOpen === sem.id ? setHolidayOpen(null) : openHolidays(sem.id)}
                              className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
                              title="Manage holidays"
                            >
                              <Sunset className="w-3.5 h-3.5" />
                              Holidays
                            </button>
                            {sem.status === 'UPCOMING' && (
                              <button
                                onClick={() => setConfirmLaunch({ ...sem, yearName: year.name })}
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <Rocket className="w-3.5 h-3.5" /> Launch
                              </button>
                            )}
                            {sem.status === 'ACTIVE' && (
                              <span className="text-xs text-green-600 font-medium">
                                <CalendarDays className="w-3.5 h-3.5 inline mr-1" />In progress
                              </span>
                            )}
                            {sem.status === 'COMPLETED' && (
                              <span className="text-xs text-gray-400 font-medium">Ended</span>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Grade Boundaries */}
                    <div className="mt-3 border border-dashed border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => gradingOpen === year.id ? setGradingOpen(null) : openGrading(year)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-blue-400" />
                          Grade Boundaries — {year.gradingScale}
                        </span>
                        <span className="text-xs text-blue-600">{gradingOpen === year.id ? 'Close' : 'Configure'}</span>
                      </button>
                      {gradingOpen === year.id && boundaries[year.id] && (
                        <div className="px-4 pb-4 space-y-2 bg-gray-50/60">
                          <p className="text-xs text-gray-400 pb-1">Set the minimum score (%) required for each grade letter.</p>
                          <div className="grid grid-cols-5 gap-2">
                            {boundaries[year.id].map(b => (
                              <div key={b.letter} className="text-center">
                                <div className={`text-xs font-bold mb-1 ${b.letter === 'F' ? 'text-red-500' : b.letter === 'D' ? 'text-orange-500' : b.letter === 'C' ? 'text-amber-600' : 'text-blue-600'}`}>{b.letter}</div>
                                <input
                                  type="number" min={0} max={100} disabled={b.letter === 'F'}
                                  value={b.min}
                                  onChange={e => updateBoundary(year.id, b.letter, Number(e.target.value))}
                                  className="w-full text-center border border-gray-200 rounded-lg px-1 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-400"
                                />
                                <div className="text-[10px] text-gray-400 mt-0.5">{b.letter === 'F' ? 'auto' : `≥ ${b.min}%`}</div>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => saveBoundaries(year.id)}
                            disabled={savingGrade}
                            className="mt-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            {savingGrade ? 'Saving…' : 'Save Boundaries'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Holidays — per semester */}
                    {year.semesters.map(sem => holidayOpen === sem.id && (
                      <div key={`h-${sem.id}`} className="mt-3 border border-dashed border-orange-200 rounded-xl overflow-hidden bg-orange-50/30">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-orange-100">
                          <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Sunset className="w-4 h-4 text-orange-400" />
                            Holidays — {sem.name.charAt(0) + sem.name.slice(1).toLowerCase()} Semester
                          </span>
                          <button onClick={() => setHolidayOpen(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="px-4 py-3 space-y-2">
                          {(holidays[sem.id] ?? []).length === 0 && (
                            <p className="text-xs text-gray-400 italic">No holidays added yet.</p>
                          )}
                          {(holidays[sem.id] ?? []).map(h => (
                            <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-orange-100/60 last:border-0">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{h.name}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(h.date).toLocaleDateString()}{h.endDate ? ` – ${new Date(h.endDate).toLocaleDateString()}` : ''}
                                  {' · '}<span className="text-orange-600">{HOLIDAY_TYPE_LABELS[h.holidayType] ?? h.holidayType}</span>
                                </p>
                              </div>
                              <button onClick={() => deleteHoliday(sem.id, h.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          {/* Add form */}
                          <div className="pt-2 grid grid-cols-2 gap-2">
                            <input className="col-span-2 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                              placeholder="Holiday name *" value={holidayForm.name}
                              onChange={e => setHolidayForm(f => ({ ...f, name: e.target.value }))} />
                            <input type="date" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                              value={holidayForm.date} onChange={e => setHolidayForm(f => ({ ...f, date: e.target.value }))} />
                            <input type="date" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                              placeholder="End date (optional)" value={holidayForm.endDate}
                              onChange={e => setHolidayForm(f => ({ ...f, endDate: e.target.value }))} />
                            <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                              value={holidayForm.holidayType} onChange={e => setHolidayForm(f => ({ ...f, holidayType: e.target.value }))}>
                              {Object.entries(HOLIDAY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                            <button onClick={() => addHoliday(sem.id)} disabled={savingHoliday || !holidayForm.name || !holidayForm.date}
                              className="flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                              {savingHoliday ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding…</> : <><Plus className="w-3 h-3" /> Add Holiday</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add semester form */}
                    {showSemForm === year.id ? (
                      <form onSubmit={e => createSemester(e, year.id)}
                        className="mt-2 border border-dashed border-gray-300 rounded-xl p-4 space-y-3 bg-white">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-700">Add Semester</p>
                          <button type="button" onClick={() => setShowSemForm(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
                            <select className={inputCls} value={semForm.name} onChange={e => setSemForm({ ...semForm, name: e.target.value })}>
                              <option value="FIRST">First</option>
                              <option value="SECOND">Second</option>
                              <option value="THIRD">Third</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Term type</label>
                            <select className={inputCls} value={semForm.termType} onChange={e => setSemForm({ ...semForm, termType: e.target.value })}>
                              <option value="SEMESTER">Semester</option>
                              <option value="TRIMESTER">Trimester</option>
                              <option value="TERM">Term</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
                            <input type="date" className={inputCls} value={semForm.startDate} onChange={e => setSemForm({ ...semForm, startDate: e.target.value })} required />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
                            <input type="date" className={inputCls} value={semForm.endDate} onChange={e => setSemForm({ ...semForm, endDate: e.target.value })} required />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Registration opens</label>
                            <input type="date" className={inputCls} value={semForm.registrationOpen} onChange={e => setSemForm({ ...semForm, registrationOpen: e.target.value })} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Registration closes</label>
                            <input type="date" className={inputCls} value={semForm.registrationClose} onChange={e => setSemForm({ ...semForm, registrationClose: e.target.value })} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Add/drop deadline</label>
                            <input type="date" className={inputCls} value={semForm.addDropDeadline} onChange={e => setSemForm({ ...semForm, addDropDeadline: e.target.value })} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Max credits per student</label>
                            <input type="number" className={inputCls} min={1} max={40} value={semForm.maxCreditsPerStudent}
                              onChange={e => setSemForm({ ...semForm, maxCreditsPerStudent: Number(e.target.value) })} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" disabled={savingSem}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            {savingSem ? 'Adding...' : 'Add Semester'}
                          </button>
                          <button type="button" onClick={() => setShowSemForm(null)}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button onClick={() => setShowSemForm(year.id)}
                        className="mt-1 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add Semester
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Launch confirmation modal */}
      {confirmLaunch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Launch semester?</h2>
                <p className="text-sm text-gray-500">{confirmLaunch.yearName}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Semester</span>
                <span className="font-medium text-gray-900">
                  {confirmLaunch.name.charAt(0) + confirmLaunch.name.slice(1).toLowerCase()} {confirmLaunch.termType.charAt(0) + confirmLaunch.termType.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Period</span>
                <span className="font-medium text-gray-900">
                  {new Date(confirmLaunch.startDate).toLocaleDateString()} – {new Date(confirmLaunch.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">What happens when you launch:</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                <li>This becomes the active semester system-wide</li>
                <li>All other semesters are set to Upcoming</li>
                <li>Course registration, enrollments and attendance will use this semester</li>
                <li>Students will be able to register for courses (if registration window is open)</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => launchSemester(confirmLaunch.id)}
                disabled={!!launching}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {launching === confirmLaunch.id
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Launching...</>
                  : <><Rocket className="w-4 h-4" /> Confirm Launch</>
                }
              </button>
              <button onClick={() => setConfirmLaunch(null)}
                className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
