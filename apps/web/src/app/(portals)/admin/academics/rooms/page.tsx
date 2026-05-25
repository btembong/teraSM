'use client'

import { useEffect, useState } from 'react'
import {
  DoorOpen, Plus, Pencil, Trash2, X, Save, Loader2,
  AlertCircle, CheckCircle2, Monitor, FlaskConical, Users,
} from 'lucide-react'

interface Room {
  id: string
  name: string
  code: string | null
  building: string | null
  floor: string | null
  capacity: number
  roomType: string
  hasProjector: boolean
  hasAC: boolean
  isActive: boolean
  _count: { offerings: number }
}

type ModalMode = 'create' | 'edit'

const EMPTY_FORM = {
  name: '', code: '', building: '', floor: '', capacity: 50,
  roomType: 'LECTURE', hasProjector: false, hasAC: false, isActive: true,
}

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const lbl = 'block text-xs font-medium text-gray-600 mb-1'

const ROOM_TYPE_META: Record<string, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  LECTURE:      { label: 'Lecture Hall',   color: 'bg-blue-50 text-blue-700',    Icon: Users },
  LAB:          { label: 'Lab',            color: 'bg-green-50 text-green-700',  Icon: FlaskConical },
  SEMINAR:      { label: 'Seminar Room',   color: 'bg-purple-50 text-purple-700', Icon: Users },
  AUDITORIUM:   { label: 'Auditorium',     color: 'bg-amber-50 text-amber-700',  Icon: Users },
  STUDIO:       { label: 'Studio',         color: 'bg-pink-50 text-pink-700',    Icon: Monitor },
  COMPUTER_LAB: { label: 'Computer Lab',   color: 'bg-cyan-50 text-cyan-700',    Icon: Monitor },
}

export default function RoomsPage() {
  const [rooms, setRooms]     = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState<ModalMode | null>(null)
  const [editing, setEditing] = useState<Room | null>(null)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [search, setSearch]   = useState('')
  const [filterType, setFilterType] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/academics/rooms')
    const data = await res.json()
    setRooms(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(EMPTY_FORM); setEditing(null); setMsg(null); setModal('create')
  }
  function openEdit(r: Room) {
    setForm({
      name: r.name, code: r.code ?? '', building: r.building ?? '',
      floor: r.floor ?? '', capacity: r.capacity, roomType: r.roomType,
      hasProjector: r.hasProjector, hasAC: r.hasAC, isActive: r.isActive,
    })
    setEditing(r); setMsg(null); setModal('edit')
  }
  function closeModal() { setModal(null); setEditing(null); setMsg(null) }

  async function save() {
    if (!form.name.trim()) { setMsg({ type: 'err', text: 'Room name is required.' }); return }
    setSaving(true); setMsg(null)
    try {
      const url    = modal === 'edit' ? `/api/academics/rooms/${editing!.id}` : '/api/academics/rooms'
      const method = modal === 'edit' ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.message ?? 'Save failed.' }); return }
      if (modal === 'edit') {
        setRooms(prev => prev.map(r => r.id === data.id ? data : r))
      } else {
        setRooms(prev => [...prev, data])
      }
      closeModal()
    } catch {
      setMsg({ type: 'err', text: 'Network error.' })
    } finally {
      setSaving(false)
    }
  }

  async function deleteRoom(r: Room) {
    if (!confirm(`Delete room "${r.name}"? This cannot be undone.`)) return
    const res  = await fetch(`/api/academics/rooms/${r.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { alert(data.message ?? 'Delete failed.'); return }
    setRooms(prev => prev.filter(x => x.id !== r.id))
  }

  const filtered = rooms.filter(r => {
    const q = search.toLowerCase()
    if (q && !r.name.toLowerCase().includes(q) && !(r.building ?? '').toLowerCase().includes(q) && !(r.code ?? '').toLowerCase().includes(q)) return false
    if (filterType && r.roomType !== filterType) return false
    return true
  })

  const totalCapacity = rooms.filter(r => r.isActive).reduce((n, r) => n + r.capacity, 0)

  return (
    <div className="space-y-5">
      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{modal === 'create' ? 'New Room' : 'Edit Room'}</h3>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Room Name *</label>
                  <input className={inp} value={form.name} placeholder="e.g. Block A, Room 201"
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Code</label>
                  <input className={inp} value={form.code} placeholder="e.g. A-201"
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} maxLength={20} />
                </div>
                <div>
                  <label className={lbl}>Room Type</label>
                  <select className={inp} value={form.roomType} onChange={e => setForm(f => ({ ...f, roomType: e.target.value }))}>
                    {Object.entries(ROOM_TYPE_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Building</label>
                  <input className={inp} value={form.building} placeholder="e.g. Science Complex"
                    onChange={e => setForm(f => ({ ...f, building: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Floor</label>
                  <input className={inp} value={form.floor} placeholder="e.g. Ground, 2nd"
                    onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Capacity (seats)</label>
                  <input type="number" min={1} className={inp} value={form.capacity}
                    onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} />
                </div>
                <div>
                  <label className={lbl}>Status</label>
                  <select className={inp} value={form.isActive ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="col-span-2 flex gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.hasProjector} onChange={e => setForm(f => ({ ...f, hasProjector: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">Projector / Screen</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.hasAC} onChange={e => setForm(f => ({ ...f, hasAC: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">Air Conditioning</span>
                  </label>
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

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rooms & Venues</h2>
          <p className="text-sm text-gray-400">
            {rooms.filter(r => r.isActive).length} active rooms · {totalCapacity.toLocaleString()} total seats
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> New Room
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search rooms…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterType} onChange={e => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {Object.entries(ROOM_TYPE_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <DoorOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">{rooms.length === 0 ? 'No rooms yet.' : 'No results match your filters.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Room</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Building</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Capacity</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">In Use</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Features</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => {
                const meta = ROOM_TYPE_META[r.roomType] ?? ROOM_TYPE_META.LECTURE
                const Icon = meta.Icon
                return (
                  <tr key={r.id} className={`hover:bg-gray-50/60 transition-colors ${!r.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{r.name}</p>
                      {r.code && <p className="text-xs text-gray-400 font-mono mt-0.5">{r.code}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">
                      {r.building ?? <span className="text-gray-300">—</span>}
                      {r.floor && <span className="text-gray-400 ml-1">· {r.floor}</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {r.capacity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm text-gray-500">
                      {r._count.offerings > 0
                        ? <span className="text-blue-600 font-semibold">{r._count.offerings} offering{r._count.offerings !== 1 ? 's' : ''}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {r.hasProjector && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Monitor className="w-3 h-3" /> Projector
                          </span>
                        )}
                        {r.hasAC && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">AC</span>
                        )}
                        {!r.hasProjector && !r.hasAC && <span className="text-gray-300 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteRoom(r)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
