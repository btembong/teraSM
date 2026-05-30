'use client'

import { useEffect, useState } from 'react'
import {
  Building2, Plus, Pencil, Trash2, Star, Loader2, X, Save,
  MapPin, Phone, Mail, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { SkeletonTable } from '@/components/ui/skeleton'

interface Campus {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  isMain: boolean
}

const EMPTY: Omit<Campus, 'id'> = {
  name: '', code: '', address: '', city: '', phone: '', email: '', isMain: false,
}

export default function CampusesPage() {
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState<'create' | 'edit' | null>(null)
  const [form,     setForm]     = useState<Omit<Campus, 'id'>>(EMPTY)
  const [editing,  setEditing]  = useState<Campus | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    const data = await fetch('/api/admin/campuses').then(r => r.json())
    setCampuses(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm(EMPTY)
    setEditing(null)
    setMsg(null)
    setModal('create')
  }

  const openEdit = (c: Campus) => {
    setEditing(c)
    setForm({ name: c.name, code: c.code, address: c.address ?? '', city: c.city ?? '', phone: c.phone ?? '', email: c.email ?? '', isMain: c.isMain })
    setMsg(null)
    setModal('edit')
  }

  const closeModal = () => { setModal(null); setEditing(null); setMsg(null) }

  const save = async () => {
    if (!form.name || !form.code) {
      setMsg({ type: 'err', text: 'Name and code are required.' })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      const url    = modal === 'edit' ? `/api/admin/campuses/${editing!.id}` : '/api/admin/campuses'
      const method = modal === 'edit' ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.error ?? 'Save failed.' }); return }

      if (modal === 'edit') {
        // If this was set as main, unset all others
        setCampuses(prev => prev.map(c => c.id === data.id ? data : (data.isMain ? { ...c, isMain: false } : c)))
      } else {
        if (data.isMain) {
          setCampuses(prev => [data, ...prev.map(c => ({ ...c, isMain: false }))])
        } else {
          setCampuses(prev => [...prev, data])
        }
      }
      closeModal()
    } catch {
      setMsg({ type: 'err', text: 'Network error.' })
    } finally {
      setSaving(false)
    }
  }

  const deleteCampus = async (c: Campus) => {
    if (!confirm(`Delete campus "${c.name}"? This cannot be undone.`)) return
    const res  = await fetch(`/api/admin/campuses/${c.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { alert(data.error ?? 'Delete failed.'); return }
    setCampuses(prev => prev.filter(x => x.id !== c.id))
  }

  const setMain = async (c: Campus) => {
    const res  = await fetch(`/api/admin/campuses/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isMain: true }),
    })
    const data = await res.json()
    if (!res.ok) return
    setCampuses(prev => prev.map(x => x.id === data.id ? data : { ...x, isMain: false }))
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Campuses</h2>
          <p className="text-sm text-slate-400 mt-0.5">{campuses.length} campus{campuses.length !== 1 ? 'es' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Campus
        </button>
      </div>

      {/* Campus grid */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : campuses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-2xl">
          <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No campuses yet. Add your first campus.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campuses.map(c => (
            <div key={c.id} className={`bg-white rounded-2xl border p-5 relative ${c.isMain ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-gray-200'}`}>
              {c.isMain && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3" /> Main
                </span>
              )}

              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{c.code}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-sm mb-4">
                {(c.address || c.city) && (
                  <div className="flex items-start gap-2 text-gray-500">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span className="text-xs">{[c.address, c.city].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs">{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs">{c.email}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                {!c.isMain && (
                  <button
                    onClick={() => setMain(c)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" /> Set Main
                  </button>
                )}
                <button
                  onClick={() => openEdit(c)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                {!c.isMain && (
                  <button
                    onClick={() => deleteCampus(c)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{modal === 'create' ? 'Add Campus' : 'Edit Campus'}</h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Campus Name *</label>
                  <input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Main Campus" />
                </div>
                <div>
                  <label className={lbl}>Code *</label>
                  <input className={inp} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="MAIN" maxLength={10} />
                </div>
                <div>
                  <label className={lbl}>City</label>
                  <input className={inp} value={form.city ?? ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Lagos" />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Address</label>
                  <input className={inp} value={form.address ?? ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 University Road" />
                </div>
                <div>
                  <label className={lbl}>Phone</label>
                  <input className={inp} value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+234 800 000 0000" />
                </div>
                <div>
                  <label className={lbl}>Email</label>
                  <input className={inp} type="email" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="campus@school.edu" />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isMain}
                  onChange={e => setForm(f => ({ ...f, isMain: e.target.checked }))}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-sm text-gray-700">Set as main campus</span>
              </label>

              {msg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                  msg.type === 'ok' ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {msg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {msg.text}
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {modal === 'create' ? 'Create Campus' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
