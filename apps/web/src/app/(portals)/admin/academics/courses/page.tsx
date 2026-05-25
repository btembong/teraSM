'use client'

import { useEffect, useState, useRef } from 'react'
import {
  BookOpen, Plus, X, Loader2, GitBranch, Trash2,
  Check, Pencil, Save, AlertCircle, CheckCircle2,
} from 'lucide-react'

interface Department { id: string; name: string; code: string; facultyId?: string }
interface Program   { id: string; name: string; code: string }
interface Faculty   { id: string; name: string; code: string }
interface Course {
  id: string; code: string; title: string; creditHours: number
  level: number; status: string; prerequisites: string[]
  description?: string
  department: { name: string; code: string; faculty: Faculty | null }
  departmentId?: string
  _count: { offerings: number }
  programCourses: { programId: string; program: Program }[]
}

type ModalMode = 'create' | 'edit'

const EMPTY_FORM = { code: '', title: '', departmentId: '', creditHours: 3, level: 100, description: '', status: 'ACTIVE' }

const fieldCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
const lbl = 'block text-xs font-medium text-gray-600 mb-1'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   'bg-blue-50 text-blue-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  ARCHIVED: 'bg-gray-100 text-gray-400',
}

// ── Prerequisite Panel ────────────────────────────────────────────────────────
function PrereqPanel({ course, allCourses, onClose, onUpdated }: {
  course: Course
  allCourses: Course[]
  onClose: () => void
  onUpdated: (updated: Course) => void
}) {
  const [prereqs, setPrereqs] = useState<string[]>(course.prerequisites ?? [])
  const [saving, setSaving] = useState(false)
  const [addCode, setAddCode] = useState('')
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const eligible = allCourses.filter(c => c.id !== course.id && !prereqs.includes(c.code))
  const filtered  = addCode.trim()
    ? eligible.filter(c => c.code.toLowerCase().includes(addCode.toLowerCase()) || c.title.toLowerCase().includes(addCode.toLowerCase()))
    : eligible

  function add(code: string) { setPrereqs(p => [...p, code]); setAddCode(''); setDropOpen(false) }
  function remove(code: string) { setPrereqs(p => p.filter(x => x !== code)) }

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/academics/courses/${course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prerequisites: prereqs }),
    })
    if (res.ok) { onUpdated(await res.json()); onClose() }
    setSaving(false)
  }

  const hasChanges = JSON.stringify(prereqs.slice().sort()) !== JSON.stringify((course.prerequisites ?? []).slice().sort())

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Prerequisites</h2>
            <p className="text-xs text-gray-400 mt-0.5">{course.code} — {course.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Required before enrolling</p>
            {prereqs.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No prerequisites set — any student may enroll.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {prereqs.map(code => {
                  const c = allCourses.find(x => x.code === code)
                  return (
                    <span key={code} className="flex items-center gap-1.5 bg-blue-50 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                      {code}
                      {c && <span className="font-normal text-blue-500">· {c.title}</span>}
                      <button onClick={() => remove(code)} className="ml-1 text-blue-400 hover:text-blue-700"><X className="w-3 h-3" /></button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Add prerequisite</p>
            <div className="relative" ref={dropRef}>
              <input
                className={fieldCls}
                placeholder="Search by code or title…"
                value={addCode}
                onChange={e => { setAddCode(e.target.value); setDropOpen(true) }}
                onFocus={() => setDropOpen(true)}
              />
              {dropOpen && filtered.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filtered.slice(0, 20).map(c => (
                    <button key={c.id} onClick={() => add(c.code)} className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left">
                      <span><span className="font-semibold text-gray-900">{c.code}</span><span className="text-gray-500 ml-2">{c.title}</span></span>
                      <span className="text-xs text-gray-400 ml-3 flex-shrink-0">{c.level} lvl</span>
                    </button>
                  ))}
                </div>
              )}
              {dropOpen && addCode && filtered.length === 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">No matching courses</div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
            Students will be blocked from registering for <span className="font-semibold text-gray-600">{course.code}</span> unless they have completed all listed prerequisite courses.
          </p>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={save} disabled={saving || !hasChanges} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Course Modal (create / edit) ──────────────────────────────────────────────
function CourseModal({ mode, form, setForm, faculties, departments, initialFacultyId, saving, msg, onSave, onClose }: {
  mode: ModalMode
  form: typeof EMPTY_FORM
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>
  faculties: Faculty[]
  departments: Department[]
  initialFacultyId?: string
  saving: boolean
  msg: { type: 'ok' | 'err'; text: string } | null
  onSave: () => void
  onClose: () => void
}) {
  const [selectedFaculty, setSelectedFaculty] = useState(initialFacultyId ?? '')

  const visibleDepts = selectedFaculty
    ? departments.filter(d => d.facultyId === selectedFaculty)
    : departments

  function handleFacultyChange(id: string) {
    setSelectedFaculty(id)
    setForm(f => ({ ...f, departmentId: '' }))
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{mode === 'create' ? 'New Course' : 'Edit Course'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Course Code *</label>
              <input className={fieldCls} value={form.code} placeholder="e.g. CS101"
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} maxLength={20} />
            </div>
            <div>
              <label className={lbl}>Credit Hours</label>
              <input type="number" min={1} max={6} className={fieldCls} value={form.creditHours}
                onChange={e => setForm(f => ({ ...f, creditHours: parseInt(e.target.value) || 1 }))} />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Course Title *</label>
              <input className={fieldCls} value={form.title} placeholder="e.g. Introduction to Programming"
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            {faculties.length > 0 && (
              <div className="col-span-2">
                <label className={lbl}>Faculty <span className="text-gray-400 font-normal">(optional — narrows departments)</span></label>
                <select className={fieldCls} value={selectedFaculty} onChange={e => handleFacultyChange(e.target.value)}>
                  <option value="">— All Faculties —</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={lbl}>Department *</label>
              <select className={fieldCls} value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
                <option value="">— Select —</option>
                {visibleDepts.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Level</label>
              <select className={fieldCls} value={form.level} onChange={e => setForm(f => ({ ...f, level: parseInt(e.target.value) }))}>
                {[100, 200, 300, 400, 500, 600].map(l => <option key={l} value={l}>{l} Level</option>)}
              </select>
            </div>
            {mode === 'edit' && (
              <div>
                <label className={lbl}>Status</label>
                <select className={fieldCls} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            )}
            <div className={mode === 'edit' ? '' : 'col-span-2'}>
              <label className={lbl}>Description</label>
              <textarea className={`${fieldCls} resize-none`} rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
            </div>
          </div>

          {msg && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${msg.type === 'ok' ? 'bg-blue-50 border border-blue-100 text-blue-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {msg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {msg.text}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
          <button onClick={onSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {mode === 'create' ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const [courses, setCourses]         = useState<Course[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [programs, setPrograms]       = useState<Program[]>([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState<ModalMode | null>(null)
  const [editing, setEditing]         = useState<Course | null>(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)
  const [msg, setMsg]                 = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [prereqCourse, setPrereqCourse] = useState<Course | null>(null)

  // Filters
  const [search, setSearch]               = useState('')
  const [filterFaculty, setFilterFaculty] = useState('')
  const [filterDept, setFilterDept]       = useState('')
  const [filterLevel, setFilterLevel]     = useState('')
  const [filterStatus, setFilterStatus]   = useState('')
  const [filterProgram, setFilterProgram] = useState('')

  async function load() {
    setLoading(true)
    const [c, d, p] = await Promise.all([
      fetch('/api/academics/courses').then(r => r.json()),
      fetch('/api/academics/departments').then(r => r.json()),
      fetch('/api/academics/programs').then(r => r.json()),
    ])
    setCourses(Array.isArray(c) ? c : [])
    setDepartments(Array.isArray(d) ? d : [])
    setPrograms(Array.isArray(p) ? p : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Reset dept when faculty changes
  useEffect(() => { setFilterDept('') }, [filterFaculty])

  // Derive unique faculties from loaded courses
  const faculties: Faculty[] = (() => {
    const seen = new Set<string>()
    const out: Faculty[] = []
    for (const c of courses) {
      if (c.department.faculty && !seen.has(c.department.faculty.id)) {
        seen.add(c.department.faculty.id)
        out.push(c.department.faculty)
      }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
  })()

  // Enrich departments with facultyId (derived from courses data)
  const deptsWithFaculty: Department[] = departments.map(d => {
    const match = courses.find(c => c.departmentId === d.id)
    return { ...d, facultyId: match?.department.faculty?.id }
  })

  // When a faculty is selected, only show its departments in the filter bar dropdown
  const visibleDepts = filterFaculty
    ? deptsWithFaculty.filter(d => d.facultyId === filterFaculty)
    : deptsWithFaculty

  function openCreate() {
    setForm(EMPTY_FORM); setEditing(null); setMsg(null); setModal('create')
  }
  function openEdit(c: Course) {
    setForm({
      code: c.code, title: c.title,
      departmentId: (c as any).departmentId ?? '',
      creditHours: c.creditHours, level: c.level,
      description: c.description ?? '', status: c.status,
    })
    setEditing(c); setMsg(null); setModal('edit')
  }
  function closeModal() { setModal(null); setEditing(null); setMsg(null) }

  async function save() {
    if (!form.code.trim() || !form.title.trim() || !form.departmentId) {
      setMsg({ type: 'err', text: 'Code, title and department are required.' }); return
    }
    setSaving(true); setMsg(null)
    try {
      const url    = modal === 'edit' ? `/api/academics/courses/${editing!.id}` : '/api/academics/courses'
      const method = modal === 'edit' ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.message ?? 'Save failed.' }); return }
      if (modal === 'edit') {
        setCourses(prev => prev.map(c => c.id === data.id ? data : c))
      } else {
        setCourses(prev => [...prev, data])
      }
      closeModal()
    } catch {
      setMsg({ type: 'err', text: 'Network error.' })
    } finally {
      setSaving(false)
    }
  }

  function onUpdated(updated: Course) {
    setCourses(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  async function deleteCourse(c: Course) {
    if (!confirm(`Delete course ${c.code}? This cannot be undone.`)) return
    const res  = await fetch(`/api/academics/courses/${c.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { alert(data.message ?? 'Delete failed.'); return }
    setCourses(prev => prev.filter(x => x.id !== c.id))
  }

  const levels = [...new Set(courses.map(c => c.level))].sort((a, b) => a - b)

  const filtered = courses.filter(c => {
    const q = search.toLowerCase()
    if (q && !c.code.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q)) return false
    if (filterFaculty && c.department.faculty?.id !== filterFaculty) return false
    if (filterDept && (c as any).departmentId !== filterDept) return false
    if (filterLevel && String(c.level) !== filterLevel) return false
    if (filterStatus && c.status !== filterStatus) return false
    if (filterProgram && !c.programCourses.some(pc => pc.programId === filterProgram)) return false
    return true
  })

  return (
    <div className="space-y-5">
      {/* Prereq panel */}
      {prereqCourse && (
        <PrereqPanel
          course={prereqCourse}
          allCourses={courses}
          onClose={() => setPrereqCourse(null)}
          onUpdated={onUpdated}
        />
      )}

      {/* Course modal */}
      {modal && (
        <CourseModal
          mode={modal}
          form={form}
          setForm={setForm}
          faculties={faculties}
          departments={deptsWithFaculty}
          initialFacultyId={editing?.department.faculty?.id ?? ''}
          saving={saving}
          msg={msg}
          onSave={save}
          onClose={closeModal}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Courses</h2>
          <p className="text-sm text-gray-400">{courses.length} course{courses.length !== 1 ? 's' : ''} in catalog</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> New Course
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search courses…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {faculties.length > 0 && (
          <select
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterFaculty}
            onChange={e => setFilterFaculty(e.target.value)}
          >
            <option value="">All Faculties</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        )}
        {visibleDepts.length > 0 && (
          <select
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {visibleDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
        {levels.length > 1 && (
          <select
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
          >
            <option value="">All Levels</option>
            {levels.map(l => <option key={l} value={String(l)}>{l} Level</option>)}
          </select>
        )}
        {programs.length > 0 && (
          <select
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterProgram}
            onChange={e => setFilterProgram(e.target.value)}
          >
            <option value="">All Programs</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </select>
        )}
        <select
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">{courses.length === 0 ? 'No courses yet.' : 'No results match your filters.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Course</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Department</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Level</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Credits</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Prerequisites</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 border-r border-gray-100">
                    <p className="font-semibold text-gray-900">{c.code}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.title}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 border-r border-gray-100">
                    <p>{c.department.name}</p>
                    {c.department.faculty && <p className="text-xs text-gray-300 mt-0.5">{c.department.faculty.name}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 border-r border-gray-100">{c.level}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 border-r border-gray-100">{c.creditHours} hrs</td>
                  <td className="px-5 py-3.5 border-r border-gray-100">
                    {c.prerequisites && c.prerequisites.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {c.prerequisites.map(code => (
                          <span key={code} className="bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">{code}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">None</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 border-r border-gray-100">
                    <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setPrereqCourse(c)} title="Manage prerequisites"
                        className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                        <GitBranch className="w-3.5 h-3.5" /> Prereqs
                      </button>
                      <button onClick={() => openEdit(c)} title="Edit course"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCourse(c)} title="Delete course"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
