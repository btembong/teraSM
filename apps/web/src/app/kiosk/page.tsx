'use client'

import { useState, useEffect, useRef } from 'react'
import { GraduationCap, Search, X, AlertCircle, BadgeCheck, BookOpen, Wallet } from 'lucide-react'
import Image from 'next/image'

interface StudentSnapshot {
  school:   { name: string; logoUrl: string | null }
  student:  {
    studentId: string
    firstName: string
    lastName:  string
    avatarUrl: string | null
    program:   string | null
    level:     number
    cgpa:      number | null
  }
  outstandingBalance: number
  recentGrades: { courseCode: string; courseTitle: string; score: number; grade: string }[]
}

export default function KioskPage() {
  const [slug, setSlug]             = useState('')
  const [studentId, setStudentId]   = useState('')
  const [pin, setPin]               = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [data, setData]             = useState<StudentSnapshot | null>(null)
  const idleTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect school slug from hostname
  useEffect(() => {
    const hostname = window.location.hostname
    const parts    = hostname.split('.')
    if (parts.length >= 3 && !['localhost', '127'].includes(parts[0])) {
      setSlug(parts[0])
    }
  }, [])

  // Auto-reset after 90 seconds of inactivity (shared kiosk safety)
  function resetIdleTimer() {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(handleReset, 90_000)
  }

  function handleReset() {
    setData(null)
    setStudentId('')
    setPin('')
    setError('')
    if (idleTimer.current) clearTimeout(idleTimer.current)
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/kiosk/lookup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ slug: slug || window.location.hostname.split('.')[0], studentId, pin }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Lookup failed.'); return }
      setData(json)
      resetIdleTimer()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const gradeColor = (g: string) => {
    if (['A+', 'A', 'A-'].includes(g)) return 'text-emerald-600 bg-emerald-50'
    if (['B+', 'B', 'B-'].includes(g)) return 'text-blue-600 bg-blue-50'
    if (['C+', 'C', 'C-'].includes(g)) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Student Kiosk</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your Student ID and PIN to view your records</p>
        </div>

        {!data ? (
          /* ── Lookup Form ── */
          <form onSubmit={handleLookup} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 space-y-5">

            {/* Manual slug override — only shown on root domain */}
            {!slug && (
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">School Code</label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="e.g. westlands-college"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Student ID</label>
              <input
                type="text"
                value={studentId}
                onChange={e => setStudentId(e.target.value.toUpperCase())}
                placeholder="e.g. STU/2024/001"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">PIN</label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="4–6 digit PIN"
                inputMode="numeric"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 tracking-widest text-center text-xl"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-3.5 flex items-center justify-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Looking up…' : 'View My Records'}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Set your PIN from <span className="text-slate-400">Account Settings</span> inside the student portal
            </p>
          </form>
        ) : (
          /* ── Student Snapshot ── */
          <div className="space-y-4">

            {/* School header */}
            <div className="flex items-center gap-3 mb-2">
              {data.school.logoUrl ? (
                <Image src={data.school.logoUrl} alt={data.school.name} width={36} height={36} className="rounded-lg" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="text-white font-semibold">{data.school.name}</span>
              <button
                onClick={handleReset}
                className="ml-auto text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Start over"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                {data.student.avatarUrl ? (
                  <Image
                    src={data.student.avatarUrl}
                    alt="Avatar"
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                    {data.student.firstName[0]}{data.student.lastName[0]}
                  </div>
                )}
                <div>
                  <p className="text-white text-lg font-semibold">
                    {data.student.firstName} {data.student.lastName}
                  </p>
                  <p className="text-slate-400 text-sm font-mono">{data.student.studentId}</p>
                  {data.student.program && (
                    <p className="text-slate-400 text-sm mt-0.5">{data.student.program} · Level {data.student.level}</p>
                  )}
                </div>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    CGPA
                  </div>
                  <p className="text-white text-2xl font-bold">
                    {data.student.cgpa != null ? data.student.cgpa.toFixed(2) : '—'}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Wallet className="w-3.5 h-3.5" />
                    Outstanding
                  </div>
                  <p className={`text-2xl font-bold ${data.outstandingBalance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {data.outstandingBalance > 0
                      ? `$${data.outstandingBalance.toLocaleString()}`
                      : 'Cleared'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent grades */}
            {data.recentGrades.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-4">
                  <BookOpen className="w-4 h-4" />
                  Recent Grades
                </div>
                <div className="space-y-2">
                  {data.recentGrades.map((g, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm">{g.courseTitle}</p>
                        <p className="text-slate-500 text-xs font-mono">{g.courseCode}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block text-xs font-bold px-2 py-1 rounded-lg ${gradeColor(g.grade)}`}>
                          {g.grade}
                        </span>
                        <p className="text-slate-400 text-xs mt-0.5">{g.score}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full text-slate-400 hover:text-white text-sm py-2 transition-colors"
            >
              Done — clear screen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
