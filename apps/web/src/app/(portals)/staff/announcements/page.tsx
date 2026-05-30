'use client'

import { useEffect, useState } from 'react'
import { Megaphone, Newspaper, GraduationCap, Plus, Eye, EyeOff, Trash2, Pin } from 'lucide-react'

interface Announcement {
  id: string
  type: 'ANNOUNCEMENT' | 'NEWS' | 'DEANS_MESSAGE'
  title: string
  body: string
  isPublished: boolean
  isPinned: boolean
  audience: string
  createdAt: string
  publishedAt: string | null
}

const typeIcon: Record<string, React.ElementType> = {
  ANNOUNCEMENT:  Megaphone,
  NEWS:          Newspaper,
  DEANS_MESSAGE: GraduationCap,
}

const typeBadge: Record<string, string> = {
  ANNOUNCEMENT:  'bg-indigo-50 text-indigo-700',
  NEWS:          'bg-blue-50 text-blue-700',
  DEANS_MESSAGE: 'bg-violet-50 text-violet-700',
}

export default function StaffAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [creating, setCreating]           = useState(false)
  const [title, setTitle]                 = useState('')
  const [body, setBody]                   = useState('')
  const [saving, setSaving]               = useState(false)

  useEffect(() => {
    fetch('/api/announcements?audience=TEACHERS')
      .then(r => r.json())
      .then(data => setAnnouncements(Array.isArray(data) ? data : []))
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, isPublished: true, type: 'ANNOUNCEMENT', audience: 'STUDENTS' }),
    })
    if (res.ok) {
      const ann = await res.json()
      setAnnouncements(prev => [ann, ...prev])
      setTitle(''); setBody(''); setCreating(false)
    }
    setSaving(false)
  }

  async function togglePublish(ann: Announcement) {
    const res = await fetch(`/api/announcements/${ann.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !ann.isPublished }),
    })
    if (res.ok) setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, isPublished: !a.isPublished } : a))
  }

  async function remove(id: string) {
    if (!confirm('Delete this announcement?')) return
    await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 text-sm mt-0.5">School news and updates for your students</p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {creating && (
        <form onSubmit={create} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Post to Students</h2>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Title</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Class cancelled on Friday"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Message</label>
            <textarea
              value={body} onChange={e => setBody(e.target.value)} required rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Write your announcement…"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? 'Posting…' : 'Post Announcement'}
            </button>
            <button type="button" onClick={() => setCreating(false)}
              className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No announcements yet.</p>
          </div>
        ) : (
          announcements.map(ann => {
            const Icon = typeIcon[ann.type] ?? Megaphone
            return (
              <div key={ann.id} className={`bg-white rounded-2xl border p-5 ${ann.isPinned ? 'border-indigo-200' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeBadge[ann.type] ?? 'bg-gray-50'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        {ann.isPinned && <Pin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
                        <p className="font-semibold text-gray-900 truncate">{ann.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${ann.isPublished ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {ann.isPublished ? 'Published' : 'Draft'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeBadge[ann.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {ann.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{ann.body}</p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {new Date(ann.publishedAt ?? ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}{ann.audience}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => togglePublish(ann)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={ann.isPublished ? 'Unpublish' : 'Publish'}>
                      {ann.isPublished ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-indigo-500" />}
                    </button>
                    <button onClick={() => remove(ann.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
