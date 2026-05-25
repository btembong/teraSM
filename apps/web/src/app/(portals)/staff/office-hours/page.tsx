'use client'

import { useEffect, useState } from 'react'
import { Clock, Plus, Trash2, CalendarDays, CheckCircle, XCircle } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface Slot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  location: string | null
  isOnline: boolean
  meetingLink: string | null
  isActive: boolean
  bookings: Booking[]
}

interface Booking {
  id: string
  studentId: string
  bookingDate: string
  note: string | null
  status: string
  student?: { firstName: string; lastName: string; email: string }
}

export default function OfficeHoursPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00', location: '', isOnline: false, meetingLink: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  function load() {
    fetch('/api/staff/office-hours').then(r => r.json()).then(data => setSlots(data ?? []))
  }

  async function createSlot(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/staff/office-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setAdding(false)
    load()
  }

  async function deleteSlot(id: string) {
    if (!confirm('Delete this slot?')) return
    await fetch(`/api/staff/office-hours/${id}`, { method: 'DELETE' })
    setSlots(prev => prev.filter(s => s.id !== id))
  }

  async function updateBooking(bookingId: string, status: string) {
    await fetch(`/api/staff/office-hours/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  const pendingBookings = slots.flatMap(s => s.bookings.filter(b => b.status === 'PENDING'))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Office Hours</h1>
        {!adding && (
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        )}
      </div>

      {/* Pending bookings alert */}
      {pendingBookings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-3">{pendingBookings.length} pending booking{pendingBookings.length !== 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {pendingBookings.map(b => (
              <div key={b.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2">
                <div className="flex-1 text-sm">
                  <span className="font-medium">{b.student?.firstName} {b.student?.lastName}</span>
                  <span className="text-gray-400 ml-2 text-xs">{new Date(b.bookingDate).toLocaleDateString()}</span>
                  {b.note && <span className="text-gray-500 ml-2 text-xs">· {b.note}</span>}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => updateBooking(b.id, 'CONFIRMED')} className="p-1.5 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </button>
                  <button onClick={() => updateBooking(b.id, 'CANCELLED')} className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                    <XCircle className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add slot form */}
      {adding && (
        <form onSubmit={createSlot} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">New Office Hour Slot</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Day</label>
              <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: +e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Location (room / office)</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Room 204"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Online Meeting Link</label>
              <input value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isOnline} onChange={e => setForm(f => ({ ...f, isOnline: e.target.checked }))}
              className="w-4 h-4 rounded text-blue-600" />
            <span className="text-sm text-gray-700">Online slot</span>
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Create Slot'}
            </button>
            <button type="button" onClick={() => setAdding(false)}
              className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Slots list */}
      {slots.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No office hour slots set up yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map(slot => (
            <div key={slot.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {DAYS[slot.dayOfWeek]} · {slot.startTime} – {slot.endTime}
                    </p>
                    <p className="text-xs text-gray-400">
                      {slot.isOnline ? 'Online' : slot.location ?? 'No location set'}
                      {slot.meetingLink && <> · <a href={slot.meetingLink} className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">Join Link</a></>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{slot.bookings.length} booking{slot.bookings.length !== 1 ? 's' : ''}</span>
                  <button onClick={() => deleteSlot(slot.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {slot.bookings.filter(b => b.status === 'CONFIRMED').length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                  {slot.bookings.filter(b => b.status === 'CONFIRMED').map(b => (
                    <div key={b.id} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="font-medium">{b.student?.firstName} {b.student?.lastName}</span>
                      <span className="text-gray-400">· {new Date(b.bookingDate).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
