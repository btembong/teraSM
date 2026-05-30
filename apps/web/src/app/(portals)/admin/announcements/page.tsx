'use client'

import { useEffect, useState, useCallback } from 'react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  Megaphone, Plus, Pin, Trash2, Eye, EyeOff, Send,
  Newspaper, GraduationCap, Mail, Megaphone as BannerIcon,
  History, Video, Image as ImageIcon, Calendar, Clock,
  Users, CheckCircle2, X, Pencil, CalendarDays, MapPin,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────
interface Announcement {
  id: string
  type: 'ANNOUNCEMENT' | 'NEWS' | 'DEANS_MESSAGE'
  title: string
  body: string
  imageUrl: string | null
  videoUrl: string | null
  audience: string
  isPinned: boolean
  isPublished: boolean
  publishedAt: string | null
  scheduledAt: string | null
  expiresAt: string | null
  yearLevel: number | null
  createdAt: string
}

interface Newsletter {
  id: string
  subject: string
  previewText: string | null
  body: string
  audience: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENT'
  scheduledAt: string | null
  sentAt: string | null
  recipientCount: number
  createdAt: string
  author: { firstName: string; lastName: string } | null
}

interface CampusEvent {
  id: string
  title: string
  description: string | null
  location: string | null
  startDate: string
  endDate: string
  isPublished: boolean
  maxRsvp: number | null
  coverUrl: string | null
  organizedBy: string
  createdAt: string
  _count?: { rsvps: number }
}

interface Campaign {
  id: string
  type: 'BANNER' | 'POPUP'
  title: string
  body: string | null
  imageUrl: string | null
  ctaText: string | null
  ctaUrl: string | null
  audience: string
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  viewCount: number
  dismissCount: number
  createdAt: string
}

type Tab = 'announcements' | 'news' | 'deans' | 'events' | 'newsletters' | 'campaigns' | 'history'

// ─── Helpers ───────────────────────────────────────────────────────────────
const AUDIENCE_OPTS = ['ALL', 'STUDENTS', 'STAFF', 'TEACHERS', 'PARENTS', 'DEPARTMENT']

const audienceBadge: Record<string, string> = {
  ALL:        'bg-blue-600 text-white',
  STUDENTS:   'bg-indigo-50 text-indigo-700',
  STAFF:      'bg-slate-100 text-slate-700',
  TEACHERS:   'bg-violet-50 text-violet-700',
  PARENTS:    'bg-pink-50 text-pink-700',
  DEPARTMENT: 'bg-amber-50 text-amber-700',
}

const statusBadge: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-500',
  SCHEDULED: 'bg-amber-50 text-amber-700',
  SENT:      'bg-green-50 text-green-700',
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Edit Announcement Modal ─────────────────────────────────────────────────
function EditAnnouncementModal({
  announcement,
  onSave,
  onClose,
}: {
  announcement: Announcement
  onSave: (updated: Announcement) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title:       announcement.title,
    body:        announcement.body,
    imageUrl:    announcement.imageUrl    ?? '',
    videoUrl:    announcement.videoUrl    ?? '',
    audience:    announcement.audience,
    yearLevel:   announcement.yearLevel ? String(announcement.yearLevel) : '',
    isPinned:    announcement.isPinned,
    isPublished: announcement.isPublished,
    scheduledAt: announcement.scheduledAt ? announcement.scheduledAt.slice(0, 16) : '',
    expiresAt:   announcement.expiresAt   ? announcement.expiresAt.slice(0, 16)   : '',
  })
  const [saving, setSaving] = useState(false)

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/announcements/${announcement.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:       form.title,
        body:        form.body,
        imageUrl:    form.imageUrl    || null,
        videoUrl:    form.videoUrl    || null,
        audience:    form.audience,
        yearLevel:   form.yearLevel ? Number(form.yearLevel) : null,
        isPinned:    form.isPinned,
        isPublished: form.isPublished,
        scheduledAt: form.scheduledAt || null,
        expiresAt:   form.expiresAt   || null,
      }),
    })
    if (res.ok) onSave(await res.json())
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Edit Announcement</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={form.title} onChange={f('title')} required
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
            <textarea value={form.body} onChange={f('body')} required rows={5} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          {announcement.type === 'NEWS' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Cover Image URL</label>
              <input value={form.imageUrl} onChange={f('imageUrl')} type="url" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
            </div>
          )}
          {announcement.type === 'DEANS_MESSAGE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Video Embed URL</label>
              <input value={form.videoUrl} onChange={f('videoUrl')} type="url" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://youtube.com/embed/..." />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Audience</label>
              <select value={form.audience} onChange={f('audience')} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {AUDIENCE_OPTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
              <input value={form.yearLevel} onChange={f('yearLevel')} type="number" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="blank = all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Schedule Publish At</label>
              <input value={form.scheduledAt} onChange={f('scheduledAt')} type="datetime-local" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Expires At</label>
              <input value={form.expiresAt} onChange={f('expiresAt')} type="datetime-local" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.isPinned} onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))} className="rounded" /> Pin to top
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))} className="rounded" /> Published
            </label>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Empty state ────────────────────────────────────────────────────────────
