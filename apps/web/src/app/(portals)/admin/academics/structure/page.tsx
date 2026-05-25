'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  GraduationCap, Building2, BookOpen, Plus, Pencil, Trash2,
  X, Save, Loader2, ChevronDown, ChevronRight, AlertCircle, CheckCircle2,
  ScrollText,
} from 'lucide-react'

interface ProgramSummary {
  id: string; name: string; code: string
  degreeType: string; durationYears: number; requiredCredits: number; isActive: boolean
}
interface DeptSummary {
  id: string; name: string; code: string
  _count: { courses: number }
  programs: ProgramSummary[]
}
interface Faculty {
  id: string; name: string; code: string; description?: string | null
  _count: { departments: number }
  departments: DeptSummary[]
}

const DEGREE_LABELS: Record<string, string> = {
  CERTIFICATE: 'Cert', DIPLOMA: 'Diploma', ASSOCIATE: 'AS',
  BACHELOR: 'Bachelor', POSTGRADUATE_DIPLOMA: 'PG Dip', MASTER: 'Master', DOCTORATE: 'PhD',
}
const DEGREE_COLORS: Record<string, string> = {
  CERTIFICATE:           'bg-slate-100 text-slate-600',
  DIPLOMA:               'bg-slate-100 text-slate-600',
  ASSOCIATE:             'bg-blue-50 text-blue-700',
  BACHELOR:              'bg-indigo-50 text-indigo-700',
  POSTGRADUATE_DIPLOMA:  'bg-purple-50 text-purple-700',
  MASTER:                'bg-purple-50 text-purple-700',
  DOCTORATE:             'bg-rose-50 text-rose-700',
}
const DEGREE_TYPES = [
  'CERTIFICATE', 'DIPLOMA', 'ASSOCIATE', 'BACHELOR', 'POSTGRADUATE_DIPLOMA', 'MASTER', 'DOCTORATE',
]

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
const lbl = 'block text-xs font-medium text-gray-600 mb-1'

type ModalType =
  | { kind: 'newFaculty' }
  | { kind: 'editFaculty'; faculty: Faculty }
  | { kind: 'newDept'; facultyId: string; facultyName: string }
  | { kind: 'editDept'; dept: DeptSummary; facultyId: string }
  | { kind: 'newProgram'; deptId: string; deptName: string; facultyId: string }
  | { kind: 'editProgram'; program: ProgramSummary; deptId: string; facultyId: string }
  | null

