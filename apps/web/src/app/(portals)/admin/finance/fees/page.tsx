'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Plus, ToggleLeft } from 'lucide-react'

interface FeeStructure {
  id: string; name: string; amount: number; description?: string
  level?: number; isRecurring: boolean; isActive: boolean; dueDate?: string
}

export default function FeesPage() {
  const [fees, setFees] = useState<FeeStructure[]>([])
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', amount: '', description: '', level: '', isRecurring: true, dueDate: '',
  })

  async function load() {
    setLoading(true)
    const [feesRes, settingsRes] = await Promise.all([
      fetch('/api/finance/fees'),
      fetch('/api/admin/settings'),
    ])
    if (feesRes.ok) setFees(await feesRes.json())
    if (settingsRes.ok) {
      const { tenant } = await settingsRes.json()
      if (tenant?.currency) setCurrency(tenant.currency)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/finance/fees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        level: form.level ? parseInt(form.level) : undefined,
        dueDate: form.dueDate || undefined,
      }),
    })
    setShowForm(false)
    setForm({ name: '', amount: '', description: '', level: '', isRecurring: true, dueDate: '' })
    setSaving(false)
    load()
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Fee Structures</h2>
          <p className="text-sm text-slate-400 mt-0.5">Define fee types and amounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Fee
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create Fee Structure</h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Name</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Tuition Fee"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level (optional)</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                >
                  <option value="">All levels</option>
                  {[100, 200, 300, 400, 500].map((l) => (
                    <option key={l} value={l}>{l} Level</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              />
              <label htmlFor="recurring" className="text-sm text-gray-600">Recurring (charged each semester)</label>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Create Fee'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-100 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : fees.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No fee structures yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Fee Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Level</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-5 py-3.5 border-r border-gray-100">
                    <p className="font-semibold text-slate-900">{f.name}</p>
                    {f.description && <p className="text-xs text-slate-400">{f.description}</p>}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900 border-r border-gray-100">{fmt(f.amount)}</td>
                  <td className="px-5 py-3.5 text-slate-500 border-r border-gray-100">{f.level ?? 'All'}</td>
                  <td className="px-5 py-3.5 border-r border-gray-100">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.isRecurring ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {f.isRecurring ? 'Recurring' : 'One-time'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
