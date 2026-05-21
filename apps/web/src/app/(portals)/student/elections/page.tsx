'use client'

import { useEffect, useState } from 'react'
import { Vote, CheckCircle } from 'lucide-react'

interface Election {
  id: string
  title: string
  position: string
  description: string | null
  status: string
  votingStart: string
  votingEnd: string
  myVote: string | null
  _count: { votes: number }
  candidates: {
    id: string
    manifesto: string | null
    student: { firstName: string; lastName: string; avatarUrl: string | null }
  }[]
}

const statusColor: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-500',
  NOMINATIONS_OPEN: 'bg-blue-50 text-blue-700',
  VOTING_OPEN: 'bg-blue-600 text-white',
  CLOSED: 'bg-gray-100 text-gray-500',
  RESULTS_PUBLISHED: 'bg-blue-100 text-blue-800',
}

export default function StudentElectionsPage() {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState<string | null>(null)
  const [manifesto, setManifesto] = useState('')
  const [nominatingFor, setNominatingFor] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/elections')
      .then((r) => r.json())
      .then((data) => { setElections(data); setLoading(false) })
  }, [])

  const castVote = async (electionId: string, candidateId: string) => {
    setVoting(candidateId)
    const res = await fetch('/api/elections/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ electionId, candidateId }),
    })
    if (res.ok) {
      setElections((prev) => prev.map((e) => e.id === electionId ? { ...e, myVote: candidateId } : e))
    }
    setVoting(null)
  }

  const nominate = async (electionId: string) => {
    setSubmitting(true)
    await fetch('/api/elections/nominate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ electionId, manifesto }),
    })
    setNominatingFor(null)
    setManifesto('')
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Elections</h1>
        <p className="text-gray-500">Student government elections and voting</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading elections...</div>
      ) : elections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
          <Vote className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No elections at this time</p>
        </div>
      ) : (
        <div className="space-y-6">
          {elections.map((election) => (
            <div key={election.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{election.title}</h2>
                  <p className="text-sm text-gray-500">{election.position} · {election._count.votes} votes cast</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[election.status] ?? ''}`}>
                    {election.status.replace('_', ' ')}
                  </span>
                  {election.status === 'NOMINATIONS_OPEN' && (
                    <button
                      onClick={() => setNominatingFor(election.id)}
                      className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                      Nominate Myself
                    </button>
                  )}
                </div>
              </div>

              {nominatingFor === election.id && (
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                  <p className="text-sm font-medium text-gray-900 mb-2">Your Manifesto</p>
                  <textarea
                    value={manifesto}
                    onChange={(e) => setManifesto(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                    placeholder="Tell voters why you should be elected..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => nominate(election.id)} disabled={submitting} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                      {submitting ? 'Submitting...' : 'Submit Nomination'}
                    </button>
                    <button onClick={() => setNominatingFor(null)} className="px-4 py-1.5 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm font-medium">Cancel</button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-gray-100">
                {election.candidates.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No approved candidates yet</div>
                ) : (
                  election.candidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                          {candidate.student.firstName[0]}{candidate.student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{candidate.student.firstName} {candidate.student.lastName}</p>
                          {candidate.manifesto && <p className="text-xs text-gray-400 max-w-sm truncate">{candidate.manifesto}</p>}
                        </div>
                      </div>
                      {election.myVote === candidate.id ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Your vote
                        </span>
                      ) : election.status === 'VOTING_OPEN' && !election.myVote ? (
                        <button
                          onClick={() => castVote(election.id, candidate.id)}
                          disabled={voting === candidate.id}
                          className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium"
                        >
                          {voting === candidate.id ? '...' : 'Vote'}
                        </button>
                      ) : null}
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
