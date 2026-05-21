'use client'

import { useEffect, useState } from 'react'
import { Calendar, ChevronDown, ChevronRight, Plus } from 'lucide-react'

interface Semester {
  id: string; name: string; termType: string; startDate: string; endDate: string; isCurrent: boolean
}
interface AcademicYear {
  id: string; name: string; startDate: string; endDate: string; isCurrent: boolean
  gradingScale: string; passMark: number; semesters: Semester[]
}

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showYearForm, setShowYearForm] = useState(false)
  const [showSemForm, setShowSemForm] = useState<string | null>(null)
  const [savingYear, setSavingYear] = useState(false)
  const [savingSem, setSavingSem] = useState(false)
  const [yearForm, setYearForm] = useState({ name: '', startDate: '', endDate: '', gradingScale: 'PERCENTAGE', passMark: 50 })
  const [semForm, setSemForm] = useState({ name: 'FIRST', termType: 'SEMESTER', startDate: '', endDate: '', isCurrent: false })

  async function load() {
    setLoading(true)
    const res = await fetch('/api/academics/years')
    if (res.ok) setYears(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function createYear(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingYear(true)
    await fetch('/api/academics/years', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(yearForm),
    })
    setShowYearForm(false)
    setYearForm({ name: '', startDate: '', endDate: '', gradingScale: 'PERCENTAGE', passMark: 50 })
    setSavingYear(false)
    load()
  }

  async function createSemester(e: React.SyntheticEvent<HTMLFormElement>, yearId: string) {
    e.preventDefault()
    setSavingSem(true)
    await fetch('/api/academics/years/semesters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...semForm, academicYearId: yearId }),
    })
    setShowSemForm(null)
    setSemForm({ name: 'FIRST', termType: 'SEMESTER', startDate: '', endDate: '', isCurrent: false })
    setSavingSem(false)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Years</h1>
          <p className="text-gray-500">Manage academic calendar and semesters</p>
        </div>
        <button
          onClick={() => setShowYearForm(!showYearForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Academic Year
        </button>
      </div>

      {showYearForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create Academic Year</h2>
          <form onSubmit={createYear} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year Name</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 2024/2025"
                  value={yearForm.name}
                  onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grading Scale</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={yearForm.gradingScale}
                  onChange={(e) => setYearForm({ ...yearForm, gradingScale: e.target.value })}
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="GPA_4">GPA 4.0</option>
                  <option value="GPA_5">GPA 5.0</option>
                  <option value="LETTER">Letter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={yearForm.startDate}
                  onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={yearForm.endDate}
                  onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={savingYear} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {savingYear ? 'Saving...' : 'Create Year'}
              </button>
              <button type="button" onClick={() => setShowYearForm(false)} className="text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : years.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No academic years yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {years.map((y) => (
            <div key={y.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === y.id ? null : y.id)}
              >
                <div className="flex items-center gap-3">
                  {expanded === y.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{y.name}</p>
                    <p className="text-xs text-gray-400">{y.semesters.length} semesters · {y.gradingScale}</p>
                  </div>
                </div>
                {y.isCurrent && (
                  <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-medium">Current</span>
                )}
              </button>

              {expanded === y.id && (
                <div className="border-t border-gray-100 px-5 pb-4">
                  <div className="mt-3 space-y-2">
                    {y.semesters.map((s) => (
                      <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.name} {s.termType}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(s.startDate).toLocaleDateString()} — {new Date(s.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        {s.isCurrent && (
                          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-medium">Active</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {showSemForm === y.id ? (
                    <form onSubmit={(e) => createSemester(e, y.id)} className="mt-4 space-y-3 border border-dashed border-gray-300 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700">Add Semester</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Semester</label>
                          <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={semForm.name}
                            onChange={(e) => setSemForm({ ...semForm, name: e.target.value })}
                          >
                            <option value="FIRST">First</option>
                            <option value="SECOND">Second</option>
                            <option value="THIRD">Third</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Term Type</label>
                          <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={semForm.termType}
                            onChange={(e) => setSemForm({ ...semForm, termType: e.target.value })}
                          >
                            <option value="SEMESTER">Semester</option>
                            <option value="TRIMESTER">Trimester</option>
                            <option value="TERM">Term</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                          <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={semForm.startDate} onChange={(e) => setSemForm({ ...semForm, startDate: e.target.value })} required />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">End Date</label>
                          <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={semForm.endDate} onChange={(e) => setSemForm({ ...semForm, endDate: e.target.value })} required />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="isCurrent" checked={semForm.isCurrent} onChange={(e) => setSemForm({ ...semForm, isCurrent: e.target.checked })} />
                        <label htmlFor="isCurrent" className="text-sm text-gray-600">Set as current semester</label>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={savingSem} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                          {savingSem ? 'Adding...' : 'Add Semester'}
                        </button>
                        <button type="button" onClick={() => setShowSemForm(null)} className="text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowSemForm(y.id)}
                      className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Semester
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
