'use client'

import { useEffect, useState } from 'react'
import {
  Building2, Plus, Pencil, Trash2, X, Save, Loader2,
  BookOpen, GraduationCap, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { SkeletonTable } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'

interface Faculty { id: string; name: string; code: string }
interface Department {
  id: string; name: string; code: string; description?: string
  facultyId?: string | null
  faculty?: { name: string; code: string } | null
  _count?: { courses: number; programs: number }
}

type ModalMode = 'create' | 'edit'
const EMPTY_FORM = { name: '', code: '', description: '', facultyId: '' }

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [faculties,   setFaculties]   = useState<Faculty[]>([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState<ModalMode | null>(null)
  const [editing,     setEditing]     = useState<Department | null>(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)
  const [msg,         setMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [search,      setSearch]      = useState('')
  const [filterFaculty, setFilterFaculty] = useState('')

  async function load() {
    setLoading(true)
    const [dRes, fRes] = await Promise.all([
      fetch('/api/academics/departments'),
      fetch('/api/admin/faculties'),
    ])
    const [dData, fData] = await Promise.all([dRes.json(), fRes.json()])
    setDepartments(Array.isArray(dData) ? dData : [])
    setFaculties(Array.isArray(fData) ? fData : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(EMPTY_FORM); setEditing(null); setMsg(null); setModal('create')
  }
  function openEdit(d: Department) {
    setForm({ name: d.name, code: d.code, description: d.description ?? '', facultyId: d.facultyId ?? '' })
    setEditing(d); setMsg(null); setModal('edit')
  }
  function closeModal() { setModal(null); setEditing(null); setMsg(null) }

  async function save() {
    if (!form.name.trim() || !form.code.trim()) {
      setMsg({ type: 'err', text: 'Name and code are required.' }); return
    }
    setSaving(true); setMsg(null)
    try {
      const url    = modal === 'edit' ? `/api/academics/departments/${editing!.id}` : '/api/academics/departments'
      const method = modal === 'edit' ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, facultyId: form.facultyId || null }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.message ?? 'Save failed.' }); return }
      if (modal === 'edit') {
        setDepartments(prev => prev.map(d => d.id === data.id ? data : d))
      } else {
        setDepartments(prev => [...prev, data])
      }
      closeModal()
    } catch {
      setMsg({ type: 'err', text: 'Network error.' })
    } finally {
      setSaving(false)
    }
  }

  async function deleteDept(d: Department) {
    if (!confirm(`Delete "${d.name}"? This cannot be undone.`)) return
    const res  = await fetch(`/api/academics/departments/${d.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { alert(data.message ?? 'Delete failed.'); return }
    setDepartments(prev => prev.filter(x => x.id !== d.id))
  }

  const filtered = departments.filter(d => {
    const matchSearch  = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
    const matchFaculty = !filterFaculty
      || (filterFaculty === 'unassigned' ? !d.facultyId : d.facultyId === filterFaculty)
    return matchSearch && matchFaculty
  })

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Departments</h2>
          <p className="text-sm text-gray-400">{departments.length} department{departments.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> New Department
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search departments…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {faculties.length > 0 && (
          <select
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterFaculty}
            onChange={e => setFilterFaculty(e.target.value)}
          >
            <option value="">All Faculties</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            <option value="unassigned">⚠ No Faculty Assigned</option>
          </select>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={departments.length === 0 ? 'No departments yet' : 'No results match your filters'}
          description={departments.length === 0 ? 'Create your first department to get started.' : 'Try adjusting your search or filters.'}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm table-hover">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Department</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Code</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Faculty</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Programs</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100">Courses</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 border-r border-gray-100">
                    <p className="font-semibold text-gray-900">{d.name}</p>
                    {d.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{d.description}</p>}
                  </td>
                  <td className="px-5 py-3.5 border-r border-gray-100">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg font-mono">{d.code}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 border-r border-gray-100">
                    {d.faculty
                      ? <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-gray-400" />{d.faculty.name}</span>
                      : <span className="text-gray-300 text-xs italic">Unassigned</span>
                    }
                  </td>
                  <td className="px-5 py-3.5 text-center border-r border-gray-100">
                    <span className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                      <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                      {d._count?.programs ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center border-r border-gray-100">
                    <span className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                      <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                      {d._count?.courses ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteDept(d)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{modal === 'create' ? 'New Department' : 'Edit Department'}</h3>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Department Name *</label>
                  <input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Computer Science" />
                </div>
                <div>
                  <label className={lbl}>Code *</label>
                  <input className={inp} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="CS" maxLength={10} />
                </div>
                <div>
                  <label className={lbl}>Faculty</label>
                  <select className={inp} value={form.facultyId} onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}>
                    <option value="">— None —</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name} ({f.code})</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Description</label>
                  <textarea className={`${inp} resize-none`} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description (optional)" />
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
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {modal === 'create' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
