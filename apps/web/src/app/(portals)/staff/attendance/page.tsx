'use client'

import { useEffect, useState } from 'react'
import { Check, X, Clock, Save, ChevronDown } from 'lucide-react'

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

interface Student { id: string; firstName: string; lastName: string; email: string }
interface Offering { id: string; course: { code: string; title: string } }
interface AttendanceRecord { studentId: string; status: AttendanceStatus }

const STATUS_OPTS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'PRESENT', label: 'Present', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'ABSENT',  label: 'Absent',  color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'LATE',    label: 'Late',    color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'EXCUSED', label: 'Excused', color: 'bg-gray-100 text-gray-600 border-gray-300' },
]

export default function StaffAttendancePage() {
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [selectedOffering, setSelectedOffering] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<Student[]>([])
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [existing, setExisting] = useState<AttendanceRecord[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/staff/my-offerings').then(r => r.json()).then(data => {
      setOfferings(data ?? [])
      if (data?.[0]) setSelectedOffering(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedOffering) return
    setLoading(true)
    Promise.all([
      fetch(`/api/staff/attendance/students?courseOfferingId=${selectedOffering}`).then(r => r.json()),
      fetch(`/api/staff/attendance?courseOfferingId=${selectedOffering}&date=${date}`).then(r => r.json()),
    ]).then(([studs, att]) => {
      setStudents(studs ?? [])
      const rec: AttendanceRecord[] = att ?? []
      setExisting(rec)
      const init: Record<string, AttendanceStatus> = {}
      studs?.forEach((s: Student) => {
        const found = rec.find((r: AttendanceRecord) => r.studentId === s.id)
        init[s.id] = found?.status ?? 'PRESENT'
      })
      setStatuses(init)
      setLoading(false)
      setSaved(false)
    })
  }, [selectedOffering, date])

  function markAll(status: AttendanceStatus) {
    setStatuses(prev => Object.fromEntries(Object.keys(prev).map(id => [id, status])))
  }

  async function save() {
    setSaving(true)
    await fetch('/api/staff/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseOfferingId: selectedOffering,
        date,
        records: Object.entries(statuses).map(([studentId, status]) => ({ studentId, status })),
      }),
    })
    setSaving(false)
    setSaved(true)
  }

  const summary = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 }
  Object.values(statuses).forEach(s => summary[s]++)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-48">
          <label className="text-xs font-medium text-gray-500 block mb-1">Course</label>
          <div className="relative">
            <select
              value={selectedOffering}
              onChange={e => setSelectedOffering(e.target.value)}
              className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {offerings.map(o => (
                <option key={o.id} value={o.id}>{o.course.code} — {o.course.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => markAll('PRESENT')} className="px-3 py-2 text-xs bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors font-medium">All Present</button>
          <button onClick={() => markAll('ABSENT')} className="px-3 py-2 text-xs bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors font-medium">All Absent</button>
        </div>
      </div>

      {/* Summary */}
      {students.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {STATUS_OPTS.map(({ value, label, color }) => (
            <div key={value} className={`rounded-xl border px-4 py-3 text-center ${color}`}>
              <p className="text-2xl font-bold">{summary[value]}</p>
              <p className="text-xs font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Student list */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">{students.length} students</h2>
          {existing.length > 0 && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Editing saved record</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No enrolled students for this course.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {students.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                  {s.firstName[0]}{s.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-gray-400">{s.email}</p>
                </div>
                <div className="flex gap-1.5">
                  {STATUS_OPTS.map(({ value, label }) => {
                    const active = statuses[s.id] === value
                    return (
                      <button
                        key={value}
                        onClick={() => setStatuses(p => ({ ...p, [s.id]: value }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          active
                            ? value === 'PRESENT' ? 'bg-green-600 text-white border-green-600'
                            : value === 'ABSENT' ? 'bg-red-600 text-white border-red-600'
                            : value === 'LATE' ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-gray-600 text-white border-gray-600'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {value === 'PRESENT' ? <Check className="w-3.5 h-3.5" /> : value === 'ABSENT' ? <X className="w-3.5 h-3.5" /> : value === 'LATE' ? <Clock className="w-3.5 h-3.5" /> : label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {students.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Attendance'}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium flex items-center gap-1"><Check className="w-4 h-4" /> Saved</span>}
        </div>
      )}
    </div>
  )
}
