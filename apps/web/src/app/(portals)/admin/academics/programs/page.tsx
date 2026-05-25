'use client'

import { useEffect, useState } from 'react'
import {
  GraduationCap, Plus, Pencil, Trash2, X, Save, Loader2,
  AlertCircle, CheckCircle2, ChevronDown, ChevronRight, ScrollText,
} from 'lucide-react'

interface Faculty    { id: string; name: string; code: string }
interface Department { id: string; name: string; code: string; facultyId?: string }
interface Course { id: string; code: string; title: string; creditHours: number; level: number }
interface ProgramCourse {
  courseId: string; level: number; isRequired: boolean
  course: { id: string; code: string; title: string; creditHours: number }
}
interface Program {
  id: string; name: string; code: string; degreeType: string
  durationYears: number; requiredCredits: number
  description: string | null; isActive: boolean
  department: { id: string; name: string; code: string; faculty: Faculty | null }
}

type ModalMode = 'create' | 'edit'

const EMPTY_FORM = {
  name: '', code: '', departmentId: '', degreeType: 'BACHELOR',
  durationYears: 4, requiredCredits: 120, description: '', isActive: true,
}

const DEGREE_META: Record<string, { label: string; short: string; color: string }> = {
  CERTIFICATE:          { label: 'Certificate',           short: 'CERT',   color: 'bg-slate-100 text-slate-600' },
  DIPLOMA:              { label: 'Diploma',               short: 'DIP',    color: 'bg-amber-50 text-amber-700' },
  ASSOCIATE:            { label: 'Associate Degree',      short: 'AD',     color: 'bg-yellow-50 text-yellow-700' },
  BACHELOR:             { label: "Bachelor's Degree",     short: 'BSc/BA', color: 'bg-indigo-50 text-indigo-700' },
  POSTGRADUATE_DIPLOMA: { label: 'Postgraduate Diploma',  short: 'PGD',    color: 'bg-purple-50 text-purple-700' },
  MASTER:               { label: "Master's Degree",       short: 'MSc/MA', color: 'bg-purple-50 text-purple-700' },
  DOCTORATE:            { label: 'Doctorate (PhD)',        short: 'PhD',    color: 'bg-rose-50 text-rose-700' },
}

const LEVELS = [100, 200, 300, 400]

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
const lbl = 'block text-xs font-medium text-gray-600 mb-1'

