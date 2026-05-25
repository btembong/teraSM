'use client'

import { useEffect, useState } from 'react'
import { Heart, Calendar, Clock, Shield, CheckCircle, AlertCircle, Send } from 'lucide-react'

type Appointment = {
  id: string
  preferredDate: string
  slot: string
  reason: string
  status: string
  counselorNotes: string | null
  isAnonymous: boolean
  createdAt: string
}

const TIME_SLOTS = [
  '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
  '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00',
]

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-100',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-100',
  COMPLETED: 'bg-green-50 text-green-700 border-green-100',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
}

export default function CounselingPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function load() {
    const res = await fetch('/api/student/counseling')
    const data = await res.json()
    setAppointments(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!date || !slot || !reason.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/student/counseling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferredDate: date, slot, reason: reason.trim(), isAnonymous }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to book appointment.')
      setSubmitting(false)
      return
    }
    setSuccess(true)
    setShowForm(false)
    setDate('')
    setSlot('')
    setReason('')
    setIsAnonymous(false)
    load()
    setSubmitting(false)
  }

  // Minimum date = tomorrow
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().slice(0, 10)

  if (loading) {
    return <div className="flex items-center justify-center min-h-[300px]"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Counseling &amp; Wellbeing</h1>
        <p className="text-sm text-gray-500 mt-1">Book a confidential session with a school counselor</p>
      </div>

      {/* Privacy notice */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Your privacy is protected</p>
          <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
            All sessions are strictly confidential. You can also book anonymously — your name will not be shared with anyone outside the counseling office.
          </p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Appointment request submitted. The counseling team will confirm your slot soon.
        </div>
      )}

      {/* Book button */}
      {!showForm ? (
        <button
          onClick={() => { setShowForm(true); setSuccess(false) }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Heart className="w-4 h-4" />
          Book an Appointment
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-sm">New Appointment Request</h2>

          {/* Anonymous toggle */}
          <button
            type="button"
            onClick={() => setIsAnonymous(a => !a)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
              isAnonymous
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-100 bg-gray-50 hover:border-gray-200'
            }`}
          >
            <Shield className={`w-5 h-5 flex-shrink-0 ${isAnonymous ? 'text-blue-600' : 'text-gray-400'}`} />
            <div>
              <p className={`text-sm font-semibold ${isAnonymous ? 'text-blue-900' : 'text-gray-700'}`}>
                Book anonymously
              </p>
              <p className={`text-xs ${isAnonymous ? 'text-blue-600' : 'text-gray-400'}`}>
                {isAnonymous ? 'Your name will not be shared' : 'Your name will be visible to the counselor'}
              </p>
            </div>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              isAnonymous ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            }`}>
              {isAnonymous && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </button>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Preferred date</span>
              </label>
              <input
                type="date"
                min={minDateStr}
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Preferred time slot</span>
              </label>
              <select
                value={slot}
                onChange={e => setSlot(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a time</option>
                {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Reason for visit <span className="text-gray-400">(confidential)</span>
            </label>
            <textarea
              rows={4}
              placeholder="Briefly describe what you would like to discuss. This is only seen by the counseling team."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
              <Send className="w-4 h-4" />
              {submitting ? 'Booking...' : 'Book appointment'}
            </button>
          </div>
        </form>
      )}

      {/* Appointment history */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900 text-sm">Your Appointments ({appointments.length})</h2>
        {appointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Heart className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No appointments yet. We are here whenever you need us.</p>
          </div>
        ) : (
          appointments.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">
                      {new Date(a.preferredDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    {a.isAnonymous && (
                      <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        <Shield className="w-3 h-3" /> Anonymous
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{a.slot}</p>
                </div>
                <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[a.status] ?? ''}`}>
                  {a.status}
                </span>
              </div>
              {a.counselorNotes && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-blue-600 mb-1">Counselor note</p>
                  <p className="text-sm text-blue-900">{a.counselorNotes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
