'use client'

import { useEffect, useState } from 'react'
import { Loader2, TrendingUp, Users, BarChart3, GraduationCap } from 'lucide-react'

interface Analytics {
  enrollment: { labels: string[]; counts: number[] }
  signups:    { labels: string[]; counts: number[] }
  attendanceByC: { code: string; rate: number }[]
  gradeDist: Record<string, number>
  standingDist: { standing: string; count: number }[]
}

// ── Simple SVG Bar Chart ──────────────────────────────────────────────────────
function BarChart({ labels, values, color, unit = '' }: {
  labels: string[]; values: number[]; color: string; unit?: string
}) {
  const max = Math.max(...values, 1)
  const H = 140; const W = 320; const BAR_W = Math.min(36, (W / labels.length) - 8)

  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full">
      {values.map((v, i) => {
        const barH = Math.round((v / max) * H)
        const x = (W / labels.length) * i + (W / labels.length - BAR_W) / 2
        const y = H - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={BAR_W} height={barH} rx={4} className={color} opacity="0.85" />
            {v > 0 && (
              <text x={x + BAR_W / 2} y={y - 4} textAnchor="middle" fontSize={9} className="fill-gray-500">
                {v}{unit}
              </text>
            )}
            <text x={x + BAR_W / 2} y={H + 16} textAnchor="middle" fontSize={9} className="fill-gray-400">
              {labels[i]}
            </text>
          </g>
        )
      })}
      {/* baseline */}
      <line x1={0} y1={H} x2={W} y2={H} stroke="#e5e7eb" strokeWidth={1} />
    </svg>
  )
}

// ── Horizontal Bar ────────────────────────────────────────────────────────────
function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-gray-600 w-16 flex-shrink-0 text-right">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{value}</span>
    </div>
  )
}

// ── Donut / Pie segment row ───────────────────────────────────────────────────
function PieRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
      <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
    </div>
  )
}

const GRADE_COLORS: Record<string, string> = {
  A: 'fill-indigo-500', B: 'fill-indigo-400', C: 'fill-amber-400', D: 'fill-orange-400', F: 'fill-red-400',
}
const GRADE_BAR_COLORS: Record<string, string> = {
  A: 'bg-indigo-500', B: 'bg-indigo-400', C: 'bg-amber-400', D: 'bg-orange-400', F: 'bg-red-400',
}
const STANDING_LABELS: Record<string, string> = {
  GOOD_STANDING: 'Good Standing', PROBATION: 'Probation',
  SUSPENDED: 'Suspended', DISMISSED: 'Dismissed',
}
const STANDING_COLORS: Record<string, string> = {
  GOOD_STANDING: 'bg-green-500', PROBATION: 'bg-amber-500',
  SUSPENDED: 'bg-red-500', DISMISSED: 'bg-gray-800',
}
const STANDING_DOT: Record<string, string> = {
  GOOD_STANDING: 'bg-green-500', PROBATION: 'bg-amber-500',
  SUSPENDED: 'bg-red-500', DISMISSED: 'bg-gray-800',
}

export default function AnalyticsPage() {
  const [data, setData]       = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics').then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading analytics…
      </div>
    )
  }
  if (!data) return null

  const totalGrades = Object.values(data.gradeDist).reduce((a, b) => a + b, 0)
  const totalStanding = data.standingDist.reduce((a, b) => a + b.count, 0)

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Analytics</h2>
        <p className="text-sm text-slate-400 mt-0.5">Attendance, performance, and enrollment trends</p>
      </div>

      {/* Row 1: Enrollment + Signups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Enrollments */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Course Enrollments</h2>
            <span className="text-xs text-gray-400 ml-auto">Last 6 months</span>
          </div>
          <BarChart
            labels={data.enrollment.labels}
            values={data.enrollment.counts}
            color="fill-indigo-500"
          />
        </div>

        {/* Student Signups */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-indigo-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Student Registrations</h2>
            <span className="text-xs text-gray-400 ml-auto">Last 6 months</span>
          </div>
          <BarChart
            labels={data.signups.labels}
            values={data.signups.counts}
            color="fill-indigo-500"
          />
        </div>
      </div>

      {/* Row 2: Attendance by Course */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-green-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Attendance Rate by Course</h2>
          <span className="text-xs text-gray-400 ml-auto">% present</span>
        </div>
        {data.attendanceByC.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No attendance records yet.</p>
        ) : (
          <div className="space-y-3">
            {data.attendanceByC.map(c => (
              <div key={c.code} className="flex items-center gap-3">
                <span className="text-xs font-mono font-semibold text-gray-700 w-16 flex-shrink-0">{c.code}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${c.rate >= 80 ? 'bg-green-500' : c.rate >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${c.rate}%` }}
                  />
                </div>
                <span className={`text-xs font-bold w-10 text-right ${c.rate >= 80 ? 'text-green-700' : c.rate >= 60 ? 'text-amber-700' : 'text-red-700'}`}>
                  {c.rate}%
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /><span className="text-xs text-gray-500">≥80% Good</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400" /><span className="text-xs text-gray-500">60–79% Moderate</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400" /><span className="text-xs text-gray-500">&lt;60% Poor</span></div>
        </div>
      </div>

      {/* Row 3: Grade Distribution + Academic Standing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Grade Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Grade Distribution</h2>
          </div>
          {totalGrades === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No grades recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {['A', 'B', 'C', 'D', 'F'].map(letter => (
                <HBar
                  key={letter}
                  label={`Grade ${letter}`}
                  value={data.gradeDist[letter] ?? 0}
                  max={Math.max(...Object.values(data.gradeDist))}
                  color={GRADE_BAR_COLORS[letter]}
                />
              ))}
              <p className="text-xs text-gray-400 pt-2 text-right">{totalGrades.toLocaleString()} grades total</p>
            </div>
          )}
        </div>

        {/* Academic Standing */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-4 h-4 text-indigo-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Academic Standing</h2>
          </div>
          {totalStanding === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No students yet.</p>
          ) : (
            <div className="space-y-3">
              {data.standingDist
                .sort((a, b) => b.count - a.count)
                .map(s => (
                  <PieRow
                    key={s.standing}
                    label={STANDING_LABELS[s.standing] ?? s.standing}
                    value={s.count}
                    total={totalStanding}
                    color={STANDING_DOT[s.standing] ?? 'bg-gray-400'}
                  />
                ))
              }
              <div className="pt-3 mt-2 border-t border-gray-100">
                {data.standingDist.map(s => {
                  const pct = totalStanding > 0 ? (s.count / totalStanding) * 100 : 0
                  return (
                    <div
                      key={s.standing}
                      className={`inline-block h-3 ${STANDING_COLORS[s.standing] ?? 'bg-gray-400'} first:rounded-l-full last:rounded-r-full`}
                      style={{ width: `${pct}%` }}
                      title={`${STANDING_LABELS[s.standing]}: ${s.count}`}
                    />
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 text-right">{totalStanding.toLocaleString()} students total</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