export default function ProgramsPage() {
  const [programs, setPrograms]         = useState<Program[]>([])
  const [departments, setDepartments]   = useState<Department[]>([])
  const [allCourses, setAllCourses]     = useState<Course[]>([])
  const [loading, setLoading]           = useState(true)
  const [modal, setModal]               = useState<ModalMode | null>(null)
  const [editing, setEditing]           = useState<Program | null>(null)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)
  const [msg, setMsg]                   = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [modalFacultyId, setModalFacultyId] = useState('')
  const [search, setSearch]               = useState('')
  const [filterFaculty, setFilterFaculty] = useState('')
  const [filterDept, setFilterDept]       = useState('')
  const [filterDegree, setFilterDegree]   = useState('')

  // Curriculum state per program
  const [expanded, setExpanded]         = useState<Set<string>>(new Set())
  const [curriculum, setCurriculum]     = useState<Record<string, ProgramCourse[]>>({})
  const [currLoading, setCurrLoading]   = useState<Set<string>>(new Set())

  // Add course to program
  const [addingTo, setAddingTo]         = useState<{ programId: string; level: number } | null>(null)
  const [addCourseId, setAddCourseId]   = useState('')
  const [addRequired, setAddRequired]   = useState(true)
  const [addSaving, setAddSaving]       = useState(false)

  async function load() {
    setLoading(true)
    const [p, d, c] = await Promise.all([
      fetch('/api/academics/programs').then(r => r.json()),
      fetch('/api/academics/departments').then(r => r.json()),
      fetch('/api/academics/courses').then(r => r.json()),
    ])
    setPrograms(Array.isArray(p) ? p : [])
    setDepartments(Array.isArray(d) ? d : [])
    setAllCourses(Array.isArray(c) ? c : (c?.courses ?? []))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Reset dept filter when faculty changes
  useEffect(() => { setFilterDept('') }, [filterFaculty])

  // Derive unique faculties from loaded programs
  const faculties: Faculty[] = (() => {
    const seen = new Set<string>()
    const out: Faculty[] = []
    for (const p of programs) {
      if (p.department.faculty && !seen.has(p.department.faculty.id)) {
        seen.add(p.department.faculty.id)
        out.push(p.department.faculty)
      }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
  })()

  // Enrich departments with facultyId from programs data
  const deptsWithFaculty: Department[] = departments.map(d => {
    const match = programs.find(p => p.department.id === d.id)
    return { ...d, facultyId: match?.department.faculty?.id }
  })

  // Cascaded dept list for filter bar
  const visibleDepts = filterFaculty
    ? deptsWithFaculty.filter(d => d.facultyId === filterFaculty)
    : deptsWithFaculty

  async function loadCurriculum(programId: string) {
    if (curriculum[programId] !== undefined) return
    setCurrLoading(prev => new Set(prev).add(programId))
    try {
      const data = await fetch(`/api/academics/programs/${programId}/courses`).then(r => r.json())
      setCurriculum(prev => ({ ...prev, [programId]: Array.isArray(data) ? data : [] }))
    } finally {
      setCurrLoading(prev => { const n = new Set(prev); n.delete(programId); return n })
    }
  }

  function toggleExpand(programId: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(programId)) { next.delete(programId) } else { next.add(programId); loadCurriculum(programId) }
      return next
    })
  }

  async function removeCourse(programId: string, courseId: string) {
    if (!confirm('Remove this course from the program?')) return
    const res = await fetch(`/api/academics/programs/${programId}/courses/${courseId}`, { method: 'DELETE' })
    if (!res.ok) { alert('Failed to remove course.'); return }
    setCurriculum(prev => ({ ...prev, [programId]: (prev[programId] ?? []).filter(c => c.courseId !== courseId) }))
  }

  async function addCourse() {
    if (!addingTo || !addCourseId) return
    setAddSaving(true)
    const res = await fetch(`/api/academics/programs/${addingTo.programId}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: addCourseId, level: addingTo.level, isRequired: addRequired }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.message ?? 'Failed.'); setAddSaving(false); return }
    setCurriculum(prev => ({ ...prev, [addingTo.programId]: [...(prev[addingTo.programId] ?? []), data] }))
    setAddingTo(null); setAddCourseId(''); setAddRequired(true); setAddSaving(false)
  }

  function openCreate() { setForm(EMPTY_FORM); setEditing(null); setMsg(null); setModalFacultyId(''); setModal('create') }
  function openEdit(p: Program) {
    setForm({ name: p.name, code: p.code, departmentId: p.department.id, degreeType: p.degreeType,
      durationYears: p.durationYears, requiredCredits: p.requiredCredits, description: p.description ?? '', isActive: p.isActive })
    setEditing(p); setMsg(null); setModalFacultyId(p.department.faculty?.id ?? ''); setModal('edit')
  }
  function closeModal() { setModal(null); setEditing(null); setMsg(null); setModalFacultyId('') }

  async function save() {
    if (!form.name.trim() || !form.code.trim() || !form.departmentId) {
      setMsg({ type: 'err', text: 'Name, code and department are required.' }); return
    }
    setSaving(true); setMsg(null)
    try {
      const url    = modal === 'edit' ? `/api/academics/programs/${editing!.id}` : '/api/academics/programs'
      const method = modal === 'edit' ? 'PATCH' : 'POST'
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data   = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.message ?? 'Save failed.' }); return }
      modal === 'edit' ? setPrograms(prev => prev.map(p => p.id === data.id ? data : p)) : setPrograms(prev => [...prev, data])
      closeModal()
    } catch { setMsg({ type: 'err', text: 'Network error.' }) }
    finally { setSaving(false) }
  }

  async function deleteProgram(p: Program) {
    if (!confirm(`Delete program "${p.name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/academics/programs/${p.id}`, { method: 'DELETE' })
    if (!res.ok) { alert((await res.json()).message ?? 'Delete failed.'); return }
    setPrograms(prev => prev.filter(x => x.id !== p.id))
  }

  const filtered = programs.filter(p => {
    const q = search.toLowerCase()
    if (q && !p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) return false
    if (filterFaculty && p.department.faculty?.id !== filterFaculty) return false
    if (filterDept && p.department.id !== filterDept) return false
    if (filterDegree && p.degreeType !== filterDegree) return false
    return true
  })

  return (
    <div className="space-y-5">

      {/* Program create/edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{modal === 'create' ? 'New Program' : 'Edit Program'}</h3>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Program Name *</label>
                  <input className={inp} value={form.name} placeholder="e.g. Bachelor of Science in Computer Science"
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Code *</label>
                  <input className={inp} value={form.code} placeholder="BSC-CS"
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} maxLength={20} />
                </div>
                <div>
                  <label className={lbl}>Degree Type</label>
                  <select className={inp} value={form.degreeType} onChange={e => setForm(f => ({ ...f, degreeType: e.target.value }))}>
                    {Object.entries(DEGREE_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                  </select>
                </div>
                {faculties.length > 0 && (
                  <div className="col-span-2">
                    <label className={lbl}>Faculty <span className="text-gray-400 font-normal">(optional — narrows departments)</span></label>
                    <select className={inp} value={modalFacultyId}
                      onChange={e => { setModalFacultyId(e.target.value); setForm(f => ({ ...f, departmentId: '' })) }}>
                      <option value="">— All Faculties —</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className={lbl}>Department *</label>
                  <select className={inp} value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
                    <option value="">— Select —</option>
                    {(modalFacultyId ? deptsWithFaculty.filter(d => d.facultyId === modalFacultyId) : deptsWithFaculty)
                      .map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Duration (years)</label>
                  <input type="number" min={1} max={10} className={inp} value={form.durationYears}
                    onChange={e => setForm(f => ({ ...f, durationYears: parseInt(e.target.value) || 1 }))} />
                </div>
                <div>
                  <label className={lbl}>Required Credits</label>
                  <input type="number" min={1} className={inp} value={form.requiredCredits}
                    onChange={e => setForm(f => ({ ...f, requiredCredits: parseInt(e.target.value) || 1 }))} />
                </div>
                <div>
                  <label className={lbl}>Status</label>
                  <select className={inp} value={form.isActive ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Description</label>
                  <textarea className={`${inp} resize-none`} rows={2} value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
                </div>
              </div>
              {msg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${msg.type === 'ok' ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {msg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {msg.text}
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {modal === 'create' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add course modal */}
      {addingTo && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setAddingTo(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Add Course — Level {addingTo.level}</h3>
              <button onClick={() => setAddingTo(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className={lbl}>Course *</label>
                <select className={inp} value={addCourseId} onChange={e => setAddCourseId(e.target.value)}>
                  <option value="">— Select course —</option>
                  {allCourses
                    .filter(c => !(curriculum[addingTo.programId] ?? []).some(pc => pc.courseId === c.id))
                    .map(c => <option key={c.id} value={c.id}>{c.code} — {c.title} ({c.creditHours} cr)</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Type</label>
                <select className={inp} value={addRequired ? 'true' : 'false'} onChange={e => setAddRequired(e.target.value === 'true')}>
                  <option value="true">Required</option>
                  <option value="false">Elective</option>
                </select>
              </div>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-3">
              <button onClick={() => setAddingTo(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={addCourse} disabled={!addCourseId || addSaving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Programs</h2>
          <p className="text-sm text-slate-400">{programs.length} program{programs.length !== 1 ? 's' : ''} · click a row to manage its curriculum</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> New Program
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Search programs…" value={search} onChange={e => setSearch(e.target.value)} />
        {faculties.length > 0 && (
          <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)}>
            <option value="">All Faculties</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        )}
        {visibleDepts.length > 0 && (
          <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {visibleDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
        <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filterDegree} onChange={e => setFilterDegree(e.target.value)}>
          <option value="">All Degrees</option>
          {Object.entries(DEGREE_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <GraduationCap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">{programs.length === 0 ? 'No programs yet.' : 'No results match your filters.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const meta       = DEGREE_META[p.degreeType] ?? DEGREE_META.BACHELOR
            const isOpen     = expanded.has(p.id)
            const courses    = curriculum[p.id] ?? []
            const isLoading  = currLoading.has(p.id)

            return (
              <div key={p.id} className={`bg-white rounded-2xl border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all ${isOpen ? 'border-indigo-200' : 'border-gray-100'} ${!p.isActive ? 'opacity-60' : ''}`}>

                {/* Program row */}
                <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/40 transition-colors cursor-pointer group"
                  onClick={() => toggleExpand(p.id)}>
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 group-hover:text-slate-400" />}

                  <div className="flex-1 min-w-0 flex flex-wrap items-center gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                      <p className="text-xs font-mono text-slate-400">{p.code}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.short}</span>
                    <div>
                      <span className="text-xs text-slate-500">{p.department.name}</span>
                      {p.department.faculty && <span className="text-xs text-slate-300 ml-1">· {p.department.faculty.name}</span>}
                    </div>
                    <span className="text-xs text-slate-400">{p.durationYears} yrs · {p.requiredCredits} credits</span>
                    {isOpen && !isLoading && (
                      <span className="text-xs text-indigo-600 font-medium">
                        {courses.length} course{courses.length !== 1 ? 's' : ''} assigned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(p)} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteProgram(p)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Curriculum panel */}
                {isOpen && (
                  <div className="border-t border-indigo-50">
                    {isLoading ? (
                      <div className="flex items-center gap-2 px-6 py-4 text-sm text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading curriculum…
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {LEVELS.filter(lvl => lvl / 100 <= p.durationYears).map(lvl => {
                          const lvlCourses  = courses.filter(c => c.level === lvl)
                          const totalCr     = lvlCourses.reduce((s, c) => s + c.course.creditHours, 0)
                          return (
                            <div key={lvl} className="px-6 py-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Level {lvl} · Year {lvl / 100}</span>
                                  <span className="text-xs text-slate-400">{lvlCourses.length} courses · {totalCr} credits</span>
                                </div>
                                <button
                                  onClick={() => { setAddingTo({ programId: p.id, level: lvl }); setAddCourseId(''); setAddRequired(true) }}
                                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                                  <Plus className="w-3 h-3" /> Add Course
                                </button>
                              </div>
                              {lvlCourses.length === 0 ? (
                                <p className="text-xs text-slate-300 italic pl-1">No courses assigned yet</p>
                              ) : (
                                <div className="space-y-1">
                                  {lvlCourses.map(pc => (
                                    <div key={pc.courseId} className="flex items-center gap-3 group/course">
                                      <ScrollText className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                      <span className="text-xs font-mono text-slate-500 w-16 flex-shrink-0">{pc.course.code}</span>
                                      <span className="text-sm text-slate-700 flex-1 truncate">{pc.course.title}</span>
                                      <span className="text-xs text-slate-400 w-10">{pc.course.creditHours} cr</span>
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${pc.isRequired ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {pc.isRequired ? 'Required' : 'Elective'}
                                      </span>
                                      <button onClick={() => removeCourse(p.id, pc.courseId)}
                                        className="p-1 text-slate-200 hover:text-red-400 opacity-0 group-hover/course:opacity-100 transition-opacity rounded">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
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