function Empty({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-gray-300" />
      </div>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  )
}

// ─── Announcement Form ──────────────────────────────────────────────────────
function AnnouncementForm({
  type,
  onSave,
  onCancel,
}: {
  type: 'ANNOUNCEMENT' | 'NEWS' | 'DEANS_MESSAGE'
  onSave: (a: Announcement) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    title: '', body: '', imageUrl: '', videoUrl: '',
    audience: 'ALL', yearLevel: '', isPinned: false,
    isPublished: false, scheduledAt: '', expiresAt: '',
  })
  const [saving, setSaving] = useState(false)

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        title: form.title,
        body: form.body,
        imageUrl: form.imageUrl || null,
        videoUrl: form.videoUrl || null,
        audience: form.audience,
        yearLevel: form.yearLevel ? Number(form.yearLevel) : null,
        isPinned: form.isPinned,
        isPublished: form.isPublished,
        scheduledAt: form.scheduledAt || null,
        expiresAt: form.expiresAt || null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      onSave(data)
    }
    setSaving(false)
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-900">
          {type === 'ANNOUNCEMENT' && 'New Announcement'}
          {type === 'NEWS' && 'New News Post'}
          {type === 'DEANS_MESSAGE' && "New Dean's Message"}
        </h2>
        <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            value={form.title} onChange={f('title')} required
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter title..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {type === 'DEANS_MESSAGE' ? 'Message (rich text)' : 'Body'}
          </label>
          <textarea
            value={form.body} onChange={f('body')} required rows={5}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder={type === 'DEANS_MESSAGE' ? "Dean's message content..." : 'Write your message...'}
          />
        </div>

        {type === 'NEWS' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Cover Image URL
            </label>
            <input
              value={form.imageUrl} onChange={f('imageUrl')} type="url"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://..."
            />
          </div>
        )}

        {type === 'DEANS_MESSAGE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" /> Video Embed URL
            </label>
            <input
              value={form.videoUrl} onChange={f('videoUrl')} type="url"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://youtube.com/embed/..."
            />
            <p className="text-xs text-gray-400 mt-1">Use a YouTube or Vimeo embed URL</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Audience
            </label>
            <select
              value={form.audience} onChange={f('audience')}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {AUDIENCE_OPTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year Level (optional)</label>
            <input
              value={form.yearLevel} onChange={f('yearLevel')} type="number"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 200 (blank = all)"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Schedule Publish At
            </label>
            <input
              value={form.scheduledAt} onChange={f('scheduledAt')} type="datetime-local"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Expires At
            </label>
            <input
              value={form.expiresAt} onChange={f('expiresAt')} type="datetime-local"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-5 pt-1">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.isPinned} onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))} className="rounded" />
            Pin to top
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))} className="rounded" />
            Publish now
          </label>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
            {saving ? 'Saving...' : 'Create'}
          </button>
          <button type="button" onClick={onCancel}
            className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Newsletter Form ────────────────────────────────────────────────────────