function Modal({ modal, faculties, onClose, onDone }: {
  modal: Exclude<ModalType, null>
  faculties: Faculty[]
  onClose: () => void
  onDone: () => void
}) {
  const isFaculty    = modal.kind === 'newFaculty' || modal.kind === 'editFaculty'
  const isDept       = modal.kind === 'newDept'     || modal.kind === 'editDept'
  const isProgram    = modal.kind === 'newProgram'  || modal.kind === 'editProgram'
  const isNew        = modal.kind === 'newFaculty'  || modal.kind === 'newDept' || modal.kind === 'newProgram'

  const initProgram  = modal.kind === 'editProgram' ? modal.program : null
  const initDept     = modal.kind === 'editDept'    ? modal.dept    : null
  const initFaculty  = modal.kind === 'editFaculty' ? modal.faculty : null

  const [name, setName]               = useState(initFaculty?.name ?? initDept?.name ?? initProgram?.name ?? '')
  const [code, setCode]               = useState(initFaculty?.code ?? initDept?.code ?? initProgram?.code ?? '')
  const [desc, setDesc]               = useState(initFaculty?.description ?? '')
  const [facultyId, setFacultyId]     = useState(
    modal.kind === 'editDept' ? modal.facultyId :
    modal.kind === 'newDept'  ? modal.facultyId : ''
  )
  const [degreeType, setDegreeType]   = useState(initProgram?.degreeType ?? 'BACHELOR')
  const [durationYrs, setDurationYrs] = useState(String(initProgram?.durationYears ?? 4))
  const [reqCredits, setReqCredits]   = useState(String(initProgram?.requiredCredits ?? 120))
  const [saving, setSaving]           = useState(false)
  const [err, setErr]                 = useState('')

  const title = {
    newFaculty: 'New Faculty', editFaculty: 'Edit Faculty',
    newDept: 'New Department', editDept: 'Edit Department',
    newProgram: `New Program${'deptName' in modal ? ` · ${modal.deptName}` : ''}`,
    editProgram: 'Edit Program',
  }[modal.kind]

  async function submit() {
    if (!name.trim() || !code.trim()) { setErr('Name and code are required.'); return }
    setSaving(true); setErr('')
    try {
      let url: string; let method: string; let body: Record<string, unknown>

      if (modal.kind === 'newFaculty') {
        url = '/api/admin/faculties'; method = 'POST'
        body = { name: name.trim(), code: code.trim(), description: desc.trim() || null }
      } else if (modal.kind === 'editFaculty') {
        url = `/api/admin/faculties/${modal.faculty.id}`; method = 'PATCH'
        body = { name: name.trim(), code: code.trim(), description: desc.trim() || null }
      } else if (modal.kind === 'newDept') {
        url = '/api/academics/departments'; method = 'POST'
        body = { name: name.trim(), code: code.trim(), facultyId: facultyId || null }
      } else if (modal.kind === 'editDept') {
        url = `/api/academics/departments/${modal.dept.id}`; method = 'PATCH'
        body = { name: name.trim(), code: code.trim(), facultyId: facultyId || null }
      } else if (modal.kind === 'newProgram') {
        url = '/api/academics/programs'; method = 'POST'
        body = {
          name: name.trim(), code: code.trim(),
          departmentId: modal.deptId,
          degreeType, durationYears: Number(durationYrs), requiredCredits: Number(reqCredits),
          description: desc.trim() || null,
        }
      } else {
        url = `/api/academics/programs/${modal.program.id}`; method = 'PATCH'
        body = {
          name: name.trim(), code: code.trim(),
          degreeType, durationYears: Number(durationYrs), requiredCredits: Number(reqCredits),
          description: desc.trim() || null,
        }
      }

      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? data.message ?? 'Failed.'); return }
      onDone(); onClose()
    } catch {
      setErr('Network error.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={lbl}>{isFaculty ? 'Faculty' : isDept ? 'Department' : 'Program'} Name *</label>
            <input className={inp} value={name} onChange={e => setName(e.target.value)}
              placeholder={isFaculty ? 'e.g. Faculty of Engineering' : isDept ? 'e.g. Computer Science' : 'e.g. Bachelor of Science in Computer Science'} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Code *</label>
              <input className={inp} value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder={isFaculty ? 'ENG' : isDept ? 'CS' : 'BSC-CS'} maxLength={12} />
            </div>
            {isProgram && (
              <div>
                <label className={lbl}>Degree Type</label>
                <select className={inp} value={degreeType} onChange={e => setDegreeType(e.target.value)}>
                  {DEGREE_TYPES.map(d => <option key={d} value={d}>{DEGREE_LABELS[d]}</option>)}
                </select>
              </div>
            )}
            {isDept && (
              <div>
                <label className={lbl}>Faculty</label>
                <select className={inp} value={facultyId} onChange={e => setFacultyId(e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.name} ({f.code})</option>)}
                </select>
              </div>
            )}
          </div>

          {isProgram && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Duration (years)</label>
                <input className={inp} type="number" min={1} max={10} value={durationYrs}
                  onChange={e => setDurationYrs(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Required Credits</label>
                <input className={inp} type="number" min={1} value={reqCredits}
                  onChange={e => setReqCredits(e.target.value)} />
              </div>
            </div>
          )}

          {(isFaculty || isProgram) && (
            <div>
              <label className={lbl}>Description <span className="text-gray-400">(optional)</span></label>
              <textarea className={`${inp} resize-none`} rows={2} value={desc}
                onChange={e => setDesc(e.target.value)} placeholder="Optional" />
            </div>
          )}

          {err && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{err}
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StructurePage() {
  const [faculties, setFaculties]     = useState<Faculty[]>([])
  const [loading, setLoading]         = useState(true)
  const [expanded, setExpanded]       = useState<Set<string>>(new Set())
  const [modal, setModal]             = useState<ModalType>(null)
  const [toast, setToast]             = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [search, setSearch]           = useState('')
  const [filterDegree, setFilterDegree] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/faculties')
    if (res.ok) {
      const data = await res.json()
      setFaculties(Array.isArray(data) ? data : [])
      setExpanded(new Set((data as Faculty[]).map(f => f.id)))
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function deleteFaculty(f: Faculty) {
    if (!confirm(`Delete faculty "${f.name}"? This cannot be undone.`)) return
    const res  = await fetch(`/api/admin/faculties/${f.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { showToast(data.error ?? 'Delete failed.', 'err'); return }
    showToast(`Faculty "${f.name}" deleted`, 'ok'); load()
  }

  async function deleteDept(d: DeptSummary) {
    if (!confirm(`Delete department "${d.name}"? This cannot be undone.`)) return
    const res  = await fetch(`/api/academics/departments/${d.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { showToast(data.message ?? 'Delete failed.', 'err'); return }
    showToast(`Department "${d.name}" deleted`, 'ok'); load()
  }

  async function deleteProgram(p: ProgramSummary) {
    if (!confirm(`Delete program "${p.name}"? This cannot be undone.`)) return
    const res  = await fetch(`/api/academics/programs/${p.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { showToast(data.message ?? 'Delete failed.', 'err'); return }
    showToast(`Program "${p.name}" deleted`, 'ok'); load()
  }

  const totalDepts    = faculties.reduce((n, f) => n + f._count.departments, 0)
  const totalPrograms = faculties.reduce((n, f) => n + f.departments.reduce((m, d) => m + d.programs.length, 0), 0)
  const totalCourses  = faculties.reduce((n, f) => n + f.departments.reduce((m, d) => m + d._count.courses, 0), 0)

  // ── Tree-aware filtering ────────────────────────────────────────────────────
  const hasFilters = !!search.trim() || !!filterDegree || !!filterStatus
  const q = search.toLowerCase().trim()

  const displayFaculties: Faculty[] = hasFilters
    ? faculties.reduce<Faculty[]>((acc, f) => {
        const fMatch = !q || f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q)
        const filteredDepts = f.departments.reduce<DeptSummary[]>((dacc, d) => {
          const dMatch = !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
          const filteredProgs = d.programs.filter(p => {
            const pMatch = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
            const degreeOk = !filterDegree || p.degreeType === filterDegree
            const statusOk = !filterStatus || (filterStatus === 'active' ? p.isActive : !p.isActive)
            return (fMatch || dMatch || pMatch) && degreeOk && statusOk
          })
          if (dMatch || filteredProgs.length > 0) dacc.push({ ...d, programs: filteredProgs })
          return dacc
        }, [])
        if (fMatch || filteredDepts.length > 0) acc.push({ ...f, departments: filteredDepts })
        return acc
      }, [])
    : faculties

  const allExpanded = faculties.length > 0 && faculties.every(f => expanded.has(f.id))

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium ${
          toast.type === 'ok' ? 'bg-indigo-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal modal={modal} faculties={faculties} onClose={() => setModal(null)}
          onDone={() => { load(); showToast('Saved successfully', 'ok') }} />
      )}

      {/* Page header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Academic Structure</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {faculties.length} {faculties.length === 1 ? 'faculty' : 'faculties'} · {totalDepts} departments · {totalPrograms} programs · {totalCourses} courses
          </p>
        </div>
        <button
          onClick={() => setModal({ kind: 'newFaculty' })}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> New Faculty
        </button>
      </div>

      {/* Filter bar */}
      {!loading && faculties.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <input
            className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search faculties, departments, programs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterDegree}
            onChange={e => setFilterDegree(e.target.value)}
          >
            <option value="">All Degrees</option>
            {DEGREE_TYPES.map(d => <option key={d} value={d}>{DEGREE_LABELS[d]}</option>)}
          </select>
          <select
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={() => setExpanded(allExpanded ? new Set() : new Set(faculties.map(f => f.id)))}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-slate-500 hover:text-slate-700 hover:bg-gray-50 bg-white transition-colors whitespace-nowrap"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>

      /* Empty */
      ) : faculties.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-7 h-7 text-indigo-400" />
          </div>
          <p className="text-slate-700 font-semibold text-sm">No faculties yet</p>
          <p className="text-slate-400 text-xs mt-1 mb-4">Create your first faculty to start building your academic structure.</p>
          <button onClick={() => setModal({ kind: 'newFaculty' })}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Create Faculty
          </button>
        </div>

      ) : displayFaculties.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No results match your filters.</p>
          <button onClick={() => { setSearch(''); setFilterDegree(''); setFilterStatus('') }}
            className="mt-3 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
            Clear filters
          </button>
        </div>

      /* Tree */
      ) : (
        <div className="space-y-4">
          {displayFaculties.map(f => {
            const isOpen = hasFilters || expanded.has(f.id)
            return (
              <div key={f.id} className="bg-white rounded-2xl border border-indigo-200 border-l-4 border-l-indigo-400 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">

                {/* ── FACULTY header band ───────────────────────────────── */}
                <div className="flex items-center gap-3 px-5 py-4 group border-b border-indigo-100 bg-indigo-50 hover:bg-indigo-100/50 transition-colors">
                  <button
                    onClick={() => toggle(f.id)}
                    className="p-1 rounded-lg hover:bg-slate-200/60 transition-colors flex-shrink-0"
                    aria-label={isOpen ? 'Collapse' : 'Expand'}
                  >
                    {isOpen
                      ? <ChevronDown  className="w-4 h-4 text-slate-400" />
                      : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>

                  {/* Icon */}
                  <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <GraduationCap className="w-4.5 h-4.5 text-white" />
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0" onClick={() => toggle(f.id)} role="button">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{f.name}</span>
                      <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md">{f.code}</span>
                    </div>
                    {f.description && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{f.description}</p>
                    )}
                  </div>

                  {/* Stats chips */}
                  <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                    <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-full font-medium">
                      {f._count.departments} dept{f._count.departments !== 1 ? 's' : ''}
                    </span>
                    <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-full font-medium">
                      {f.departments.reduce((n, d) => n + d.programs.length, 0)} programs
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setModal({ kind: 'newDept', facultyId: f.id, facultyName: f.name })}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Dept
                    </button>
                    <button onClick={() => setModal({ kind: 'editFaculty', faculty: f })}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteFaculty(f)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ── DEPARTMENTS (visible when expanded) ──────────────── */}
                {isOpen && (
                  <div>
                    {f.departments.length === 0 ? (
                      <div className="px-6 py-5 flex items-center gap-3 text-sm text-slate-400">
                        <div className="w-px h-6 bg-gray-200 ml-2" />
                        <span>No departments yet —</span>
                        <button
                          onClick={() => setModal({ kind: 'newDept', facultyId: f.id, facultyName: f.name })}
                          className="text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                        >
                          + Add one
                        </button>
                      </div>
                    ) : (
                      <div>
                        {f.departments.map((d, dIdx) => (
                          <div key={d.id} className={dIdx < f.departments.length - 1 ? 'border-b border-indigo-100' : ''}>

                            {/* ── Department row ─────────────────────────── */}
                            <div className="flex items-center gap-3 px-5 py-3 group/dept bg-white hover:bg-blue-50/30 transition-colors">
                              {/* Tree connector */}
                              <div className="flex flex-col items-center w-5 flex-shrink-0 self-stretch">
                                <div className="w-px flex-1 bg-indigo-200" />
                                <div className="w-3 h-px bg-indigo-200 mt-0" />
                                <div className="w-px flex-1 bg-indigo-200" />
                              </div>

                              {/* Dept icon */}
                              <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                              </div>

                              {/* Dept name */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-slate-800 text-sm">{d.name}</span>
                                  <span className="text-xs font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md">{d.code}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <ScrollText className="w-3 h-3" />
                                    {d.programs.length} program{d.programs.length !== 1 ? 's' : ''}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    {d._count.courses} course{d._count.courses !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>

                              {/* Dept actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => setModal({ kind: 'newProgram', deptId: d.id, deptName: d.name, facultyId: f.id })}
                                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                                >
                                  <Plus className="w-3 h-3" /> Program
                                </button>
                                <button onClick={() => setModal({ kind: 'editDept', dept: d, facultyId: f.id })}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteDept(d)}
                                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* ── Programs under department ───────────────── */}
                            {d.programs.length > 0 && (
                              <div className="bg-purple-50/50 border-t border-purple-100">
                                {d.programs.map((p, pIdx) => (
                                  <div
                                    key={p.id}
                                    className={`flex items-center gap-3 pl-14 pr-5 py-2.5 group/prog hover:bg-purple-50 transition-colors ${
                                      pIdx < d.programs.length - 1 ? 'border-b border-purple-100/60' : ''
                                    }`}
                                  >
                                    {/* Tree sub-connector */}
                                    <div className="flex flex-col items-center w-5 flex-shrink-0 self-stretch -ml-5">
                                      <div className="w-px flex-1 bg-purple-200" />
                                      <div className="w-3 h-px bg-purple-200" />
                                      <div className="w-px flex-1 bg-purple-200" />
                                    </div>

                                    {/* Program dot icon */}
                                    <div className="w-6 h-6 bg-purple-50 border border-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <ScrollText className="w-3 h-3 text-purple-500" />
                                    </div>

                                    {/* Program name + badges */}
                                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                      <span className={`text-sm font-medium ${p.isActive ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                                        {p.name}
                                      </span>
                                      <span className="text-xs font-mono bg-white border border-gray-200 text-slate-500 px-1.5 py-0.5 rounded-md">
                                        {p.code}
                                      </span>
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DEGREE_COLORS[p.degreeType] ?? 'bg-slate-100 text-slate-600'}`}>
                                        {DEGREE_LABELS[p.degreeType] ?? p.degreeType}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        {p.durationYears}yr · {p.requiredCredits} cr
                                      </span>
                                      {!p.isActive && (
                                        <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">Inactive</span>
                                      )}
                                    </div>

                                    {/* Program actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <button
                                        onClick={() => setModal({ kind: 'editProgram', program: p, deptId: d.id, facultyId: f.id })}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button onClick={() => deleteProgram(p)}
                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Program inline link */}
                            <div className="pl-16 pr-5 py-2 bg-purple-50/30 border-t border-purple-100/60">
                              <button
                                onClick={() => setModal({ kind: 'newProgram', deptId: d.id, deptName: d.name, facultyId: f.id })}
                                className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-700 font-medium transition-colors"
                              >
                                <Plus className="w-3 h-3" /> Add Program
                              </button>
                            </div>

                          </div>
                        ))}

                        {/* Add Department inline link */}
                        <div className="px-14 py-3 border-t border-indigo-100 bg-indigo-50/30">
                          <button
                            onClick={() => setModal({ kind: 'newDept', facultyId: f.id, facultyName: f.name })}
                            className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Add Department
                          </button>
                        </div>
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
