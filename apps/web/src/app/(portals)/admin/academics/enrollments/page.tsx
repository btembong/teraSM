'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, BookOpen, ChevronRight, Building2, AlertCircle } from 'lucide-react'
import { NoActiveSemester } from '@/components/ui/no-active-semester'

type Offering = {
  id: string
  code: string
  title: string
  department: string
  departmentCode: string
  teacher: string
  creditHours: number
  maxStudents: number
  room: string | null
  enrolled: number
  waitlisted: number
  dropped: number
}

type Data = {
  semester: { id: string; name: string; academicYear: string } | null
  offerings: Offering[]
}

export default function EnrollmentRosterIndexPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/enrollments').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data?.semester) return <NoActiveSemester feature="Enrollment roster" />

  const filtered = (data.offerings ?? []).filter(o =>
    !search || `${o.code} ${o.title} ${o.department} ${o.teacher}`.toLowerCase().includes(search.toLowerCase())
  )

  const totalEnrolled = data.offerings.reduce((s, o) => s + o.enrolled, 0)
  const totalWaitlisted = data.offerings.reduce((s, o) => s + o.waitlisted, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollment Roster</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.semester.name} — {data.semester.academicYear}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Offerings', value: data.offerings.length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Total Enrolled', value: totalEnrolled, color: 'bg-green-50 text-green-700' },
          { label: 'On Waitlist', value: totalWaitlisted, color: 'bg-yellow-50 text-yellow-700' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl p-5 ${stat.color}`}>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm font-medium mt-0.5 opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by course, department, or lecturer..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full text-sm table-hover">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Course</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dept</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lecturer</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Capacity</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Enrolled</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Waitlist</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fill %</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="py-10 text-center text-sm text-gray-400">No courses found.</td></tr>
            )}
            {filtered.map(o => {
              const fillPct = o.maxStudents > 0 ? Math.round((o.enrolled / o.maxStudents) * 100) : 0
              const isFull = o.enrolled >= o.maxStudents
              return (
                <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-900">{o.code}</p>
                    <p className="text-xs text-gray-400 mt-0.5 max-w-[220px] truncate">{o.title}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                      <Building2 className="w-3 h-3" />{o.departmentCode}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{o.teacher}</td>
                  <td className="px-4 py-3.5 text-center text-gray-700 font-medium">{o.maxStudents}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-gray-900'}`}>{o.enrolled}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {o.waitlisted > 0
                      ? <span className="text-xs font-semibold bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">{o.waitlisted}</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${fillPct >= 100 ? 'bg-red-500' : fillPct >= 80 ? 'bg-yellow-400' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(fillPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{fillPct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/admin/academics/enrollments/${o.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                      Roster <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