function NewsletterForm({ onSave, onCancel }: { onSave: (n: Newsletter) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ subject: '', previewText: '', body: '', audience: 'ALL', scheduledAt: '' })
  const [saving, setSaving] = useState(false)
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/newsletters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: form.subject, previewText: form.previewText, body: form.body, audience: form.audience, scheduledAt: form.scheduledAt || null }),
    })
    if (res.ok) onSave(await res.json())
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-900">New Newsletter</h2>
        <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
      </div>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
          <input value={form.subject} onChange={f('subject')} required
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Newsletter subject..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preview Text</label>
          <input value={form.previewText} onChange={f('previewText')}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Short preview shown in email clients..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
          <RichTextEditor
            value={form.body}
            onChange={html => setForm(p => ({ ...p, body: html }))}
            placeholder="Write your newsletter content…"
            minHeight="200px"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <select value={form.audience} onChange={f('audience')}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {AUDIENCE_OPTS.slice(0, 5).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Schedule Send
            </label>
            <input value={form.scheduledAt} onChange={f('scheduledAt')} type="datetime-local"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button type="button" onClick={onCancel}
            className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Campaign Form ──────────────────────────────────────────────────────────
function CampaignForm({ onSave, onCancel }: { onSave: (c: Campaign) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ type: 'BANNER', title: '', body: '', imageUrl: '', ctaText: '', ctaUrl: '', audience: 'ALL', isActive: false, startsAt: '', endsAt: '' })
  const [saving, setSaving] = useState(false)
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, isActive: form.isActive, startsAt: form.startsAt || null, endsAt: form.endsAt || null }),
    })
    if (res.ok) onSave(await res.json())
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-900">New Campaign</h2>
        <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
      </div>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={f('type')}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="BANNER">Banner</option>
              <option value="POPUP">Popup</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <select value={form.audience} onChange={f('audience')}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {AUDIENCE_OPTS.slice(0, 5).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input value={form.title} onChange={f('title')} required
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Campaign headline..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body (optional)</label>
          <textarea value={form.body} onChange={f('body')} rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Short supporting text..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
            <input value={form.ctaText} onChange={f('ctaText')}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Learn More" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTA URL</label>
            <input value={form.ctaUrl} onChange={f('ctaUrl')} type="url"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://..." />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Starts At</label>
            <input value={form.startsAt} onChange={f('startsAt')} type="datetime-local"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ends At</label>
            <input value={form.endsAt} onChange={f('endsAt')} type="datetime-local"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
          Activate immediately
        </label>
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
            {saving ? 'Saving...' : 'Create Campaign'}
          </button>
          <button type="button" onClick={onCancel}
            className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function AdminAnnouncementsPage() {
  const [tab, setTab] = useState<Tab>('announcements')

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [newsletters,   setNewsletters]   = useState<Newsletter[]>([])
  const [campaigns,     setCampaigns]     = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const [events,          setEvents]          = useState<CampusEvent[]>([])
  const [showEventForm,   setShowEventForm]   = useState(false)
  const [eventForm,       setEventForm]       = useState({ title: '', description: '', location: '', startDate: '', endDate: '', maxRsvp: '', isPublished: false })
  const [savingEvent,     setSavingEvent]     = useState(false)

  const [showAnnForm,     setShowAnnForm]     = useState(false)
  const [annFormType,     setAnnFormType]     = useState<'ANNOUNCEMENT' | 'NEWS' | 'DEANS_MESSAGE'>('ANNOUNCEMENT')
  const [showNewsForm,    setShowNewsForm]    = useState(false)
  const [showCampForm,    setShowCampForm]    = useState(false)
  const [sendingId,       setSendingId]       = useState<string | null>(null)
  const [editingAnn,      setEditingAnn]      = useState<Announcement | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [annRes, newsRes, campRes, evRes] = await Promise.all([
      fetch('/api/announcements?admin=true'),
      fetch('/api/admin/newsletters'),
      fetch('/api/admin/campaigns'),
      fetch('/api/admin/events'),
    ])
    const [ann, news, camp, ev] = await Promise.all([annRes.json(), newsRes.json(), campRes.json(), evRes.json()])
    setAnnouncements(Array.isArray(ann)  ? ann  : [])
    setNewsletters  (Array.isArray(news) ? news : [])
    setCampaigns    (Array.isArray(camp) ? camp : [])
    setEvents       (Array.isArray(ev)   ? ev   : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const togglePublish = async (a: Announcement) => {
    const res = await fetch(`/api/announcements/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !a.isPublished }),
    })
    if (res.ok) setAnnouncements(prev => prev.map(x => x.id === a.id ? { ...x, isPublished: !a.isPublished } : x))
  }

  const deleteAnn = async (id: string) => {
    if (!confirm('Delete this item?')) return
    await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  const sendNewsletter = async (id: string) => {
    if (!confirm('Send this newsletter to all recipients now?')) return
    setSendingId(id)
    const res = await fetch(`/api/admin/newsletters/${id}`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setNewsletters(prev => prev.map(n => n.id === id ? data.newsletter : n))
    }
    setSendingId(null)
  }

  const deleteNewsletter = async (id: string) => {
    if (!confirm('Delete this newsletter?')) return
    await fetch(`/api/admin/newsletters/${id}`, { method: 'DELETE' })
    setNewsletters(prev => prev.filter(n => n.id !== id))
  }

  const toggleCampaign = async (c: Campaign) => {
    const res = await fetch(`/api/admin/campaigns/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !c.isActive }),
    })
    if (res.ok) setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, isActive: !c.isActive } : x))
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign?')) return
    await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' })
    setCampaigns(prev => prev.filter(c => c.id !== id))
  }

  // Filter announcements by type for each tab
  const byType = (type: 'ANNOUNCEMENT' | 'NEWS' | 'DEANS_MESSAGE') =>
    announcements.filter(a => a.type === type)

  const TABS = [
    { id: 'announcements', label: 'Announcements',   icon: Megaphone,      count: byType('ANNOUNCEMENT').length },
    { id: 'news',          label: 'News',            icon: Newspaper,      count: byType('NEWS').length },
    { id: 'deans',         label: "Dean's Messages", icon: GraduationCap,  count: byType('DEANS_MESSAGE').length },
    { id: 'events',        label: 'Events',          icon: CalendarDays,   count: events.length },
    { id: 'newsletters',   label: 'Newsletters',     icon: Mail,           count: newsletters.length },
    { id: 'campaigns',     label: 'Campaigns',       icon: BannerIcon,     count: campaigns.length },
    { id: 'history',       label: 'History',         icon: History,        count: null },
  ] as const

  // ── Announcement list row ─────────────────────────────────────────────────
  const AnnRow = ({ a }: { a: Announcement }) => (
    <div className="px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {a.isPinned && <Pin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />}
            {a.videoUrl && <Video className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />}
            {a.imageUrl && <ImageIcon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
            <p className="font-medium text-gray-900 truncate">{a.title}</p>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">{a.body}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${audienceBadge[a.audience] ?? 'bg-gray-100 text-gray-600'}`}>
              {a.audience}
            </span>
            {a.yearLevel && (
              <span className="text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-medium">
                Year {a.yearLevel}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${a.isPublished ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
              {a.isPublished ? 'Published' : a.scheduledAt ? 'Scheduled' : 'Draft'}
            </span>
            {a.scheduledAt && !a.isPublished && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {fmt(a.scheduledAt)}
              </span>
            )}
            <span className="text-xs text-gray-400">{fmt(a.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setEditingAnn(a)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
            <Pencil className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => togglePublish(a)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title={a.isPublished ? 'Unpublish' : 'Publish'}>
            {a.isPublished ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-indigo-500" />}
          </button>
          <button onClick={() => deleteAnn(a.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Edit modal */}
      {editingAnn && (
        <EditAnnouncementModal
          announcement={editingAnn}
          onSave={updated => {
            setAnnouncements(prev => prev.map(a => a.id === updated.id ? updated : a))
            setEditingAnn(null)
          }}
          onClose={() => setEditingAnn(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-500 text-sm mt-0.5">Announcements, news, newsletters & campaigns</p>
        </div>
        <div className="flex gap-2">
          {tab === 'announcements' && (
            <button onClick={() => { setAnnFormType('ANNOUNCEMENT'); setShowAnnForm(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> New Announcement
            </button>
          )}
          {tab === 'news' && (
            <button onClick={() => { setAnnFormType('NEWS'); setShowAnnForm(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> New Post
            </button>
          )}
          {tab === 'deans' && (
            <button onClick={() => { setAnnFormType('DEANS_MESSAGE'); setShowAnnForm(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> New Message
            </button>
          )}
          {tab === 'events' && (
            <button onClick={() => setShowEventForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> New Event
            </button>
          )}
          {tab === 'newsletters' && (
            <button onClick={() => setShowNewsForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> New Newsletter
            </button>
          )}
          {tab === 'campaigns' && (
            <button onClick={() => setShowCampForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> New Campaign
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 rounded-2xl p-1.5 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id as Tab); setShowAnnForm(false); setShowNewsForm(false); setShowCampForm(false) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tab === t.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Forms */}
      {showAnnForm && (
        <AnnouncementForm
          type={annFormType}
          onSave={a => { setAnnouncements(prev => [a, ...prev]); setShowAnnForm(false) }}
          onCancel={() => setShowAnnForm(false)}
        />
      )}
      {showNewsForm && (
        <NewsletterForm
          onSave={n => { setNewsletters(prev => [n, ...prev]); setShowNewsForm(false) }}
          onCancel={() => setShowNewsForm(false)}
        />
      )}
      {showCampForm && (
        <CampaignForm
          onSave={c => { setCampaigns(prev => [c, ...prev]); setShowCampForm(false) }}
          onCancel={() => setShowCampForm(false)}
        />
      )}

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm">Loading...</div>
      ) : (
        <>
          {/* Announcements Tab */}
          {tab === 'announcements' && (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              {byType('ANNOUNCEMENT').length === 0 ? (
                <Empty icon={Megaphone} label="No announcements yet. Create one above." />
              ) : byType('ANNOUNCEMENT').map(a => <AnnRow key={a.id} a={a} />)}
            </div>
          )}

          {/* News Tab */}
          {tab === 'news' && (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              {byType('NEWS').length === 0 ? (
                <Empty icon={Newspaper} label="No news posts yet." />
              ) : byType('NEWS').map(a => <AnnRow key={a.id} a={a} />)}
            </div>
          )}

          {/* Dean's Messages Tab */}
          {tab === 'deans' && (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              {byType('DEANS_MESSAGE').length === 0 ? (
                <Empty icon={GraduationCap} label="No Dean's messages yet." />
              ) : byType('DEANS_MESSAGE').map(a => (
                <div key={a.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <GraduationCap className="w-4 h-4 text-violet-500 flex-shrink-0" />
                        <p className="font-medium text-gray-900 truncate">{a.title}</p>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">{a.body}</p>
                      {a.videoUrl && (
                        <p className="text-xs text-violet-600 mt-1 flex items-center gap-1">
                          <Video className="w-3 h-3" /> Video attached
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${a.isPublished ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                          {a.isPublished ? 'Published' : 'Draft'}
                        </span>
                        <span className="text-xs text-gray-400">{fmt(a.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => togglePublish(a)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        {a.isPublished ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-indigo-500" />}
                      </button>
                      <button onClick={() => deleteAnn(a.id)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Newsletters Tab */}
          {tab === 'newsletters' && (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              {newsletters.length === 0 ? (
                <Empty icon={Mail} label="No newsletters yet. Create one above." />
              ) : newsletters.map(n => (
                <div key={n.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">{n.subject}</p>
                      </div>
                      {n.previewText && <p className="text-xs text-gray-400 mb-1 italic">{n.previewText}</p>}
                      <p className="text-sm text-gray-500 line-clamp-2" dangerouslySetInnerHTML={{ __html: n.body.replace(/<[^>]+>/g, ' ') }} />
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${audienceBadge[n.audience] ?? 'bg-gray-100 text-gray-600'}`}>
                          {n.audience}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadge[n.status]}`}>
                          {n.status}
                        </span>
                        {n.status === 'SENT' && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {n.recipientCount.toLocaleString()} recipients
                          </span>
                        )}
                        {n.scheduledAt && n.status === 'SCHEDULED' && (
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {fmt(n.scheduledAt)}
                          </span>
                        )}
                        {n.sentAt && <span className="text-xs text-gray-400">Sent {fmt(n.sentAt)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {n.status !== 'SENT' && (
                        <button
                          onClick={() => sendNewsletter(n.id)}
                          disabled={sendingId === n.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {sendingId === n.id ? 'Sending...' : 'Send Now'}
                        </button>
                      )}
                      <button onClick={() => deleteNewsletter(n.id)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Events Tab */}
          {tab === 'events' && (
            <div className="space-y-4">
              {showEventForm && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-gray-900">New Campus Event</h2>
                    <button onClick={() => setShowEventForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
                  </div>
                  <form onSubmit={async e => {
                    e.preventDefault()
                    setSavingEvent(true)
                    const res = await fetch('/api/admin/events', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: eventForm.title,
                        description: eventForm.description || null,
                        location: eventForm.location || null,
                        startDate: eventForm.startDate,
                        endDate: eventForm.endDate,
                        maxRsvp: eventForm.maxRsvp ? Number(eventForm.maxRsvp) : null,
                        isPublished: eventForm.isPublished,
                      }),
                    })
                    if (res.ok) {
                      const ev = await res.json()
                      setEvents(prev => [ev, ...prev])
                      setEventForm({ title: '', description: '', location: '', startDate: '', endDate: '', maxRsvp: '', isPublished: false })
                      setShowEventForm(false)
                    }
                    setSavingEvent(false)
                  }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} required
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Event name..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="What's happening..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</label>
                        <input value={eventForm.location} onChange={e => setEventForm(p => ({ ...p, location: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Room, building, or online..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max RSVPs</label>
                        <input value={eventForm.maxRsvp} onChange={e => setEventForm(p => ({ ...p, maxRsvp: e.target.value }))} type="number"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="blank = unlimited" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                        <input value={eventForm.startDate} onChange={e => setEventForm(p => ({ ...p, startDate: e.target.value }))} type="datetime-local" required
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                        <input value={eventForm.endDate} onChange={e => setEventForm(p => ({ ...p, endDate: e.target.value }))} type="datetime-local" required
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={eventForm.isPublished} onChange={e => setEventForm(p => ({ ...p, isPublished: e.target.checked }))} className="rounded" />
                      Publish immediately
                    </label>
                    <div className="flex gap-3">
                      <button type="submit" disabled={savingEvent} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                        {savingEvent ? 'Creating…' : 'Create Event'}
                      </button>
                      <button type="button" onClick={() => setShowEventForm(false)} className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                {events.length === 0 ? (
                  <Empty icon={CalendarDays} label="No events yet. Create one above." />
                ) : events.map(ev => (
                  <div key={ev.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">{ev.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${ev.isPublished ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                            {ev.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        {ev.description && <p className="text-sm text-gray-500 line-clamp-1 mb-1">{ev.description}</p>}
                        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                          {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>}
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {fmt(ev.startDate)} → {fmt(ev.endDate)}
                          </span>
                          {ev.maxRsvp && <span>Max {ev.maxRsvp} RSVPs</span>}
                          {ev._count && <span>{ev._count.rsvps} going</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={async () => {
                            const res = await fetch(`/api/admin/events/${ev.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isPublished: !ev.isPublished }),
                            })
                            if (res.ok) setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, isPublished: !e.isPublished } : e))
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {ev.isPublished ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-indigo-500" />}
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm('Delete this event?')) return
                            await fetch(`/api/admin/events/${ev.id}`, { method: 'DELETE' })
                            setEvents(prev => prev.filter(e => e.id !== ev.id))
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campaigns Tab */}
          {tab === 'campaigns' && (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              {campaigns.length === 0 ? (
                <Empty icon={BannerIcon} label="No campaigns yet. Create a banner or popup above." />
              ) : campaigns.map(c => (
                <div key={c.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.type === 'BANNER' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {c.type}
                        </span>
                        <p className="font-medium text-gray-900 truncate">{c.title}</p>
                      </div>
                      {c.body && <p className="text-sm text-gray-500 line-clamp-1">{c.body}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-gray-400">
                        <span className={audienceBadge[c.audience] ? `px-2 py-0.5 rounded font-medium ${audienceBadge[c.audience]}` : 'px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium'}>
                          {c.audience}
                        </span>
                        <span>Views: {c.viewCount.toLocaleString()}</span>
                        <span>Dismissed: {c.dismissCount.toLocaleString()}</span>
                        {c.startsAt && <span>{fmt(c.startsAt)} → {fmt(c.endsAt)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleCampaign(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          c.isActive
                            ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button onClick={() => deleteCampaign(c.id)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History Tab */}
          {tab === 'history' && (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              {(() => {
                const published = announcements.filter(a => a.isPublished && a.publishedAt)
                const sent = newsletters.filter(n => n.status === 'SENT' && n.sentAt)

                const history = [
                  ...published.map(a => ({ id: a.id, type: 'announcement' as const, title: a.title, audience: a.audience, date: a.publishedAt!, count: null })),
                  ...sent.map(n => ({ id: n.id, type: 'newsletter' as const, title: n.subject, audience: n.audience, date: n.sentAt!, count: n.recipientCount })),
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

                if (history.length === 0) return <Empty icon={History} label="No broadcast history yet." />

                return history.map(h => (
                  <div key={h.id} className="px-6 py-4 flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${h.type === 'newsletter' ? 'bg-indigo-50' : 'bg-blue-50'}`}>
                      {h.type === 'newsletter' ? <Mail className="w-4 h-4 text-indigo-500" /> : <Megaphone className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{h.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span className="capitalize">{h.type}</span>
                        <span>·</span>
                        <span>{h.audience}</span>
                        {h.count !== null && <><span>·</span><span>{h.count.toLocaleString()} recipients</span></>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{fmt(h.date)}</span>
                  </div>
                ))
              })()}
            </div>
          )}
        </>
      )}
    </div>
  )
}
