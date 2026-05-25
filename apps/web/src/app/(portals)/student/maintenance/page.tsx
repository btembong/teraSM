'use client'

import { useEffect, useState } from 'react'
import { Wrench, Plus, AlertCircle, Clock, CheckCircle } from 'lucide-react'

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  location: string | null
  category: string
  priority: string
  status: string
  createdAt: string
}

const priorityColor: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-blue-100 text-blue-800',
  URGENT: 'bg-gray-900 text-white',
}

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  OPEN: AlertCircle, IN_PROGRESS: Clock, RESOLVED: CheckCircle, CLOSED: CheckCircle,
}

export default function StudentMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', location: '', category: 'General', priority: 'MEDIUM' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/student-life/maintenance')
      .then((r) => r.json())
      .then((data) => { setRequests(data); setLoading(false) })
  }, [])

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/student-life/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setRequests((prev) => [data, ...prev])
    setForm({ title: '', description: '', location: '', category: 'General', priority: 'MEDIUM' })
    setShowForm(false)
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-500">Report and track maintenance requests</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Submit Maintenance Request</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Broken light in room 202" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Building/Room" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['General', 'Electrical', 'Plumbing', 'IT', 'Furniture', 'Cleaning'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">{submitting ? 'Submitting...' : 'Submit'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">My Requests</h2>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No maintenance requests yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((req) => {
              const Icon = statusIcon[req.status] ?? AlertCircle
              return (
                <div key={req.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${req.status === 'RESOLVED' ? 'text-blue-600' : req.status === 'IN_PROGRESS' ? 'text-blue-400' : 'text-gray-400'}`} />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{req.title}</p>
                      <p className="text-xs text-gray-400">{req.category}{req.location ? ` · ${req.location}` : ''} · {new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${priorityColor[req.priority] ?? ''}`}>{req.priority}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-medium bg-gray-100 text-gray-600">{req.status.replace('_', ' ')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
