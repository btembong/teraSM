'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Plus, Users, CheckCircle, Clock } from 'lucide-react'

interface PayrollPeriod {
  id: string
  name: string
  month: number
  year: number
  status: string
  processedAt: string | null
  paidAt: string | null
  _count: { payslips: number }
}

const statusColor: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PROCESSING: 'bg-blue-50 text-blue-700',
  PAID: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-400',
}

export default function AdminPayrollPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/hr/payroll/periods')
      .then((r) => r.json())
      .then((data) => { setPeriods(data); setLoading(false) })
  }, [])

  const createPeriod = async () => {
    setCreating(true)
    const res = await fetch('/api/hr/payroll/periods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json()
    setPeriods((prev) => [{ ...data, _count: { payslips: 0 } }, ...prev])
    setCreating(false)
  }

  const updateStatus = async (id: string, action: 'PROCESS' | 'PAY') => {
    const res = await fetch(`/api/hr/payroll/periods/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    setPeriods((prev) => prev.map((p) => (p.id === id ? { ...p, status: data.status, processedAt: data.processedAt, paidAt: data.paidAt } : p)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-500">Manage monthly payroll periods and payslips</p>
        </div>
        <button
          onClick={createPeriod}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {creating ? 'Creating...' : 'New Period'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Payroll Periods</h2>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
        ) : periods.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No payroll periods yet. Click "New Period" to create one.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {periods.map((period) => (
              <div key={period.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{period.name}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{period._count.payslips} payslips</span>
                      {period.processedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Processed {new Date(period.processedAt).toLocaleDateString()}</span>}
                      {period.paidAt && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-blue-500" />Paid {new Date(period.paidAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[period.status] ?? ''}`}>
                    {period.status}
                  </span>
                  {period.status === 'DRAFT' && (
                    <button
                      onClick={() => updateStatus(period.id, 'PROCESS')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Process
                    </button>
                  )}
                  {period.status === 'PROCESSING' && (
                    <button
                      onClick={() => updateStatus(period.id, 'PAY')}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
