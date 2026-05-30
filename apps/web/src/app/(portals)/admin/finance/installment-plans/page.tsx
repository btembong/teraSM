'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  CreditCard, Plus, Pencil, Trash2, X, Loader2,
  AlertCircle, GripVertical, CheckCircle,
} from 'lucide-react'

interface TemplateItem {
  id?: string
  label: string
  percentage: string
  daysOffset: string
}

interface PlanTemplate {
  id: string
  name: string
  description?: string | null
  numInstallments: number
  isActive: boolean
  items: { id: string; label: string; percentage: number; daysOffset: number }[]
}

const defaultItem = (): TemplateItem => ({ label: '', percentage: '', daysOffset: '0' })

function PlanFormDrawer({
  open, onClose, onSaved, initial,
}: {
  open: boolean; onClose: () => void; onSaved: () => void; initial?: PlanTemplate | null
}) {
  const [name, setName]           = useState('')
  const [desc, setDesc]           = useState('')
  const [items, setItems]         = useState<TemplateItem[]>([defaultItem(), defaultItem()])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setDesc(initial.description ?? '')
      setItems(initial.items.map(i => ({
        id:         i.id,
        label:      i.label,
        percentage: String(i.percentage),
        daysOffset: String(i.daysOffset),
      })))
    } else {
      setName(''); setDesc('')
      setItems([defaultItem(), defaultItem()])
    }
    setError('')
  }, [initial, open])

  function setItem(idx: number, key: keyof TemplateItem, val: string) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it))
  }
  function addItem()        { setItems(prev => [...prev, defaultItem()]) }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  const total = items.reduce((s, i) => s + (parseFloat(i.percentage) || 0), 0)
  const sumOk = Math.abs(total - 100) < 0.01

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!sumOk) { setError('Percentages must sum to exactly 100%'); return }
    setSaving(true); setError('')
    try {
      const url    = initial ? `/api/finance/installment-plans/${initial.id}` : '/api/finance/installment-plans'
      const method = initial ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc, items }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed'); return }
      onSaved(); onClose()
    } catch { setError('Network error') }
    finally { setSaving(false) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-slate-900">{initial ? 'Edit Plan Template' : 'New Installment Plan'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Plan Name <span className="text-red-500">*</span></label>
            <input
              value={name} onChange={e => setName(e.target.value)} required
              placeholder="e.g. 3-Installment Plan, Semester Split"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description (optional)</label>
            <input
              value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Brief description of this plan"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>

          {/* Installment items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600">Installments</label>
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                sumOk ? 'bg-green-100 text-green-700' : total > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {sumOk && <CheckCircle className="w-3 h-3" />}
                {total.toFixed(1)}% of {100}%
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  <input
                    value={item.label}
                    onChange={e => setItem(idx, 'label', e.target.value)}
                    placeholder={`Installment ${idx + 1}`}
                    className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                  <div className="relative w-20 flex-shrink-0">
                    <input
                      type="number" min="0" max="100" step="0.1"
                      value={item.percentage}
                      onChange={e => setItem(idx, 'percentage', e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-lg pl-2.5 pr-6 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                  </div>
                  <div className="relative w-20 flex-shrink-0">
                    <input
                      type="number" min="0" step="1"
                      value={item.daysOffset}
                      onChange={e => setItem(idx, 'daysOffset', e.target.value)}
                      placeholder="0"
                      title="Days from invoice date"
                      className="w-full border border-gray-200 rounded-lg pl-2.5 pr-6 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">d</span>
                  </div>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)}
                      className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 mt-2">
              <strong>%</strong> = share of total invoice · <strong>d</strong> = days from invoice date when due
            </p>

            <button type="button" onClick={addItem}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add installment
            </button>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} type="button"
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={submit as any} disabled={saving || !sumOk}
            className="flex-1 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {initial ? 'Save Changes' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InstallmentPlansPage() {
  const [plans, setPlans]       = useState<PlanTemplate[]>([])
  const [loading, setLoading]   = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing]   = useState<PlanTemplate | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/finance/installment-plans')
    if (res.ok) setPlans(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew()              { setEditing(null); setDrawerOpen(true) }
  function openEdit(p: PlanTemplate) { setEditing(p); setDrawerOpen(true) }

  async function deletePlan(id: string) {
    setDeleting(id)
    await fetch(`/api/finance/installment-plans/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Installment Plan Templates</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Reusable payment schedules — define how invoice amounts are split across installments
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading plans…
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-gray-200 rounded-2xl">
          <CreditCard className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">No installment plans yet</p>
          <p className="text-slate-400 text-xs mt-1">Create a plan to offer students payment splits on their invoices</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map(p => (
            <div key={p.id} className={`bg-white border rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden ${!p.isActive ? 'opacity-60' : 'border-gray-100'}`}>
              {/* Card header */}
              <div className="px-5 py-4 border-b border-gray-50 flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                  {p.description && <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(p)}
                    className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deletePlan(p.id)} disabled={deleting === p.id}
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors disabled:opacity-50">
                    {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Badge */}
              <div className="px-5 py-2 bg-indigo-50 border-b border-indigo-100">
                <span className="text-xs font-semibold text-indigo-700">{p.numInstallments} installments</span>
              </div>

              {/* Installment rows */}
              <div className="divide-y divide-gray-50">
                {p.items.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-sm text-slate-700">{item.label || `Installment ${idx + 1}`}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{item.percentage}%</p>
                      <p className="text-xs text-slate-400">day {item.daysOffset}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total check */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-slate-400">Total</span>
                <span className={`text-xs font-bold ${
                  Math.abs(p.items.reduce((s, i) => s + i.percentage, 0) - 100) < 0.01
                    ? 'text-green-600' : 'text-red-500'
                }`}>
                  {p.items.reduce((s, i) => s + i.percentage, 0).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlanFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        onSaved={load}
        initial={editing}
      />
    </div>
  )
}
