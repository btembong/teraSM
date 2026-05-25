'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CONTENT_TYPES = ['PDF', 'VIDEO', 'LINK', 'DOCUMENT', 'IMAGE', 'AUDIO']

export function AddContentForm({ offeringId }: { offeringId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'PDF', url: '', description: '' })

  async function handleSubmit() {
    if (!form.title || !form.url) return
    setSaving(true)
    await fetch('/api/lms/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseOfferingId: offeringId, ...form }),
    })
    setSaving(false)
    setForm({ title: '', type: 'PDF', url: '', description: '' })
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors font-medium"
      >
        <Plus className="w-4 h-4" /> Add Material
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Add Course Material</h3>
        <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          placeholder="Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={form.type}
          onChange={e => setForm({ ...form, type: e.target.value })}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <input
          placeholder="URL / Link"
          value={form.url}
          onChange={e => setForm({ ...form, url: e.target.value })}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
        />
        <input
          placeholder="Description (optional)"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={saving || !form.title || !form.url}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {saving ? 'Saving…' : 'Add Material'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
