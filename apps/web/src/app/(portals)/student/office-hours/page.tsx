'use client'

import { useEffect, useState } from 'react'
import { Clock, MapPin, Video, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmt12(time: string) {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

// Get next occurrence of a given day-of-week (0=Sun)
function nextDate(dayOfWeek: number): string {
  const today = new Date()
  const diff = (dayOfWeek - today.getDay() + 7) % 7 || 7
  const d = new Date(today)
  d.setDate(today.getDate() + diff)
  return d.toISOString().split('T')[0]
}

type Slot = {
  id: string
  dayOfWeek: number
  dayName: string
  startTime: string
  endTime: string
  location: string | null
  isOnline: boolean
  meetingLink: string | null
  teacher: { id: string; firstName: string; lastName: string } | null
  myBooking: Array<{ id: string; bookingDate: string; status: string; note: string | null }>
}

export default function StudentOfficeHoursPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingSlot, setBookingSlot] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/student/office-hours')
    if (res.ok) setSlots(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function book(slot: Slot) {
    setSubmitting(true)
    setError(null)
    const bookingDate = nextDate(slot.dayOfWeek)
    const res = await fetch('/api/student/office-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId: slot.id, bookingDate, note }),
    })
    if (res.ok) {
      setSuccess(`Booking submitted for ${slot.dayName}. Awaiting confirmation.`)
      setBookingSlot(null)
      setNote('')
      await load()
    } else {
      const j = await res.json()
      setError(j.error || 'Failed to book.')
    }
    setSubmitting(false)
  }

  // Group slots by teacher
  const byTeacher = slots.reduce<Record<string, { teacher: Slot['teacher']; slots: Slot[] }>>((acc, s) => {
    const key = s.teacher?.id ?? 'unknown'
    if (!acc[key]) acc[key] = { teacher: s.teacher, slots: [] }
    acc[key].slots.push(s)
    return acc
  }, {})

  const statusColor = (status: string) => ({
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }[status] ?? 'bg-gray-100 text-gray-600')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Office Hours</h1>
        <p className="text-sm text-gray-500 mt-0.5">Book appointments with your lecturers</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
          <button className="ml-auto text-green-500 hover:text-green-700" onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-red-700 text-sm">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button className="ml-auto text-red-400 hover:text-red-600" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
      ) : Object.keys(byTeacher).length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No office hours available.</p>
          <p className="text-sm text-gray-400 mt-1">Your lecturers haven't posted any slots yet.</p>
        </div>
      ) : (
        Object.values(byTeacher).map(({ teacher, slots: tSlots }) => (
          <div key={teacher?.id ?? 'unknown'} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <p className="font-semibold text-gray-900">
                {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown Lecturer'}
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {tSlots.map(slot => {
                const myBooking = slot.myBooking[0]
                const isBooking = bookingSlot === slot.id

                return (
                  <div key={slot.id} className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap text-sm text-gray-700">
                          <span className="font-semibold text-gray-900 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs">
                            {slot.dayName}s
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            {fmt12(slot.startTime)} – {fmt12(slot.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                          {slot.isOnline ? (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Video className="w-3.5 h-3.5" /> Online
                            </span>
                          ) : slot.location ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {slot.location}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {myBooking ? (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(myBooking.status)}`}>
                          {myBooking.status.charAt(0) + myBooking.status.slice(1).toLowerCase()}
                          {' — '}{new Date(myBooking.bookingDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      ) : (
                        <button
                          onClick={() => setBookingSlot(isBooking ? null : slot.id)}
                          className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                        >
                          {isBooking ? 'Cancel' : 'Book'}
                        </button>
                      )}
                    </div>

                    {isBooking && (
                      <div className="mt-4 border border-indigo-100 bg-indigo-50 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-medium text-indigo-700 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Booking for next {slot.dayName}: {new Date(nextDate(slot.dayOfWeek)).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        <textarea
                          rows={2}
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          placeholder="Add a note (optional) — what do you want to discuss?"
                          className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                        />
                        <button
                          onClick={() => book(slot)}
                          disabled={submitting}
                          className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                          Confirm Booking
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
