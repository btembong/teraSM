'use client'

import { useEffect, useState } from 'react'
import { Calendar, MapPin, Users, CheckCircle } from 'lucide-react'

interface CampusEvent {
  id: string
  title: string
  description: string | null
  location: string | null
  startDate: string
  endDate: string
  maxRsvp: number | null
  _count: { rsvps: number }
  myRsvp?: string | null
}

export default function StudentEventsPage() {
  const [events, setEvents] = useState<CampusEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [rsvping, setRsvping] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/student-life/events')
      .then((r) => r.json())
      .then((data) => { setEvents(data); setLoading(false) })
  }, [])

  const rsvp = async (eventId: string, status: 'GOING' | 'NOT_GOING') => {
    setRsvping(eventId)
    await fetch('/api/student-life/events/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, status }),
    })
    setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, myRsvp: status } : e))
    setRsvping(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campus Events</h1>
        <p className="text-gray-500">Upcoming events and activities</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
          <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const start = new Date(event.startDate)
            const isToday = start.toDateString() === new Date().toDateString()
            return (
              <div key={event.id} className={`bg-white rounded-2xl border p-5 ${isToday ? 'border-blue-200' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700'}`}>
                      <p className="text-xs font-medium">{start.toLocaleString('default', { month: 'short' })}</p>
                      <p className="text-xl font-bold leading-none">{start.getDate()}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      {event.description && <p className="text-sm text-gray-500 mt-0.5">{event.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {event._count.rsvps} going{event.maxRsvp ? ` / ${event.maxRsvp} max` : ''}
                        </span>
                        <span>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {event.myRsvp === 'GOING' ? (
                      <span className="flex items-center gap-1 text-xs text-blue-600 font-medium px-3 py-1.5 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Going
                      </span>
                    ) : (
                      <button
                        onClick={() => rsvp(event.id, 'GOING')}
                        disabled={rsvping === event.id}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        {rsvping === event.id ? '...' : 'RSVP'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
