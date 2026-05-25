'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal } from 'lucide-react'

interface Entry {
  rank: number
  studentId: string
  name: string
  avatarUrl: string | null
  quizPts: number
  assignmentPts: number
  total: number
}

interface Offering {
  id: string
  course: { title: string; code: string }
}

export default function LeaderboardPage() {
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [selected, setSelected] = useState('')
  const [board, setBoard] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/student/enrolled-courses')
      .then(r => r.json())
      .then(data => {
        setOfferings(data ?? [])
        if (data?.[0]) setSelected(data[0].id)
      })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/lms/leaderboard?courseOfferingId=${selected}`)
      .then(r => r.json())
      .then(data => { setBoard(data ?? []); setLoading(false) })
  }, [selected])

  const rankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500'
    if (rank === 2) return 'text-gray-400'
    if (rank === 3) return 'text-amber-600'
    return 'text-gray-400'
  }

  const rankBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 border-yellow-200'
    if (rank === 2) return 'bg-gray-50 border-gray-200'
    if (rank === 3) return 'bg-amber-50 border-amber-200'
    return 'bg-white border-gray-100'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" /> Leaderboard
        </h1>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {offerings.map(o => (
            <option key={o.id} value={o.id}>{o.course.code} — {o.course.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : board.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No data yet for this course.</div>
      ) : (
        <div className="space-y-2">
          {board.map(entry => (
            <div key={entry.studentId}
              className={`flex items-center gap-4 rounded-2xl border px-5 py-4 ${rankBg(entry.rank)}`}>
              <div className={`text-lg font-bold w-8 text-center flex-shrink-0 ${rankColor(entry.rank)}`}>
                {entry.rank <= 3 ? <Medal className="w-5 h-5 mx-auto" /> : `#${entry.rank}`}
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">
                {entry.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{entry.name}</p>
                <p className="text-xs text-gray-400">
                  Quiz: {entry.quizPts} pts · Assignments: {entry.assignmentPts} pts
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-xl font-bold ${rankColor(entry.rank)}`}>{entry.total}</p>
                <p className="text-xs text-gray-400">total pts</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
