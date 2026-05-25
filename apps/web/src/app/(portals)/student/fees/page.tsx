'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import {
  DollarSign, CheckCircle, AlertCircle, Clock, Award, CreditCard,
  ChevronDown, ChevronUp, Receipt, CalendarDays, Loader2, Info,
  Upload, Building, X,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceItem = { id: string; description: string; amount: number; quantity: number; subtotal: number }
type Payment = { id: string; amount: number; method: string; paidAt: string | null; reference: string }
type PaymentPlan = {
  id: string; status: string; numInstallments: number; totalAmount: number
  installments: { id: string; dueDate: string; amount: number; status: string; paidAt: string | null }[]
}
type Invoice = {
  id: string; invoiceNo: string; status: string; totalAmount: number; paidAmount: number
  dueDate: string | null; issuedAt: string | null; notes: string | null
  items: InvoiceItem[]; payments: Payment[]; paymentPlan: PaymentPlan | null
}
type Scholarship = {
  id: string; status: string; amountAwarded: number | null
  scholarship: { name: string; type: string; description: string | null }
}
type ManualPayment = {
  id: string; amount: number; bankName: string | null; reference: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; adminNote: string | null; createdAt: string
  proofUrl: string; invoice: { invoiceNo: string }
}
type FeesData = { invoices: Invoice[]; scholarships: Scholarship[]; manualPayments: ManualPayment[]; currency: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  DRAFT:          'bg-gray-100 text-gray-500',
  SENT:           'bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'bg-yellow-50 text-yellow-700',
  PAID:           'bg-green-50 text-green-700',
  OVERDUE:        'bg-red-50 text-red-700',
  CANCELLED:      'bg-gray-100 text-gray-400',
}

const PLAN_STATUS_STYLE: Record<string, string> = {
  APPROVED: 'bg-blue-50 text-blue-700',
  ACTIVE:   'bg-blue-50 text-blue-700',
  COMPLETED:'bg-green-50 text-green-700',
  PENDING:  'bg-yellow-50 text-yellow-700',
  REJECTED: 'bg-red-50 text-red-700',
  CANCELLED:'bg-gray-100 text-gray-500',
}

const INSTALLMENT_STYLE: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  PAID:    'bg-green-50 text-green-700',
  OVERDUE: 'bg-red-50 text-red-700',
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
}

function isPayable(inv: Invoice) {
  return ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status)
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = 'invoices' | 'history' | 'plans' | 'scholarships' | 'bank-transfer'

// ─── Main ────────────────────────────────────────────────────────────────────

declare global { interface Window { PaystackPop: any } }

