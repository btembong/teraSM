'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Building2, AlertCircle, CheckCircle, BookOpen } from 'lucide-react'

type Department = {
  id: string
  name: string
  code: string
  _count: { courses: number }
}

type Faculty = {
  id: string
  name: string
  code: string
  description: string | null
  _count: { departments: number }
  departments: Department[]
}

type UnassignedDept = {
  id: string
  name: string
  code: string
}

export default function FacultiesPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [unassigned, setUnassigned] = useState<UnassignedDept[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Faculty | null>(null)
  const [form, setForm] = useState({ name: '', code: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function load() {
    const [fRes, dRes] = await Promise.all([
      fetch('/api/admin/faculties'),
      fetch('/api/academics/departments'),
    ])
    const fData = await fRes.json()
    const dData = await dRes.json()
    setFaculties(Array.isArray(fData) ? fData : [])
    // departments not yet assigned to a faculty
    const assignedIds = new Set((Array.isArray(fData) ? fData : []).flatMap((f: Faculty) => f.departments.map(d => d.id)))
    setUnassigned((Array.isArray(dData) ? dData : []).filter((d: UnassignedDept) => !assignedIds.has(d.id)))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', code: '', description: '' })
    setError('')
    setShowForm(true)
  }

  function openEdit(f: Faculty) {
    setEditing(f)
    setForm({ name: f.name, code: f.code, description: f.description ?? '' })
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const url = editing ? `/api/admin/faculties/${editing.id}` : '/api/admin/faculties'
    const method = editing ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to save faculty.')
      setSaving(false)
      return
    }
    showToast(editing ? 'Faculty updated' : 'Faculty created', 'success')
    setShowForm(false)
    load()
    setSaving(false)
  }

  async function handleDelete(f: Faculty) {
    if (!confirm(`Delete "${f.name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/faculties/${f.id}`, { method: 'DELETE' })
    const d = await res.json()
    if (!res.ok) {
      showToast(d.error, 'error')
      return
    }
    showToast('Faculty deleted', 'success')
    load()
  }

  async function assignDept(facultyId: string, departmentId: string, assign: boolean) {
    await fetch(`/api/admin/faculties/${facultyId}/departments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departmentId, assign }),
    })
    load()
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[300px]"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculties</h1>
          <p className="text-sm text-gray-500 mt-1">Top-level academic divisions containing departments</p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> New Faculty
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">{editing ? 'Edit Faculty' : 'New Faculty'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Faculty name <span className="text-red-400">*</span></label>
              <input type="text" required placeholder="e.g. Faculty of Engineering"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Code <span className="text-red-400">*</span></label>
              <input type="text" required placeholder="e.g. ENG"
                value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
            <input type="text" placeholder="Optional description"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 sm:flex-none sm:px-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Create faculty'}
            </button>
          </div>
        </form>
      )}

      {/* Hierarchy diagram */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex items-center gap-3 text-sm text-blue-800">
        <GraduationCap className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="font-medium">Academic hierarchy:</span>
        <span className="text-blue-600">Faculty → Department → Course → Course Offering</span>
      </div>

      {/* Faculties list */}
      {faculties.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <GraduationCap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-500">No faculties yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first faculty to start organising departments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faculties.map(f => (
            <div key={f.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {/* Faculty header */}
              <div className="flex items-center gap-4 px-5 py-4">
                <button onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{f.name}</p>
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{f.code}</span>
                    </div>
                    {f.description && <p className="text-xs text-gray-400 mt-0.5">{f.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{f._count.departments} dept{f._count.departments !== 1 ? 's' : ''}</span>
                    {expanded === f.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button onClick={() => openEdit(f)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(f)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded: departments */}
              {expanded === f.id && (
                <div className="border-t border-gray-50 bg-gray-50/50 px-5 py-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Departments in this faculty</p>
                  {f.departments.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No departments assigned yet.</p>
                  ) : (
                    f.departments.map(d => (
                      <div key={d.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-2.5">
                        <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 flex-1">{d.name}</span>
                        <span className="text-xs text-gray-400">{d.code}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />{d._count.courses} courses
                        </span>
                        <button
                          onClick={() => assignDept(f.id, d.id, false)}
                          className="text-xs text-red-500 hover:underline ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}

                  {/* Assign unassigned departments */}
                  {unassigned.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-2">Assign unassigned department:</p>
                      <div className="flex flex-wrap gap-2">
                        {unassigned.map(d => (
                          <button key={d.id}
                            onClick={() => assignDept(f.id, d.id, true)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                            <Plus className="w-3 h-3" /> {d.name} ({d.code})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Unassigned departments */}
      {unassigned.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-yellow-800 mb-2">Unassigned departments ({unassigned.length})</p>
          <p className="text-xs text-yellow-700 mb-3">These departments have no faculty. Expand a faculty above to assign them.</p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map(d => (
              <span key={d.id} className="text-xs font-medium bg-white border border-yellow-200 text-yellow-800 px-3 py-1.5 rounded-lg">
                {d.name} ({d.code})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
