'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, CheckCircle } from 'lucide-react'

type Receipt = {
  id: string; reference: string; amount: number; method: string
  paidAt: string | null; invoiceNo: string; invoiceTotal: number
  items: { description: string; subtotal: number }[]
}
type Data = {
  receipt: Receipt
  student: { name: string; email: string | null | undefined }
  school: { name: string | null | undefined; logo: string | null | undefined }
}

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/student/payments/${id}/receipt`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!data?.receipt) return <p className="text-gray-400 text-sm">Receipt not found.</p>

  const { receipt, student, school } = data
  const currency = 'GHS' // ideally from tenant settings

  function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
  }

  return (
    <div className="space-y-4">
      {/* Controls — hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/student/fees" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Fees
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Receipt card */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden max-w-lg mx-auto print:max-w-none print:rounded-none print:border-none print:shadow-none">
        {/* Header */}
        <div className="bg-blue-600 px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">Payment Receipt</p>
              <p className="text-2xl font-bold mt-1">{school?.name ?? 'School'}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-blue-300" />
          </div>
        </div>

        {/* Amount */}
        <div className="px-8 py-6 border-b border-gray-100 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Amount Paid</p>
          <p className="text-4xl font-bold text-gray-900 mt-1">{fmt(receipt.amount)}</p>
          <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mt-3">
            <CheckCircle className="w-3.5 h-3.5" /> Payment Confirmed
          </div>
        </div>

        {/* Details grid */}
        <div className="px-8 py-5 space-y-3">
          {[
            { label: 'Receipt #', value: receipt.reference },
            { label: 'Invoice', value: receipt.invoiceNo },
            { label: 'Student', value: student.name },
            { label: 'Email', value: student.email ?? '—' },
            { label: 'Date', value: receipt.paidAt ? new Date(receipt.paidAt).toLocaleString() : '—' },
            { label: 'Method', value: receipt.method.replace('_', ' ') },
          ].map(row => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-gray-400">{row.label}</span>
              <span className="font-medium text-gray-900 text-right max-w-[240px] truncate">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Invoice items */}
        <div className="px-8 pb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Invoice breakdown</p>
          <div className="bg-gray-50 rounded-xl overflow-hidden">
            {receipt.items.map((item, i) => (
              <div key={i} className={`flex justify-between px-4 py-2.5 text-sm ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <span className="text-gray-600">{item.description}</span>
                <span className="font-semibold text-gray-900">{fmt(item.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2.5 border-t border-gray-200 bg-gray-100/50">
              <span className="text-sm font-semibold text-gray-700">Invoice total</span>
              <span className="text-sm font-bold text-gray-900">{fmt(receipt.invoiceTotal)}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5 border-t border-gray-200 bg-blue-50">
              <span className="text-sm font-semibold text-blue-700">This payment</span>
              <span className="text-sm font-bold text-blue-700">{fmt(receipt.amount)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">This is an official payment receipt from {school?.name}.</p>
          <p className="text-xs text-gray-300 mt-0.5 font-mono">{receipt.reference}</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          nav, aside, header, footer, .print\\:hidden { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  )
}
