'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Bot, Search, RefreshCw, TrendingDown } from 'lucide-react'

interface AtRiskStudent {
  id: string
  name: string
  attendanceRate: number | null
  avgScore: number | null
  riskScore: number
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  enrolledCourses: number
}

const riskColor: Record<string, string> = {
  HIGH: 'bg-gray-900 text-white',
  MEDIUM: 'bg-blue-50 text-blue-700',
  LOW: 'bg-gray-100 text-gray-600',
}

export default function AdminAIPage() {
  const [students, setStudents] = useState<AtRiskStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(null)
  const [intervention, setIntervention] = useState('')
  const [loadingIntervention, setLoadingIntervention] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetch('/api/ai/early-warning')
      .then((r) => r.json())
      .then((data) => { setStudents(data); setLoading(false) })
  }, [])

  const getIntervention = async (student: AtRiskStudent) => {
    setSelectedStudent(student)
    setIntervention('')
    setLoadingIntervention(true)
    const res = await fetch('/api/ai/early-warning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentData: student }),
    })
    const data = await res.json()
    setIntervention(data.analysis)
    setLoadingIntervention(false)
  }

  const search = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    const res = await fetch(`/api/ai/search?q=${encodeURIComponent(searchQuery)}`)
    const data = await res.json()
    setSearchResults(data.results || [])
    setSearching(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI & Intelligence</h1>
        <p className="text-gray-500">Early warning system and AI-powered insights</p>
      </div>

      {/* Natural Language Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Natural Language Search</h2>
        </div>
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Search courses, announcements, content..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={search}
            disabled={searching}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium"
          >
            {searching ? '...' : 'Search'}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-4 divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {searchResults.map((r) => (
              <div key={`${r.type}-${r.id}`} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-400">{r.subtitle}</p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium capitalize">{r.type}</span>
              </div>
            ))}
          </div>
        )}
        {searchQuery && searchResults.length === 0 && !searching && (
          <p className="text-sm text-gray-400 mt-3">No results found for "{searchQuery}"</p>
        )}
      </div>

      {/* Early Warning System */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Early Warning System</h2>
          </div>
          <button
            onClick={() => { setLoading(true); fetch('/api/ai/early-warning').then((r) => r.json()).then((d) => { setStudents(d); setLoading(false) }) }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Analyzing student data...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <TrendingDown className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No at-risk students detected</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {students.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${s.riskLevel === 'HIGH' ? 'bg-gray-900' : 'bg-blue-400'}`} />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                    <p className="text-xs text-gray-400">
                      Attendance: {s.attendanceRate !== null ? `${s.attendanceRate}%` : 'N/A'}
                      {' · '}Avg score: {s.avgScore !== null ? `${s.avgScore}%` : 'N/A'}
                      {' · '}{s.enrolledCourses} courses
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${riskColor[s.riskLevel]}`}>{s.riskLevel} RISK</span>
                  <button
                    onClick={() => getIntervention(s)}
                    className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    AI Intervention
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Intervention Panel */}
      {selectedStudent && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">AI Intervention Plan — {selectedStudent.name}</h3>
          </div>
          {loadingIntervention ? (
            <div className="text-sm text-gray-400 animate-pulse">Generating intervention recommendations...</div>
          ) : (
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{intervention}</div>
          )}
        </div>
      )}
    </div>
  )
}
