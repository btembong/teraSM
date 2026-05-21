'use client'

import { useState } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react'

interface LeaveType { id: string; name: string; code: string; daysPerYear: number; isPaid: boolean }
interface LeaveBalance { id: string; entitled: number; used: number; remaining: number; leaveType: LeaveType }
interface LeaveRequest { id: string; days: number; startDate: string | Date; endDate: string | Date; reason: string | null; status: string; leaveType: LeaveType }
interface Employee {
  id: string
  leaveBalances: LeaveBalance[]
  leaveRequests: LeaveRequest[]
}

const statusColor: Record<string, string> = {
  PENDING: 'bg-blue-50 text-blue-700',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-gray-100 text-gray-400',
}

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
  CANCELLED: AlertCircle,
}

export default function StaffLeaveClient({ employee, leaveTypes }: { employee: Employee | null; leaveTypes: LeaveType[] }) {
  const [showForm, setShowForm] = useState(false)
  const [requests, setRequests] = useState<LeaveRequest[]>(employee?.leaveRequests ?? [])
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!employee) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="font-medium text-gray-600">No employee profile found</p>
        <p className="text-sm mt-1">Contact HR to set up your employee profile.</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/hr/leave/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, employeeId: employee.id }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      const data = await res.json()
      const lt = leaveTypes.find((t) => t.id === form.leaveTypeId)!
      setRequests((prev) => [{ ...data, leaveType: lt }, ...prev])
      setForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' })
      setShowForm(false)
    } catch {
      setError('Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave</h1>
          <p className="text-gray-500">Manage your leave requests and balances</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Leave balances */}
      <div className="grid gap-4 md:grid-cols-3">
        {employee.leaveBalances.map((bal) => (
          <div key={bal.id} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500">{bal.leaveType.name}</p>
            <div className="flex items-end gap-2 mt-2">
              <p className="text-3xl font-bold text-gray-900">{bal.remaining}</p>
              <p className="text-sm text-gray-400 mb-1">/ {bal.entitled} days left</p>
            </div>
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.max(0, (bal.remaining / bal.entitled) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{bal.used} used · {bal.remaining} remaining</p>
          </div>
        ))}
        {employee.leaveBalances.length === 0 && (
          <div className="col-span-3 text-center py-8 text-gray-400 text-sm">No leave balances set up yet. Contact HR.</div>
        )}
      </div>

      {/* Apply form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Apply for Leave</h2>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
              <select
                value={form.leaveTypeId}
                onChange={(e) => setForm((f) => ({ ...f, leaveTypeId: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select leave type</option>
                {leaveTypes.map((t) => <option key={t.id} value={t.id}>{t.name} {t.isPaid ? '' : '(Unpaid)'}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave history */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Leave History</h2>
        </div>
        {requests.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No leave requests yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((req) => {
              const Icon = statusIcon[req.status] ?? Clock
              return (
                <div key={req.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${req.status === 'APPROVED' ? 'text-blue-600' : req.status === 'REJECTED' ? 'text-gray-400' : 'text-blue-400'}`} />
                    <div>
                      <p className="font-medium text-gray-900">{req.leaveType.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()} · {req.days} day{req.days !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[req.status] ?? ''}`}>
                    {req.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
