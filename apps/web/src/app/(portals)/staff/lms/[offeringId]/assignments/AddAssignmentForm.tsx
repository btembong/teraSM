'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AddAssignmentForm({ offeringId }: { offeringId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', maxScore: 100, dueDate: '', allowLate: false,
  })

  async function handleSubmit() {
    if (!form.title || !form.dueDate) return
    setSaving(true)
    await fetch('/api/lms/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseOfferingId: offeringId, ...form }),
    })
    setSaving(false)
    setForm({ title: '', description: '', maxScore: 100, dueDate: '', allowLate: false })
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors font-medium"
      >
        <Plus className="w-4 h-4" /> Add Assignment
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Add Assignment</h3>
        <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          placeholder="Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
        />
        <textarea
          placeholder="Description (optional)"
          rows={2}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2 resize-none"
        />
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
          <input
            type="datetime-local"
            value={form.dueDate}
            onChange={e => setForm({ ...form, dueDate: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Max Score</label>
          <input
            type="number"
            min={1}
            value={form.maxScore}
            onChange={e => setForm({ ...form, maxScore: Number(e.target.value) })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.allowLate}
            onChange={e => setForm({ ...form, allowLate: e.target.checked })}
            className="rounded"
          />
          Allow late submissions
        </label>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={saving || !form.title || !form.dueDate}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {saving ? 'Saving…' : 'Add Assignment'}
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
