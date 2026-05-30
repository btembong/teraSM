'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  DollarSign, Plus, Pencil, Trash2, ToggleRight,
  X, Loader2, ChevronDown, ChevronUp, AlertCircle, Search,
} from 'lucide-react'
import { SkeletonTable } from '@/components/ui/skeleton'

interface Program  { id: string; name: string; code: string }
interface Semester { id: string; name: string }
interface FeeStructure {
  id: string; name: string; description?: string | null
  amount: number; billingPeriod: string
  semesterId?: string | null; semesterName?: string | null
  programId?: string | null;  programName?: string | null; programCode?: string | null
  level?: number | null; isRecurring: boolean; isActive: boolean
  dueDate?: string | null
  lateFee?: number | null; lateFeeGraceDays: number
  lateFeePercent?: number | null; surchargePercent?: number | null
}

const BILLING_PERIOD_LABELS: Record<string, string> = {
  SEMESTER: 'Per Semester', ANNUAL: 'Annual', ONE_TIME: 'One-Time',
}
const LEVELS = [100, 200, 300, 400, 500, 600, 700]

const emptyForm = {
  name: '', description: '', amount: '', billingPeriod: 'SEMESTER',
  semesterId: '', programId: '', level: '', isRecurring: true,
  dueDate: '', lateFee: '', lateFeeGraceDays: '0',
  lateFeePercent: '', surchargePercent: '',
}

