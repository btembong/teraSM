'use client'

import { useState } from 'react'
import { Users, Calendar, Building, Wrench, Plus } from 'lucide-react'

const priorityColor: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-blue-100 text-blue-800',
  URGENT: 'bg-gray-900 text-white',
}

const statusColor: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-blue-600 text-white',
  CLOSED: 'bg-gray-100 text-gray-600',
}

type Tab = 'clubs' | 'events' | 'hostel' | 'maintenance'

interface Props {
  clubs: any[]
  events: any[]
  hostelRooms: any[]
  maintenanceRequests: any[]
  stats: {
    totalClubs: number
    totalMembers: number
    upcomingEvents: number
    openMaintenance: number
    hostelOccupied: number
    hostelCapacity: number
  }
}

export default function AdminStudentLifeClient({ clubs, events, hostelRooms, maintenanceRequests, stats }: Props) {
  const [tab, setTab] = useState<Tab>('clubs')
  const [showClubForm, setShowClubForm] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [clubForm, setClubForm] = useState({ name: '', description: '', category: 'General', maxMembers: '' })
  const [eventForm, setEventForm] = useState({ title: '', description: '', location: '', startDate: '', endDate: '', maxRsvp: '' })
  const [localClubs, setLocalClubs] = useState(clubs)
  const [localEvents, setLocalEvents] = useState(events)
  const [localMaintenance, setLocalMaintenance] = useState(maintenanceRequests)
  const [submitting, setSubmitting] = useState(false)

  const createClub = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/admin/student-life/clubs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...clubForm, maxMembers: clubForm.maxMembers ? parseInt(clubForm.maxMembers) : null }),
    })
    const data = await res.json()
    setLocalClubs((prev) => [{ ...data, _count: { memberships: 0 } }, ...prev])
    setClubForm({ name: '', description: '', category: 'General', maxMembers: '' })
    setShowClubForm(false)
    setSubmitting(false)
  }

  const createEvent = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/admin/student-life/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...eventForm, maxRsvp: eventForm.maxRsvp ? parseInt(eventForm.maxRsvp) : null }),
    })
    const data = await res.json()
    setLocalEvents((prev) => [{ ...data, _count: { rsvps: 0 } }, ...prev])
    setEventForm({ title: '', description: '', location: '', startDate: '', endDate: '', maxRsvp: '' })
    setShowEventForm(false)
    setSubmitting(false)
  }

  const updateMaintenance = async (id: string, status: string) => {
    await fetch(`/api/admin/student-life/maintenance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLocalMaintenance((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
  }

  const tabs: { key: Tab; label: string; icon: React.ComponentType<any> }[] = [
    { key: 'clubs', label: 'Clubs', icon: Users },
    { key: 'events', label: 'Events', icon: Calendar },
    { key: 'hostel', label: 'Hostel', icon: Building },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Life</h1>
        <p className="text-gray-500">Manage clubs, events, hostel, and maintenance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Clubs', value: stats.totalClubs, sub: `${stats.totalMembers} members` },
          { label: 'Upcoming Events', value: stats.upcomingEvents, sub: 'scheduled' },
          { label: 'Hostel Occupancy', value: `${stats.hostelOccupied}/${stats.hostelCapacity}`, sub: 'beds occupied' },
          { label: 'Open Maintenance', value: stats.openMaintenance, sub: 'requests pending' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'clubs' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowClubForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> New Club
            </button>
          </div>

          {showClubForm && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Create Club</h3>
              <form onSubmit={createClub} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input value={clubForm.name} onChange={(e) => setClubForm((f) => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={clubForm.category} onChange={(e) => setClubForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['General', 'Sports', 'Arts', 'Academic', 'Technology'].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={clubForm.description} onChange={(e) => setClubForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Members (optional)</label>
                  <input type="number" value={clubForm.maxMembers} onChange={(e) => setClubForm((f) => ({ ...f, maxMembers: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium">{submitting ? 'Creating...' : 'Create'}</button>
                  <button type="button" onClick={() => setShowClubForm(false)} className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200">
            {localClubs.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No clubs yet</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {localClubs.map((club) => (
                  <div key={club.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{club.name}</p>
                      <p className="text-xs text-gray-400">{club.category} · {club._count.memberships} members{club.maxMembers ? ` / ${club.maxMembers} max` : ''}</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{club.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'events' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowEventForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> New Event
            </button>
          </div>

          {showEventForm && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Create Event</h3>
              <form onSubmit={createEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} required className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={eventForm.description} onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                    <input type="datetime-local" value={eventForm.startDate} onChange={(e) => setEventForm((f) => ({ ...f, startDate: e.target.value }))} required className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                    <input type="datetime-local" value={eventForm.endDate} onChange={(e) => setEventForm((f) => ({ ...f, endDate: e.target.value }))} required className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input value={eventForm.location} onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max RSVPs (optional)</label>
                    <input type="number" value={eventForm.maxRsvp} onChange={(e) => setEventForm((f) => ({ ...f, maxRsvp: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium">{submitting ? 'Creating...' : 'Create'}</button>
                  <button type="button" onClick={() => setShowEventForm(false)} className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200">
            {localEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No events yet</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {localEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(event.startDate).toLocaleDateString()} · {event._count.rsvps} going
                        {event.location ? ` · ${event.location}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${new Date(event.endDate) >= new Date() ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {new Date(event.endDate) >= new Date() ? 'Upcoming' : 'Past'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'hostel' && (
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Hostel Rooms</h2>
          </div>
          {hostelRooms.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No hostel rooms configured</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {hostelRooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{room.building} · Room {room.roomNumber}</p>
                    <p className="text-xs text-gray-400">Floor {room.floor} · ${room.monthlyFee}/month</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">{room.occupied}/{room.capacity}</span>
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${room.capacity > 0 ? (room.occupied / room.capacity) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'maintenance' && (
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Maintenance Requests</h2>
          </div>
          {localMaintenance.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No maintenance requests</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {localMaintenance.map((req) => (
                <div key={req.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{req.title}</p>
                    <p className="text-xs text-gray-400">
                      {req.reportedBy?.firstName} {req.reportedBy?.lastName} · {req.category}
                      {req.location ? ` · ${req.location}` : ''} · {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${priorityColor[req.priority] ?? ''}`}>{req.priority}</span>
                    <select
                      value={req.status}
                      onChange={(e) => updateMaintenance(req.id, e.target.value)}
                      className={`text-xs px-2 py-0.5 rounded font-medium border-0 focus:ring-1 focus:ring-blue-500 cursor-pointer ${statusColor[req.status] ?? ''}`}
                    >
                      {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
