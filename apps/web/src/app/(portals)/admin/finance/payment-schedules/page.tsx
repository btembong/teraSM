'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  CalendarDays, Plus, Pencil, Trash2, X, Loader2,
  AlertCircle, CheckCircle, ToggleRight, ToggleLeft,
  ChevronDown, ChevronRight, Layers,
} from 'lucide-react'

interface Template { id: string; name: string; numInstallments: number; items: { label: string; percentage: number }[] }
interface Semester { id: string; name: string }
interface ScheduleItem { id?: string; label: string; percentage: string; dueDate: string; sortOrder?: number }
interface PaymentSchedule {
  id: string; name: string; description?: string | null
  semesterId?: string | null; semesterName?: string | null
  templateId?: string | null; templateName?: string | null
  isActive: boolean; createdAt: string
  items: { id: string; label: string; percentage: number; dueDate: string; sortOrder: number }[]
  _count: { paymentPlans: number }
}

const defaultItem = (): ScheduleItem => ({ label: '', percentage: '', dueDate: '' })

function ScheduleDrawer({
  open, onClose, onSaved, templates, semesters, initial,
}: {
  open: boolean; onClose: () => void; onSaved: () => void
  templates: Template[]; semesters: Semester[]; initial?: PaymentSchedule | null
}) {
  const [name, setName]             = useState('')
  const [desc, setDesc]             = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [items, setItems]           = useState<ScheduleItem[]>([defaultItem(), defaultItem(), defaultItem()])
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setDesc(initial.description ?? '')
      setSemesterId(initial.semesterId ?? '')
      setTemplateId(initial.templateId ?? '')
      setItems(initial.items.map(i => ({
        id:         i.id,
        label:      i.label,
        percentage: String(i.percentage),
        dueDate:    i.dueDate ? i.dueDate.slice(0, 10) : '',
        sortOrder:  i.sortOrder,
      })))
    } else {
      setName(''); setDesc(''); setSemesterId(''); setTemplateId('')
      setItems([defaultItem(), defaultItem(), defaultItem()])
    }
    setError('')
  }, [initial, open])

  // When template selected, pre-fill items from template (keeping any existing dates)
  function applyTemplate(tid: string) {
    setTemplateId(tid)
    const tpl = templates.find(t => t.id === tid)
    if (!tpl) return
    setItems(tpl.items.map((it, idx) => ({
      label:      it.label || `Installment ${idx + 1}`,
      percentage: String(it.percentage),
      dueDate:    items[idx]?.dueDate ?? '',
    })))
  }

  function setItem(idx: number, key: keyof ScheduleItem, val: string) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it))
  }
  function addItem()              { setItems(prev => [...prev, defaultItem()]) }
  function removeItem(idx: number) { if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== idx)) }

  const total = items.reduce((s, i) => s + (parseFloat(i.percentage) || 0), 0)
  const sumOk = Math.abs(total - 100) < 0.01

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    if (!sumOk) { setError('Percentages must sum to exactly 100%'); return }
    const missing = items.some(i => !i.dueDate)
    if (missing) { setError('Every installment must have a due date'); return }

    setSaving(true); setError('')
    try {
      const url    = initial ? `/api/finance/payment-schedules/${initial.id}` : '/api/finance/payment-schedules'
      const method = initial ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc, semesterId, templateId, items }),
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
          <h2 className="font-bold text-slate-900">{initial ? 'Edit Payment Schedule' : 'New Payment Schedule'}</h2>
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

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Schedule Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} required
              placeholder="e.g. 2024/25 Semester 1 — 3-Installment Plan"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>

          {/* Semester + Template */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Semester (optional)</label>
              <select value={semesterId} onChange={e => setSemesterId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
                <option value="">All semesters</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Base Template <span className="text-slate-400">(optional)</span>
              </label>
              <select value={templateId} onChange={e => applyTemplate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
                <option value="">None — set manually</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.numInstallments})</option>)}
              </select>
              {templateId && <p className="text-xs text-indigo-600 mt-1">% splits loaded — set the dates below</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description (optional)</label>
            <input value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Brief note about this schedule"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>

          {/* Installments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600">Installments</label>
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                sumOk ? 'bg-green-100 text-green-700' : total > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {sumOk && <CheckCircle className="w-3 h-3" />}
                {total.toFixed(1)}% / 100%
              </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_120px_28px] gap-2 px-1 mb-1">
              <span className="text-xs text-slate-400 font-medium">Label</span>
              <span className="text-xs text-slate-400 font-medium text-center">%</span>
              <span className="text-xs text-slate-400 font-medium">Due Date</span>
              <span />
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_120px_28px] gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      value={item.label} onChange={e => setItem(idx, 'label', e.target.value)}
                      placeholder={`Installment ${idx + 1}`}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="number" min="0" max="100" step="0.1"
                      value={item.percentage} onChange={e => setItem(idx, 'percentage', e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-lg pl-2.5 pr-5 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                  </div>
                  <input
                    type="date"
                    value={item.dueDate} onChange={e => setItem(idx, 'dueDate', e.target.value)}
                    className={`w-full border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${!item.dueDate ? 'border-amber-300' : 'border-gray-200'}`}
                  />
                  <button type="button" onClick={() => removeItem(idx)} disabled={items.length <= 1}
                    className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors disabled:opacity-30">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={addItem}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add installment
            </button>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={saving || !sumOk}
            className="flex-1 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {initial ? 'Save Changes' : 'Create Schedule'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSchedulesPage() {
  const [schedules, setSchedules]   = useState<PaymentSchedule[]>([])
  const [templates, setTemplates]   = useState<Template[]>([])
  const [semesters, setSemesters]   = useState<Semester[]>([])
  const [loading, setLoading]       = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing]       = useState<PaymentSchedule | null>(null)
  const [expanded, setExpanded]     = useState<Record<string, boolean>>({})
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [toggling, setToggling]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [schRes, tplRes, semRes] = await Promise.all([
      fetch('/api/finance/payment-schedules'),
      fetch('/api/finance/installment-plans'),
      fetch('/api/admin/academics/semesters'),
    ])
    if (schRes.ok) setSchedules(await schRes.json())
    if (tplRes.ok) setTemplates(await tplRes.json())
    if (semRes.ok) { const d = await semRes.json(); setSemesters(d.semesters ?? d ?? []) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleActive(s: PaymentSchedule) {
    setToggling(s.id)
    await fetch(`/api/finance/payment-schedules/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !s.isActive }),
    })
    setToggling(null); load()
  }

  async function deleteSchedule(id: string) {
    if (!confirm('Delete this payment schedule?')) return
    setDeleting(id)
    const res = await fetch(`/api/finance/payment-schedules/${id}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json(); alert(d.error ?? 'Cannot delete') }
    setDeleting(null); load()
  }

  function openEdit(s: PaymentSchedule) { setEditing(s); setDrawerOpen(true) }
  function openNew()                     { setEditing(null); setDrawerOpen(true) }
  function toggle(id: string)            { setExpanded(prev => ({ ...prev, [id]: !prev[id] })) }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payment Schedules</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Define installment plans with real due dates — apply to student invoices to split payments
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> New Schedule
        </button>
      </div>

      {/* How it works banner */}
      <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-800">
        <Layers className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-500" />
        <p>
          <strong>Workflow:</strong> Create a schedule with N installments, each with a % of the invoice total and a specific due date.
          Then go to <strong>Invoices</strong> and apply the schedule to any student invoice — the system calculates exact amounts automatically.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading schedules…
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-gray-200 rounded-2xl">
          <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">No payment schedules yet</p>
          <p className="text-slate-400 text-xs mt-1">Create a schedule to split student invoices into installments with specific due dates</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-300" />
            <span className="text-sm font-semibold text-slate-700">{schedules.length} schedule{schedules.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {schedules.map(s => {
              const isOpen = expanded[s.id] ?? false
              return (
                <div key={s.id}>
                  {/* Row */}
                  <div className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50/40 transition-colors ${!s.isActive ? 'opacity-60' : ''}`}>
                    {/* Expand */}
                    <button onClick={() => toggle(s.id)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                      {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                        {!s.isActive && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Inactive</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                        {s.semesterName && <span>📅 {s.semesterName}</span>}
                        {s.templateName && <span>📋 Based on: {s.templateName}</span>}
                        {s.description  && <span>{s.description}</span>}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4 text-center flex-shrink-0">
                      <div>
                        <p className="text-sm font-bold text-indigo-600">{s.items.length}</p>
                        <p className="text-xs text-slate-400">installments</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{s._count.paymentPlans}</p>
                        <p className="text-xs text-slate-400">applied</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => toggleActive(s)} disabled={toggling === s.id}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title={s.isActive ? 'Deactivate' : 'Activate'}>
                        {toggling === s.id
                          ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          : s.isActive
                            ? <ToggleRight className="w-4 h-4 text-indigo-600" />
                            : <ToggleLeft  className="w-4 h-4 text-slate-300" />}
                      </button>
                      <button onClick={() => openEdit(s)}
                        className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteSchedule(s.id)} disabled={deleting === s.id}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors disabled:opacity-50">
                        {deleting === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded installment detail */}
                  {isOpen && (
                    <div className="bg-slate-50/60 border-t border-gray-50 px-5 pb-4">
                      <div className="mt-3 rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="text-left px-4 py-2 font-semibold text-slate-500">#</th>
                              <th className="text-left px-4 py-2 font-semibold text-slate-500">Label</th>
                              <th className="text-center px-4 py-2 font-semibold text-slate-500">% of Invoice</th>
                              <th className="text-left px-4 py-2 font-semibold text-slate-500">Due Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {s.items.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-white/60">
                                <td className="px-4 py-2.5">
                                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold inline-flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-medium text-slate-700">{item.label}</td>
                                <td className="px-4 py-2.5 text-center font-bold text-indigo-700">{item.percentage}%</td>
                                <td className="px-4 py-2.5 text-slate-600 font-medium">{fmt(item.dueDate)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 border-t border-gray-100">
                              <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-slate-500">Total</td>
                              <td className="px-4 py-2 text-center">
                                <span className={`text-xs font-bold ${
                                  Math.abs(s.items.reduce((a, i) => a + i.percentage, 0) - 100) < 0.01
                                    ? 'text-green-600' : 'text-red-500'
                                }`}>
                                  {s.items.reduce((a, i) => a + i.percentage, 0).toFixed(1)}%
                                </span>
                              </td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ScheduleDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        onSaved={load}
        templates={templates}
        semesters={semesters}
        initial={editing}
      />
    </div>
  )
}
