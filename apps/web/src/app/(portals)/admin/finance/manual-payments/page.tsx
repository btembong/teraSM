'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, FileText, ExternalLink, Clock } from 'lucide-react'

type ManualPayment = {
  id: string
  amount: number
  bankName: string | null
  accountName: string | null
  reference: string | null
  proofUrl: string
  proofName: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNote: string | null
  createdAt: string
  student: { name: string | null; email: string } | null
  invoice: { invoiceNo: string; totalAmount: number; paidAmount: number; currency: string | null }
}

const statusBadge: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  APPROVED: 'bg-green-50 text-green-700 border border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
}

export default function ManualPaymentsPage() {
  const [payments, setPayments] = useState<ManualPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [reviewing, setReviewing] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [acting, setActing] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/manual-payments')
      if (res.ok) setPayments(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleAction(id: string, action: 'APPROVE' | 'REJECT') {
    setActing(true)
    try {
      await fetch(`/api/admin/manual-payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNote: note || undefined }),
      })
      setReviewing(null)
      setNote('')
      await load()
    } finally {
      setActing(false)
    }
  }

  const fmt = (n: number, currency?: string | null) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency ?? 'USD' }).format(n)

  const filtered = payments.filter(p => filter === 'ALL' || p.status === filter)
  const pendingCount = payments.filter(p => p.status === 'PENDING').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manual Payment Reviews</h1>
        <p className="text-gray-500 text-sm mt-0.5">Approve or reject bank transfer / deposit proofs submitted by students</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === s
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            {s === 'PENDING' && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-100 text-yellow-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-2xl">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No {filter !== 'ALL' ? filter.toLowerCase() : ''} payments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[p.status]}`}>
                      {p.status === 'PENDING' && <Clock className="w-3 h-3 inline mr-1" />}
                      {p.status === 'APPROVED' && <CheckCircle className="w-3 h-3 inline mr-1 text-green-600" />}
                      {p.status === 'REJECTED' && <XCircle className="w-3 h-3 inline mr-1 text-red-600" />}
                      {p.status}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Student</p>
                      <p className="font-medium text-gray-900">{p.student?.name ?? '—'}</p>
                      <p className="text-gray-500 text-xs">{p.student?.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Invoice</p>
                      <p className="font-medium text-gray-900">{p.invoice.invoiceNo}</p>
                      <p className="text-gray-500 text-xs">
                        {fmt(p.invoice.paidAmount, p.invoice.currency)} / {fmt(p.invoice.totalAmount, p.invoice.currency)} paid
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Amount Claimed</p>
                      <p className="text-xl font-bold text-gray-900">{fmt(p.amount, p.invoice.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Bank Details</p>
                      {p.bankName && <p className="text-gray-700">{p.bankName}</p>}
                      {p.accountName && <p className="text-gray-500 text-xs">{p.accountName}</p>}
                      {p.reference && <p className="text-gray-500 text-xs font-mono">Ref: {p.reference}</p>}
                      {!p.bankName && !p.accountName && !p.reference && <p className="text-gray-400 text-xs">Not provided</p>}
                    </div>
                  </div>

                  {p.adminNote && (
                    <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
                      <span className="font-medium">Note:</span> {p.adminNote}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <a
                    href={p.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Proof
                  </a>

                  {p.status === 'PENDING' && (
                    <button
                      onClick={() => { setReviewing(p.id); setNote('') }}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>

              {/* Inline review panel */}
              {reviewing === p.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Admin note (optional — required for rejection)
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                    placeholder="Reason for rejection, or approval notes..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      disabled={acting}
                      onClick={() => handleAction(p.id, 'APPROVE')}
                      className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      disabled={acting || !note.trim()}
                      onClick={() => handleAction(p.id, 'REJECT')}
                      className="flex items-center gap-1.5 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => { setReviewing(null); setNote('') }}
                      className="text-sm text-gray-500 px-3 py-2 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                  {acting === false && note === '' && (
                    <p className="text-xs text-gray-400 mt-1">A note is required to reject a payment.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
