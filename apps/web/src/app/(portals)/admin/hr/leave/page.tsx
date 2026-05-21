'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react'

interface LeaveRequest {
  id: string
  days: number
  startDate: string
  endDate: string
  reason: string | null
  status: string
  leaveType: { name: string; isPaid: boolean }
  employee: { id: string; position: string; user?: { firstName: string; lastName: string } }
}

const statusColor: Record<string, string> = {
  PENDING: 'bg-blue-50 text-blue-700',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default function AdminLeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [filter, setFilter] = useState<string>('PENDING')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/hr/leave/requests?status=${filter}`)
      .then((r) => r.json())
      .then((data) => { setRequests(data); setLoading(false) })
  }, [filter])

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT', note?: string) => {
    await fetch(`/api/hr/leave/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note }),
    })
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="text-gray-500">Review and manage staff leave requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{filter} Requests</h2>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No {filter.toLowerCase()} requests</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((req) => (
              <div key={req.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700 flex-shrink-0 mt-0.5">
                      {req.employee.user?.firstName?.[0] ?? '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{req.employee.user?.firstName} {req.employee.user?.lastName}</p>
                      <p className="text-sm text-gray-500">{req.employee.position}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {req.days} day{req.days !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {req.reason && <p className="text-sm text-gray-500 mt-1 italic">"{req.reason}"</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[req.status] ?? ''}`}>
                      {req.leaveType.name} {req.leaveType.isPaid ? '' : '(Unpaid)'}
                    </span>
                    {req.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(req.id, 'APPROVE')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'REJECT')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                    {req.status !== 'PENDING' && (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[req.status]}`}>
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