function FeeFormDrawer({
  open, onClose, onSaved, programs, semesters, initial,
}: {
  open: boolean; onClose: () => void; onSaved: () => void
  programs: Program[]; semesters: Semester[]; initial?: FeeStructure | null
}) {
  const [form, setForm]     = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [showPenalty, setShowPenalty] = useState(false)

  useEffect(() => {
    if (initial) {
      setForm({
        name:             initial.name,
        description:      initial.description ?? '',
        amount:           String(initial.amount),
        billingPeriod:    initial.billingPeriod,
        semesterId:       initial.semesterId ?? '',
        programId:        initial.programId  ?? '',
        level:            initial.level != null ? String(initial.level) : '',
        isRecurring:      initial.isRecurring,
        dueDate:          initial.dueDate ? initial.dueDate.slice(0, 10) : '',
        lateFee:          initial.lateFee != null ? String(initial.lateFee) : '',
        lateFeeGraceDays: String(initial.lateFeeGraceDays ?? 0),
        lateFeePercent:   initial.lateFeePercent  != null ? String(initial.lateFeePercent)  : '',
        surchargePercent: initial.surchargePercent != null ? String(initial.surchargePercent) : '',
      })
      setShowPenalty(!!(initial.lateFee || initial.lateFeePercent || initial.surchargePercent))
    } else {
      setForm(emptyForm)
      setShowPenalty(false)
    }
    setError('')
  }, [initial, open])

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const url    = initial ? `/api/finance/fees/${initial.id}` : '/api/finance/fees'
      const method = initial ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed'); return }
      onSaved(); onClose()
    } catch { setError('Network error') }
    finally { setSaving(false) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-slate-900">{initial ? 'Edit Fee Structure' : 'New Fee Structure'}</h2>
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
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fee Name <span className="text-red-500">*</span></label>
            <input
              value={form.name} onChange={e => set('name', e.target.value)} required
              placeholder="e.g. Tuition Fee, Lab Fee, Registration Fee"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>

          {/* Amount + Billing Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Amount <span className="text-red-500">*</span></label>
              <input
                type="number" step="0.01" min="0" required
                value={form.amount} onChange={e => set('amount', e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Billing Period</label>
              <select value={form.billingPeriod} onChange={e => set('billingPeriod', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
                <option value="SEMESTER">Per Semester</option>
                <option value="ANNUAL">Annual</option>
                <option value="ONE_TIME">One-Time</option>
              </select>
            </div>
          </div>

          {/* Programme + Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Programme</label>
              <select value={form.programId} onChange={e => set('programId', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
                <option value="">All programmes</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Level</label>
              <select value={form.level} onChange={e => set('level', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
                <option value="">All levels</option>
                {LEVELS.map(l => <option key={l} value={l}>{l} Level</option>)}
              </select>
            </div>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Semester (optional — leave blank for all semesters)</label>
            <select value={form.semesterId} onChange={e => set('semesterId', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              <option value="">All semesters</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Due Date + Recurring */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Due Date (optional)</label>
              <input
                type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => set('isRecurring', !form.isRecurring)}
                  className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.isRecurring ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isRecurring ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-xs font-semibold text-slate-600">Recurring each semester</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description (optional)</label>
            <input
              value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Brief note about this fee"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>

          {/* Penalty / Surcharge section */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPenalty(s => !s)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-slate-600"
            >
              <span>Penalty & Surcharge Rules</span>
              {showPenalty ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showPenalty && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Late Fee (fixed amount)</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={form.lateFee} onChange={e => set('lateFee', e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Grace Period (days)</label>
                    <input
                      type="number" min="0"
                      value={form.lateFeeGraceDays} onChange={e => set('lateFeeGraceDays', e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Late Fee (% of balance)</label>
                    <div className="relative">
                      <input
                        type="number" step="0.01" min="0" max="100"
                        value={form.lateFeePercent} onChange={e => set('lateFeePercent', e.target.value)}
                        placeholder="0.00"
                        className="w-full border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Surcharge (% on base)</label>
                    <div className="relative">
                      <input
                        type="number" step="0.01" min="0" max="100"
                        value={form.surchargePercent} onChange={e => set('surchargePercent', e.target.value)}
                        placeholder="0.00"
                        className="w-full border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Late fee can be fixed + %. Both are applied after the grace period. Surcharge is always added on top of the base fee amount.
                </p>
              </div>
            )}
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} type="button"
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={submit as any} disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {initial ? 'Save Changes' : 'Create Fee'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FeesPage() {
  const [fees, setFees]         = useState<FeeStructure[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading]   = useState(true)
  const [query, setQuery]       = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing]   = useState<FeeStructure | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filterPeriod, setFilterPeriod] = useState('')
  const [filterActive, setFilterActive] = useState('true')

  const load = useCallback(async () => {
    setLoading(true)
    const [feesRes, settingsRes, programsRes, semestersRes] = await Promise.all([
      fetch('/api/finance/fees?activeOnly=false'),
      fetch('/api/admin/settings'),
      fetch('/api/admin/academics/programs'),
      fetch('/api/admin/academics/semesters'),
    ])
    if (feesRes.ok)     setFees(await feesRes.json())
    if (settingsRes.ok) { const { tenant } = await settingsRes.json(); if (tenant?.currency) setCurrency(tenant.currency) }
    if (programsRes.ok) { const d = await programsRes.json(); setPrograms(d.programs ?? d ?? []) }
    if (semestersRes.ok){ const d = await semestersRes.json(); setSemesters(d.semesters ?? d ?? []) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

  const filtered = fees.filter(f => {
    const q = query.toLowerCase()
    if (q && !f.name.toLowerCase().includes(q) && !(f.programName ?? '').toLowerCase().includes(q)) return false
    if (filterPeriod && f.billingPeriod !== filterPeriod) return false
    if (filterActive === 'true'  && !f.isActive) return false
    if (filterActive === 'false' &&  f.isActive) return false
    return true
  })

  async function toggleActive(f: FeeStructure) {
    await fetch(`/api/finance/fees/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !f.isActive }),
    })
    load()
  }

  async function deleteFee(id: string) {
    setDeleting(id)
    await fetch(`/api/finance/fees/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  function openEdit(f: FeeStructure) { setEditing(f); setDrawerOpen(true) }
  function openNew()                  { setEditing(null); setDrawerOpen(true) }

  const billingColor: Record<string, string> = {
    SEMESTER: 'bg-indigo-50 text-indigo-700',
    ANNUAL:   'bg-purple-50 text-purple-700',
    ONE_TIME: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Fee Structures</h2>
          <p className="text-sm text-slate-400 mt-0.5">Define fees with programme, level, semester, and penalty rules</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> New Fee
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search fee name or programme…"
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white"
          />
        </div>
        <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="">All periods</option>
          <option value="SEMESTER">Per Semester</option>
          <option value="ANNUAL">Annual</option>
          <option value="ONE_TIME">One-Time</option>
        </select>
        <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
          <option value="">All statuses</option>
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={6} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-gray-200 rounded-2xl">
          <DollarSign className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">No fee structures found</p>
          <p className="text-slate-400 text-xs mt-1">Create one to start billing students</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <table className="w-full text-sm table-hover">
            <thead>
              <tr className="border-b border-gray-50 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Period</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Scope</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Penalties</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(f => (
                <tr key={f.id} className={`hover:bg-slate-50/40 transition-colors ${!f.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900">{f.name}</p>
                    {f.description && <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-slate-900">{fmt(f.amount)}</p>
                    {f.surchargePercent ? <p className="text-xs text-amber-600">+{f.surchargePercent}% surcharge</p> : null}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${billingColor[f.billingPeriod] ?? 'bg-gray-100 text-gray-600'}`}>
                      {BILLING_PERIOD_LABELS[f.billingPeriod] ?? f.billingPeriod}
                    </span>
                    {!f.isRecurring && <p className="text-xs text-slate-400 mt-0.5">One-time charge</p>}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 space-y-0.5">
                    {f.programName ? <p><span className="font-medium text-slate-700">{f.programCode}</span> — {f.programName}</p> : <p className="text-slate-300">All programmes</p>}
                    {f.level       ? <p>Level {f.level}</p>       : <p className="text-slate-300">All levels</p>}
                    {f.semesterName ? <p>{f.semesterName}</p>      : <p className="text-slate-300">All semesters</p>}
                  </td>
                  <td className="px-4 py-3.5 text-xs">
                    {f.lateFee || f.lateFeePercent ? (
                      <div className="space-y-0.5">
                        {f.lateFee     ? <p className="text-red-600 font-medium">+{fmt(f.lateFee)} after {f.lateFeeGraceDays}d</p> : null}
                        {f.lateFeePercent ? <p className="text-red-600 font-medium">+{f.lateFeePercent}% after {f.lateFeeGraceDays}d</p> : null}
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button onClick={() => toggleActive(f)} title={f.isActive ? 'Deactivate' : 'Activate'}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                      {f.isActive
                        ? <ToggleRight className="w-5 h-5 text-indigo-600" />
                        : <ToggleLeft  className="w-5 h-5 text-slate-300" />}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(f)}
                        className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteFee(f.id)}
                        disabled={deleting === f.id}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors disabled:opacity-50">
                        {deleting === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FeeFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        onSaved={load}
        programs={programs}
        semesters={semesters}
        initial={editing}
      />
    </div>
  )
}
