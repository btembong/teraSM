'use client'

import { useEffect, useState } from 'react'
import { Megaphone, Plus, Pin, Trash2, Eye, EyeOff } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  body: string
  audience: string
  isPinned: boolean
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

const audienceColor: Record<string, string> = {
  ALL: 'bg-blue-600 text-white',
  STUDENTS: 'bg-blue-50 text-blue-700',
  STAFF: 'bg-blue-100 text-blue-800',
  TEACHERS: 'bg-blue-100 text-blue-700',
  PARENTS: 'bg-gray-100 text-gray-600',
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', audience: 'ALL', isPinned: false, isPublished: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/announcements?admin=true')
      .then((r) => r.json())
      .then((data) => { setAnnouncements(data); setLoading(false) })
  }, [])

  const create = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setAnnouncements((prev) => [data, ...prev])
    setForm({ title: '', body: '', audience: 'ALL', isPinned: false, isPublished: false })
    setShowForm(false)
    setSaving(false)
  }

  const togglePublish = async (a: Announcement) => {
    const res = await fetch(`/api/announcements/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...a, isPublished: !a.isPublished }),
    })
    const data = await res.json()
    setAnnouncements((prev) => prev.map((x) => (x.id === a.id ? data : x)))
  }

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500">Broadcast messages to students, staff, and parents</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create Announcement</h2>
          <form onSubmit={create} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Announcement title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Write your announcement..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                <select
                  value={form.audience}
                  onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {['ALL', 'STUDENTS', 'STAFF', 'TEACHERS', 'PARENTS'].map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-4 pb-0.5">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))} className="rounded" />
                  Pin to top
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} className="rounded" />
                  Publish now
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                {saving ? 'Saving...' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Announcements ({announcements.length})</h2>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No announcements yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {announcements.map((a) => (
              <div key={a.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {a.isPinned && <Pin className="w-3.5 h-3.5 text-blue-500" />}
                      <p className="font-medium text-gray-900">{a.title}</p>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{a.body}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${audienceColor[a.audience] ?? 'bg-gray-100 text-gray-600'}`}>
                        {a.audience}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${a.isPublished ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {a.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => togglePublish(a)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title={a.isPublished ? 'Unpublish' : 'Publish'}
                    >
                      {a.isPublished ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-blue-500" />}
                    </button>
                    <button onClick={() => deleteAnnouncement(a.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
