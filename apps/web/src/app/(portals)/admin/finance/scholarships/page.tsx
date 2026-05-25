'use client'

import { useEffect, useState } from 'react'
import { Award, Plus } from 'lucide-react'

interface Scholarship {
  id: string; name: string; type: string
  amount?: number; percentage?: number; isActive: boolean
  _count: { awards: number }
}

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'SCHOLARSHIP', description: '', amount: '', percentage: '',
  })

  async function load() {
    setLoading(true)
    const [schRes, settingsRes] = await Promise.all([
      fetch('/api/finance/scholarships'),
      fetch('/api/admin/settings'),
    ])
    if (schRes.ok) setScholarships(await schRes.json())
    if (settingsRes.ok) {
      const { tenant } = await settingsRes.json()
      if (tenant?.currency) setCurrency(tenant.currency)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/finance/scholarships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: form.amount ? parseFloat(form.amount) : undefined,
        percentage: form.percentage ? parseFloat(form.percentage) : undefined,
      }),
    })
    setShowForm(false)
    setForm({ name: '', type: 'SCHOLARSHIP', description: '', amount: '', percentage: '' })
    setSaving(false)
    load()
  }

  const typeColor: Record<string, string> = {
    SCHOLARSHIP: 'bg-blue-100 text-blue-800',
    BURSARY: 'bg-blue-50 text-blue-700',
    GRANT: 'bg-blue-50 text-blue-600',
    DISCOUNT: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Scholarships & Bursaries</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage financial aid and awards</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Award
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create Scholarship / Bursary</h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Academic Excellence Award"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="SCHOLARSHIP">Scholarship</option>
                  <option value="BURSARY">Bursary</option>
                  <option value="GRANT">Grant</option>
                  <option value="DISCOUNT">Discount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Leave blank if percentage"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage (%)</label>
                <input
                  type="number"
                  min={0} max={100}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Leave blank if fixed amount"
                  value={form.percentage}
                  onChange={(e) => setForm({ ...form, percentage: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-100 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : scholarships.length === 0 ? (
        <div className="text-center py-12">
          <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No scholarships yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scholarships.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColor[s.type] ?? ''}`}>
                  {s.type}
                </span>
                <span className="text-xs text-gray-400">{s._count.awards} awarded</span>
              </div>
              <h3 className="font-semibold text-gray-900 mt-2">{s.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {s.amount
                  ? `$${s.amount.toLocaleString()}`
                  : s.percentage
                  ? `${s.percentage}% discount`
                  : 'Variable amount'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