export default function StudentFeesPage() {
  const [data, setData] = useState<FeesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('invoices')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [paying, setPaying] = useState<string | null>(null)
  const [planForm, setPlanForm] = useState<{ invoiceId: string; num: number } | null>(null)
  const [planSaving, setPlanSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [paystackReady, setPaystackReady] = useState(false)
  // Manual payment (bank transfer) state
  const [proofForm, setProofForm] = useState<{
    invoiceId: string; amount: string; bankName: string; accountName: string; reference: string
  } | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofUploading, setProofUploading] = useState(false)

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const load = useCallback(async () => {
    const [invoicesRes, scholarshipsRes, plansRes, manualRes] = await Promise.all([
      fetch('/api/finance/invoices'),
      fetch('/api/student/scholarships'),
      fetch('/api/student/payment-plans'),
      fetch('/api/student/manual-payments'),
    ])
    const [invoicesData, scholarshipsData, plansData, manualData] = await Promise.all([
      invoicesRes.json(),
      scholarshipsRes.json(),
      plansRes.json(),
      manualRes.json(),
    ])

    const plansByInvoice: Record<string, PaymentPlan> = {}
    if (Array.isArray(plansData)) {
      plansData.forEach((p: any) => { plansByInvoice[p.invoiceId] = p })
    }

    const invoicesWithPlans = (Array.isArray(invoicesData) ? invoicesData : []).map((inv: any) => ({
      ...inv, paymentPlan: plansByInvoice[inv.id] ?? null,
    }))

    setData({
      invoices: invoicesWithPlans,
      scholarships: Array.isArray(scholarshipsData) ? scholarshipsData : [],
      manualPayments: Array.isArray(manualData) ? manualData : [],
      currency: 'GHS',
    })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function payNow(invoice: Invoice) {
    if (!paystackReady || !window.PaystackPop) {
      showToast('Payment gateway loading, please try again', 'error'); return
    }
    const balance = invoice.totalAmount - invoice.paidAmount
    setPaying(invoice.id)

    // Get next installment amount if on a plan
    let payAmount = balance
    if (invoice.paymentPlan?.status === 'APPROVED' || invoice.paymentPlan?.status === 'ACTIVE') {
      const nextInstallment = invoice.paymentPlan.installments.find(i => i.status === 'PENDING')
      if (nextInstallment) payAmount = nextInstallment.amount
    }

    const res = await fetch('/api/student/payments/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: invoice.id, amount: payAmount }),
    })
    const init = await res.json()
    if (!res.ok) { showToast(init.error ?? 'Failed to initialize payment', 'error'); setPaying(null); return }

    const handler = window.PaystackPop.setup({
      key: init.publicKey,
      email: init.email,
      amount: init.amount,
      currency: data?.currency ?? 'GHS',
      ref: init.reference,
      label: init.invoiceNo,
      channels: ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer'],
      onClose: () => { setPaying(null) },
      callback: async (response: any) => {
        setPaying(invoice.id + '-verifying')
        const vRes = await fetch('/api/student/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: response.reference }),
        })
        const vData = await vRes.json()
        if (vRes.ok) {
          showToast('Payment successful!', 'success')
          load()
        } else {
          showToast(vData.error ?? 'Verification failed', 'error')
        }
        setPaying(null)
      },
    })
    handler.openIframe()
  }

  async function enrollPlan() {
    if (!planForm) return
    setPlanSaving(true)
    const res = await fetch('/api/student/payment-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: planForm.invoiceId, numInstallments: planForm.num }),
    })
    const d = await res.json()
    if (res.ok) {
      showToast(`Payment plan created — ${planForm.num} monthly installments`, 'success')
      setPlanForm(null)
      load()
    } else {
      showToast(d.error ?? 'Failed to create plan', 'error')
    }
    setPlanSaving(false)
  }

  async function submitProof() {
    if (!proofForm || !proofFile) return
    setProofUploading(true)
    try {
      // 1. Upload file to R2
      const fd = new FormData()
      fd.append('file', proofFile)
      const uploadRes = await fetch('/api/student/upload-proof', { method: 'POST', body: fd })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) { showToast(uploadData.error ?? 'Upload failed', 'error'); return }

      // 2. Submit manual payment record
      const res = await fetch('/api/student/manual-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: proofForm.invoiceId,
          amount: parseFloat(proofForm.amount),
          bankName: proofForm.bankName || undefined,
          accountName: proofForm.accountName || undefined,
          reference: proofForm.reference || undefined,
          proofUrl: uploadData.url,
          proofName: uploadData.name,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        showToast('Payment proof submitted — awaiting admin review', 'success')
        setProofForm(null)
        setProofFile(null)
        load()
      } else {
        showToast(d.error ?? 'Submission failed', 'error')
      }
    } finally {
      setProofUploading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const { invoices, scholarships, manualPayments, currency } = data!
  const outstanding = invoices.filter(i => isPayable(i)).reduce((s, i) => s + i.totalAmount - i.paidAmount, 0)
  const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0)
  const allPayments = invoices.flatMap(i => i.payments).sort((a, b) =>
    new Date(b.paidAt ?? 0).getTime() - new Date(a.paidAt ?? 0).getTime()
  )

  const pendingProofs = manualPayments.filter(m => m.status === 'PENDING').length
  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'invoices', label: 'Invoices' },
    { key: 'history', label: 'Payment History' },
    { key: 'plans', label: 'Payment Plans' },
    { key: 'scholarships', label: 'Scholarships' },
    { key: 'bank-transfer', label: 'Bank Transfer', badge: pendingProofs },
  ]

  return (
    <>
      <Script
        src="https://js.paystack.co/v1/inline.js"
        onLoad={() => setPaystackReady(true)}
      />

      <div className="space-y-6">
        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium ${
            toast.type === 'success' ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your invoices, payments, and scholarship awards</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`rounded-2xl p-5 ${outstanding > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <p className={`text-2xl font-bold ${outstanding > 0 ? 'text-red-700' : 'text-green-700'}`}>{fmt(outstanding, currency)}</p>
            <p className={`text-sm font-medium mt-0.5 ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>Outstanding balance</p>
          </div>
          <div className="rounded-2xl p-5 bg-blue-50">
            <p className="text-2xl font-bold text-blue-700">{fmt(totalPaid, currency)}</p>
            <p className="text-sm font-medium text-blue-600 mt-0.5">Total paid</p>
          </div>
          <div className="rounded-2xl p-5 bg-gray-50">
            <p className="text-2xl font-bold text-gray-700">{scholarships.length}</p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Scholarships</p>
          </div>
        </div>

        {/* Outstanding alert */}
        {outstanding > 0 && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>You have an outstanding balance of <span className="font-bold">{fmt(outstanding, currency)}</span>. Pay to unlock course registration.</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
              {t.key === 'invoices' && invoices.filter(isPayable).length > 0 && (
                <span className="ml-1.5 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">
                  {invoices.filter(isPayable).length}
                </span>
              )}
              {t.badge ? (
                <span className="ml-1.5 text-xs bg-yellow-500 text-white rounded-full px-1.5 py-0.5">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── Invoices tab ── */}
        {tab === 'invoices' && (
          <div className="space-y-3">
            {invoices.length === 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
                <DollarSign className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="font-medium text-gray-500">No invoices yet</p>
                <p className="text-sm text-gray-400 mt-1">Fee invoices will appear here once issued.</p>
              </div>
            )}
            {invoices.map(inv => {
              const balance = inv.totalAmount - inv.paidAmount
              const isOpen = expanded === inv.id
              const payable = isPayable(inv)
              const isPaying = paying === inv.id || paying === inv.id + '-verifying'

              return (
                <div key={inv.id} className={`bg-white border rounded-2xl overflow-hidden ${
                  inv.status === 'OVERDUE' ? 'border-red-200' : 'border-gray-100'
                }`}>
                  {/* Invoice header */}
                  <div className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{inv.invoiceNo}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_STYLE[inv.status] ?? ''}`}>
                          {inv.status.replace('_', ' ')}
                        </span>
                        {inv.paymentPlan && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_STATUS_STYLE[inv.paymentPlan.status] ?? ''}`}>
                            Plan active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {inv.issuedAt ? `Issued ${new Date(inv.issuedAt).toLocaleDateString()}` : 'Draft'}
                        {inv.dueDate ? ` · Due ${new Date(inv.dueDate).toLocaleDateString()}` : ''}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-gray-900">{fmt(inv.totalAmount, currency)}</p>
                      {balance > 0 && inv.status !== 'CANCELLED' && (
                        <p className="text-xs text-red-500 font-medium">Balance: {fmt(balance, currency)}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {payable && (
                        <button
                          onClick={() => payNow(inv)}
                          disabled={!!paying}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          {isPaying
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{paying?.endsWith('-verifying') ? 'Verifying...' : 'Opening...'}</>
                            : <><CreditCard className="w-3.5 h-3.5" />Pay Now</>
                          }
                        </button>
                      )}
                      <button onClick={() => setExpanded(isOpen ? null : inv.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="border-t border-gray-50 bg-gray-50/30 px-5 py-4 space-y-4">
                      {/* Line items */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Invoice items</p>
                        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                          {inv.items.map((item, i) => (
                            <div key={item.id} className={`flex justify-between px-4 py-2.5 text-sm ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                              <span className="text-gray-600">{item.description}</span>
                              <span className="font-semibold text-gray-900">{fmt(item.subtotal, currency)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                            <span className="text-sm font-semibold text-gray-700">Total</span>
                            <span className="text-sm font-bold text-gray-900">{fmt(inv.totalAmount, currency)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payments made */}
                      {inv.payments.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Payments received</p>
                          <div className="space-y-1.5">
                            {inv.payments.map(p => (
                              <div key={p.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-2.5">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                  <span>{p.method.replace('_', ' ')}</span>
                                  <span className="text-gray-400">·</span>
                                  <span>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</span>
                                  <span className="font-mono text-gray-300">·</span>
                                  <span className="font-mono text-gray-400 text-[10px]">{p.reference}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-green-700">{fmt(p.amount, currency)}</span>
                                  <Link href={`/student/fees/receipt/${p.id}`}
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                                    <Receipt className="w-3 h-3" /> Receipt
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Payment plan section */}
                      {payable && !inv.paymentPlan && (
                        <div className="border border-dashed border-gray-200 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Installment plan</p>
                              <p className="text-xs text-gray-400 mt-0.5">Split your balance into monthly payments</p>
                            </div>
                            {planForm?.invoiceId === inv.id ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={planForm.num}
                                  onChange={e => setPlanForm({ invoiceId: inv.id, num: Number(e.target.value) })}
                                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  {[2,3,4,6,9,12].map(n => (
                                    <option key={n} value={n}>{n} months ({fmt((inv.totalAmount - inv.paidAmount) / n, currency)}/mo)</option>
                                  ))}
                                </select>
                                <button onClick={enrollPlan} disabled={planSaving}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-60">
                                  {planSaving ? 'Creating...' : 'Confirm'}
                                </button>
                                <button onClick={() => setPlanForm(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setPlanForm({ invoiceId: inv.id, num: 3 })}
                                className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                Set up plan
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Existing payment plan schedule */}
                      {inv.paymentPlan && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Installment schedule</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_STATUS_STYLE[inv.paymentPlan.status] ?? ''}`}>
                              {inv.paymentPlan.status}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {inv.paymentPlan.installments.map((inst, i) => (
                              <div key={inst.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-2.5">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="text-gray-400 font-mono">#{i + 1}</span>
                                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                                  <span>Due {new Date(inst.dueDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">{fmt(inst.amount, currency)}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INSTALLMENT_STYLE[inst.status] ?? ''}`}>
                                    {inst.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Payment History tab ── */}
        {tab === 'history' && (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {allPayments.length === 0 ? (
              <div className="p-10 text-center">
                <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="font-medium text-gray-500">No payments yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Method</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allPayments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/40">
                      <td className="px-5 py-3 text-gray-600">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.reference}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                          {p.method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-green-700">{fmt(p.amount, currency)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/student/fees/receipt/${p.id}`}
                          className="text-xs text-blue-600 hover:underline flex items-center justify-end gap-1">
                          <Receipt className="w-3 h-3" /> Receipt
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-100 bg-gray-50/70">
                    <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-gray-500">Total paid</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900">{fmt(totalPaid, currency)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}

        {/* ── Plans tab ── */}
        {tab === 'plans' && (
          <div className="space-y-4">
            {invoices.filter(i => i.paymentPlan).length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
                <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="font-medium text-gray-500">No payment plans</p>
                <p className="text-sm text-gray-400 mt-1">Open an invoice and click "Set up plan" to split your payments.</p>
              </div>
            ) : (
              invoices.filter(i => i.paymentPlan).map(inv => {
                const plan = inv.paymentPlan!
                const paidInstallments = plan.installments.filter(i => i.status === 'PAID').length
                return (
                  <div key={plan.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                      <div>
                        <p className="font-semibold text-gray-900">{inv.invoiceNo}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{plan.numInstallments} installments · {fmt(plan.totalAmount / plan.numInstallments, currency)}/month</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${PLAN_STATUS_STYLE[plan.status] ?? ''}`}>{plan.status}</span>
                        <p className="text-xs text-gray-400 mt-1">{paidInstallments}/{plan.numInstallments} paid</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="px-5 py-3 border-b border-gray-50">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(paidInstallments / plan.numInstallments) * 100}%` }} />
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {plan.installments.map((inst, i) => (
                        <div key={inst.id} className="flex items-center justify-between px-5 py-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="text-xs font-mono text-gray-400">#{i + 1}</span>
                            <span>Due {new Date(inst.dueDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-900">{fmt(inst.amount, currency)}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INSTALLMENT_STYLE[inst.status] ?? ''}`}>{inst.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Pay next installment */}
                    {isPayable(inv) && plan.installments.some(i => i.status === 'PENDING') && (
                      <div className="px-5 py-4 border-t border-gray-50 flex justify-end">
                        <button onClick={() => payNow(inv)} disabled={!!paying}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
                          <CreditCard className="w-4 h-4" /> Pay next installment
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Bank Transfer tab ── */}
        {tab === 'bank-transfer' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm text-blue-700">
              <Building className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Paid via bank deposit or mobile money? Upload your proof here. The finance office will verify and update your balance within 1–2 business days.</span>
            </div>

            {/* Submit new proof */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-gray-900">Submit payment proof</p>
                {proofForm && (
                  <button onClick={() => { setProofForm(null); setProofFile(null) }}
                    className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!proofForm ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Select an invoice to attach your proof to:</p>
                  <div className="space-y-1.5">
                    {invoices.filter(isPayable).length === 0 && (
                      <p className="text-sm text-gray-400 py-2">No outstanding invoices.</p>
                    )}
                    {invoices.filter(isPayable).map(inv => (
                      <button
                        key={inv.id}
                        onClick={() => setProofForm({ invoiceId: inv.id, amount: String(inv.totalAmount - inv.paidAmount), bankName: '', accountName: '', reference: '' })}
                        className="w-full text-left flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                      >
                        <div>
                          <span className="font-medium text-gray-900 text-sm">{inv.invoiceNo}</span>
                          <span className="ml-2 text-xs text-gray-400">Due {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</span>
                        </div>
                        <span className="font-bold text-red-600 text-sm">{fmt(inv.totalAmount - inv.paidAmount, currency)} outstanding</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Amount paid <span className="text-red-500">*</span></label>
                      <input
                        type="number" step="0.01" min="0.01"
                        value={proofForm.amount}
                        onChange={e => setProofForm({ ...proofForm, amount: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bank name</label>
                      <input
                        type="text"
                        value={proofForm.bankName}
                        onChange={e => setProofForm({ ...proofForm, bankName: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. GCB Bank"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Account name</label>
                      <input
                        type="text"
                        value={proofForm.accountName}
                        onChange={e => setProofForm({ ...proofForm, accountName: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Name on account"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Transaction reference</label>
                      <input
                        type="text"
                        value={proofForm.reference}
                        onChange={e => setProofForm({ ...proofForm, reference: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Bank ref / teller no."
                      />
                    </div>
                  </div>

                  {/* File upload */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Payment receipt / proof <span className="text-red-500">*</span>
                      <span className="text-gray-400 font-normal ml-1">(JPEG, PNG, PDF — max 5 MB)</span>
                    </label>
                    <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-colors ${
                      proofFile ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/20'
                    }`}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="sr-only"
                        onChange={e => setProofFile(e.target.files?.[0] ?? null)}
                      />
                      <Upload className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600">
                        {proofFile ? proofFile.name : 'Click to upload or drag & drop'}
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={submitProof}
                      disabled={proofUploading || !proofFile || !proofForm.amount}
                      className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {proofUploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</> : <><Upload className="w-3.5 h-3.5" /> Submit proof</>}
                    </button>
                    <button onClick={() => { setProofForm(null); setProofFile(null) }}
                      className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submitted proofs history */}
            {manualPayments.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Submitted proofs</p>
                <div className="space-y-2">
                  {manualPayments.map(m => (
                    <div key={m.id} className={`bg-white border rounded-xl px-4 py-3 flex items-start justify-between gap-4 ${
                      m.status === 'PENDING' ? 'border-yellow-100' : m.status === 'APPROVED' ? 'border-green-100' : 'border-red-100'
                    }`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-gray-900">{m.invoice.invoiceNo}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            m.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                            m.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {m.status === 'PENDING' && <Clock className="w-3 h-3 inline mr-0.5" />}
                            {m.status === 'APPROVED' && <CheckCircle className="w-3 h-3 inline mr-0.5" />}
                            {m.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fmt(m.amount, currency)} · {m.bankName ?? 'Bank'}{m.reference ? ` · Ref: ${m.reference}` : ''} · {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                        {m.status === 'REJECTED' && m.adminNote && (
                          <p className="text-xs text-red-600 mt-1 bg-red-50 rounded px-2 py-1">Reason: {m.adminNote}</p>
                        )}
                      </div>
                      <a href={m.proofUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex-shrink-0 mt-0.5">
                        View proof
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Scholarships tab ── */}
        {tab === 'scholarships' && (
          <div className="space-y-3">
            {scholarships.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
                <Award className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="font-medium text-gray-500">No scholarships</p>
                <p className="text-sm text-gray-400 mt-1">Contact the finance office to apply for scholarships or bursaries.</p>
              </div>
            ) : (
              scholarships.map(s => (
                <div key={s.id} className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Award className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{s.scholarship.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.scholarship.type}</p>
                      {s.scholarship.description && (
                        <p className="text-xs text-gray-500 mt-1">{s.scholarship.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {s.amountAwarded && (
                      <p className="font-bold text-blue-700 text-lg">{fmt(s.amountAwarded, currency)}</p>
                    )}
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold mt-1 inline-block ${
                      s.status === 'ACTIVE' || s.status === 'APPROVED' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>{s.status}</span>
                  </div>
                </div>
              ))
            )}
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-xs text-blue-700">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Scholarship amounts are automatically applied to your invoices. Contact the finance office for more information.</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
