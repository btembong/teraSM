'use client'

import { useState } from 'react'
import { CalendarDays, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ScheduleItem { label: string; percentage: number; dueDate: string }
interface Schedule { id: string; name: string; items: ScheduleItem[] }

interface Props {
  invoiceId:       string
  invoiceNo:       string
  totalAmount:     number
  schedules:       Schedule[]
  currency:        string
  hasExistingPlan: boolean
}

export function ApplyScheduleButton({
  invoiceId, invoiceNo, totalAmount, schedules, currency, hasExistingPlan,
}: Props) {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [selected, setSelected] = useState(schedules[0]?.id ?? '')
  const [applying, setApplying] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const schedule = schedules.find(s => s.id === selected)

  // Preview: calculate amounts from percentages
  const preview = schedule?.items.map(item => ({
    label:   item.label,
    amount:  parseFloat(((item.percentage / 100) * totalAmount).toFixed(2)),
    pct:     item.percentage,
    dueDate: item.dueDate,
  })) ?? []

  async function apply() {
    setApplying(true); setError('')
    try {
      const res = await fetch(`/api/finance/payment-schedules/${selected}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed'); return }
      setSuccess(true)
      setTimeout(() => { setOpen(false); setSuccess(false); router.refresh() }, 1200)
    } catch { setError('Network error') }
    finally { setApplying(false) }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(''); setSuccess(false) }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold border border-indigo-200 hover:bg-indigo-50 text-indigo-600 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
      >
        <CalendarDays className="w-3.5 h-3.5" />
        {hasExistingPlan ? 'Change Schedule' : 'Apply Schedule'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Apply Payment Schedule</h3>
                <p className="text-xs text-slate-400 mt-0.5">Invoice {invoiceNo} · {fmt(totalAmount)}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {hasExistingPlan && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  This invoice already has a payment schedule. Applying a new one will replace it.
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Schedule applied successfully!
                </div>
              )}

              {/* Schedule picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Schedule</label>
                <select value={selected} onChange={e => setSelected(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
                  {schedules.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Installment Preview</p>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Installment</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-500">%</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-500">Amount</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-500">Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {preview.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/40">
                            <td className="px-3 py-2.5 font-medium text-slate-700">{row.label || `Installment ${i + 1}`}</td>
                            <td className="px-3 py-2.5 text-center text-slate-500">{row.pct}%</td>
                            <td className="px-3 py-2.5 text-right font-bold text-slate-900">{fmt(row.amount)}</td>
                            <td className="px-3 py-2.5 text-right text-slate-600">{fmtDate(row.dueDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 border-t border-gray-100">
                          <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-slate-500">Total</td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900">{fmt(totalAmount)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setOpen(false)} type="button"
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={apply} disabled={applying || !selected || success}
                className="flex-1 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
                {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                {applying ? 'Applying…' : 'Confirm & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
