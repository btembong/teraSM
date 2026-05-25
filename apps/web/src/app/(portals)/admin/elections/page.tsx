'use client'

import { useEffect, useState } from 'react'
import { Vote, Plus, CheckCircle, XCircle } from 'lucide-react'

interface Election {
  id: string
  title: string
  position: string
  status: string
  _count: { votes: number }
  candidates: { id: string; status: string; student: { firstName: string; lastName: string } }[]
}

const statusColor: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-500',
  NOMINATIONS_OPEN: 'bg-indigo-50 text-indigo-700',
  VOTING_OPEN: 'bg-indigo-600 text-white',
  CLOSED: 'bg-gray-100 text-gray-500',
  RESULTS_PUBLISHED: 'bg-indigo-100 text-indigo-800',
}

const statusFlow = ['DRAFT', 'NOMINATIONS_OPEN', 'VOTING_OPEN', 'CLOSED', 'RESULTS_PUBLISHED']

export default function AdminElectionsPage() {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', position: '', description: '',
    nominationsStart: '', nominationsEnd: '',
    votingStart: '', votingEnd: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/elections')
      .then((r) => r.json())
      .then((data) => { setElections(data); setLoading(false) })
  }, [])

  const create = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/elections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setElections((prev) => [{ ...data, _count: { votes: 0 }, candidates: [] }, ...prev])
    setShowForm(false)
    setSubmitting(false)
  }

  const advanceStatus = async (id: string, currentStatus: string) => {
    const nextIdx = statusFlow.indexOf(currentStatus) + 1
    if (nextIdx >= statusFlow.length) return
    const res = await fetch(`/api/admin/elections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusFlow[nextIdx] }),
    })
    if (res.ok) {
      setElections((prev) => prev.map((e) => e.id === id ? { ...e, status: statusFlow[nextIdx] } : e))
    }
  }

  const vettCandidate = async (electionId: string, candidateId: string, status: 'APPROVED' | 'REJECTED') => {
    await fetch(`/api/admin/elections/candidates/${candidateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setElections((prev) => prev.map((e) => e.id === electionId
      ? { ...e, candidates: e.candidates.map((c) => c.id === candidateId ? { ...c, status } : c) }
      : e
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Elections</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage student government elections</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium">
          <Plus className="w-4 h-4" /> New Election
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create Election</h2>
          <form onSubmit={create} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. SRC Elections 2025" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} required className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. SRC President" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominations Start</label>
                <input type="datetime-local" value={form.nominationsStart} onChange={(e) => setForm((f) => ({ ...f, nominationsStart: e.target.value }))} required className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominations End</label>
                <input type="datetime-local" value={form.nominationsEnd} onChange={(e) => setForm((f) => ({ ...f, nominationsEnd: e.target.value }))} required className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voting Start</label>
                <input type="datetime-local" value={form.votingStart} onChange={(e) => setForm((f) => ({ ...f, votingStart: e.target.value }))} required className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voting End</label>
                <input type="datetime-local" value={form.votingEnd} onChange={(e) => setForm((f) => ({ ...f, votingEnd: e.target.value }))} required className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium">{submitting ? 'Creating...' : 'Create'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
      ) : elections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
          <Vote className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No elections yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {elections.map((election) => (
            <div key={election.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{election.title}</h2>
                  <p className="text-sm text-gray-500">{election.position} · {election._count.votes} votes</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[election.status] ?? ''}`}>{election.status.replace(/_/g, ' ')}</span>
                  {statusFlow.indexOf(election.status) < statusFlow.length - 1 && (
                    <button onClick={() => advanceStatus(election.id, election.status)} className="text-xs px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white rounded-lg font-medium">
                      → {statusFlow[statusFlow.indexOf(election.status) + 1]?.replace(/_/g, ' ')}
                    </button>
                  )}
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {election.candidates.length === 0 ? (
                  <div className="px-6 py-3 text-xs text-gray-400">No candidates yet</div>
                ) : (
                  election.candidates.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-6 py-3">
                      <span className="text-sm text-gray-700">{c.student.firstName} {c.student.lastName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'APPROVED' ? 'bg-indigo-100 text-indigo-800' : c.status === 'REJECTED' ? 'bg-gray-100 text-gray-500' : 'bg-indigo-50 text-indigo-700'}`}>{c.status}</span>
                        {c.status === 'PENDING' && (
                          <>
                            <button onClick={() => vettCandidate(election.id, c.id, 'APPROVED')} className="text-indigo-600 hover:text-indigo-800"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => vettCandidate(election.id, c.id, 'REJECTED')} className="text-gray-400 hover:text-gray-600"><XCircle className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
