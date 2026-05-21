'use client'

import { useEffect, useState } from 'react'
import { Users, Plus, CheckCircle } from 'lucide-react'

interface Club {
  id: string
  name: string
  description: string | null
  category: string
  maxMembers: number | null
  _count: { memberships: number }
  isMember?: boolean
}

const categoryColor: Record<string, string> = {
  Sports: 'bg-blue-50 text-blue-700',
  Arts: 'bg-blue-100 text-blue-800',
  Academic: 'bg-blue-50 text-blue-700',
  Technology: 'bg-blue-100 text-blue-700',
  General: 'bg-gray-100 text-gray-600',
}

export default function StudentClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/student-life/clubs')
      .then((r) => r.json())
      .then((data) => { setClubs(data); setLoading(false) })
  }, [])

  const joinClub = async (clubId: string) => {
    setJoining(clubId)
    await fetch('/api/student-life/clubs/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clubId }),
    })
    setClubs((prev) => prev.map((c) => c.id === clubId ? { ...c, isMember: true, _count: { memberships: c._count.memberships + 1 } } : c))
    setJoining(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clubs & Societies</h1>
        <p className="text-gray-500">Discover and join student clubs</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading clubs...</div>
      ) : clubs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No clubs yet</p>
          <p className="text-gray-400 text-sm mt-1">Check back later or ask admin to create clubs</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <div key={club.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${categoryColor[club.category] ?? 'bg-gray-100 text-gray-600'}`}>
                  {club.category}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{club.name}</h3>
              {club.description && <p className="text-sm text-gray-500 mt-1 flex-1">{club.description}</p>}
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {club._count.memberships}{club.maxMembers ? `/${club.maxMembers}` : ''} members
                </span>
                {club.isMember ? (
                  <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Joined
                  </span>
                ) : (
                  <button
                    onClick={() => joinClub(club.id)}
                    disabled={joining === club.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {joining === club.id ? 'Joining...' : 'Join'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
