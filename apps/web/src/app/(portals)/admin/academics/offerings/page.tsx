'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  BookOpen, Plus, Building2, AlertCircle, X, Pencil,
  Save, Loader2, ChevronDown, CheckCircle2,
} from 'lucide-react'

type Offering = {
  id: string
  courseId: string
  courseCode: string
  courseTitle: string
  creditHours: number
  department: string
  departmentCode: string
  teacherId: string
  teacherName: string
  maxStudents: number
  room: string | null
  schedule: string | null
  enrolled: number
}

type Course   = { id: string; code: string; title: string; department: { name: string } }
type Teacher  = { id: string; name: string | null; email: string }
type Semester = { id: string; name: string; academicYear: { name: string } }

type Data = {
  semester: { id: string; name: string; academicYear: string } | null
  offerings: Offering[]
}

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const lbl = 'block text-xs font-medium text-gray-600 mb-1'

// ── Edit Offering Modal ───────────────────────────────────────────────────────
function EditModal({ offering, teachers, onSave, onClose }: {
  offering: Offering
  teachers: Teacher[]
  onSave: (updated: Offering) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    teacherId:   offering.teacherId,
    maxStudents: offering.maxStudents,
    room:        offering.room ?? '',
    schedule:    offering.schedule ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')

  async function save() {
    setSaving(true); setErr('')
    try {
      const res  = await fetch(`/api/academics/offerings/${offering.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId:   form.teacherId || null,
          maxStudents: form.maxStudents,
          room:        form.room || null,
          schedule:    form.schedule || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Save failed.'); return }
      onSave(data)
      onClose()
    } catch {
      setErr('Network error.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Edit Offering</h3>
            <p className="text-xs text-gray-400 mt-0.5">{offering.courseCode} — {offering.courseTitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={lbl}>Assigned Teacher</label>
              <select className={inp} value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
                <option value="">— Unassigned —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name ?? t.email}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Max Students</label>
              <input type="number" min={1} className={inp} value={form.maxStudents}
                onChange={e => setForm(f => ({ ...f, maxStudents: parseInt(e.target.value) || 1 }))} />
            </div>
            <div>
              <label className={lbl}>Room</label>
              <input className={inp} placeholder="e.g. Block A, Room 201" value={form.room}
                onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Schedule</label>
              <input className={inp} placeholder="e.g. Mon/Wed 9:00–10:30am" value={form.schedule}
                onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} />
            </div>
          </div>

          {err && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{err}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CourseOfferingsPage() {
  const [data, setData]         = useState<Data | null>(null)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [semesterId, setSemesterId] = useState<string>('') // '' = active semester
  const [courses, setCourses]   = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [editOffering, setEditOffering] = useState<Offering | null>(null)
  const [form, setForm] = useState({ courseId: '', teacherId: '', maxStudents: 50, room: '', schedule: '' })

  const loadOfferings = useCallback(async (sid: string) => {
    setLoading(true)
    const url = sid ? `/api/academics/offerings?semesterId=${sid}` : '/api/academics/offerings'
    const res = await fetch(url).then(r => r.json())
    setData(res)
    setLoading(false)
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/academics/courses').then(r => r.json()),
      fetch('/api/academics/teachers').then(r => r.json()).catch(() => []),
      fetch('/api/academics/years/semesters').then(r => r.json()).catch(() => []),
    ]).then(([c, t, s]) => {
      setCourses(Array.isArray(c) ? c : [])
      setTeachers(Array.isArray(t) ? t : [])
      setSemesters(Array.isArray(s) ? s : [])
    })
    loadOfferings('')
  }, [loadOfferings])

  function handleSemesterChange(sid: string) {
    setSemesterId(sid)
    loadOfferings(sid)
    setShowForm(false)
  }

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch('/api/academics/offerings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, semesterId: semesterId || undefined }),
    })
    if (res.ok) {
      setForm({ courseId: '', teacherId: '', maxStudents: 50, room: '', schedule: '' })
      setShowForm(false)
      loadOfferings(semesterId)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to schedule course')
    }
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Remove this course offering? Enrolled students will be affected.')) return
    await fetch(`/api/academics/offerings/${id}`, { method: 'DELETE' })
    setData(prev => prev ? { ...prev, offerings: prev.offerings.filter(o => o.id !== id) } : prev)
  }

  function onOfferingUpdated(updated: Offering) {
    setData(prev => prev ? { ...prev, offerings: prev.offerings.map(o => o.id === updated.id ? updated : o) } : prev)
  }

  const scheduledCourseIds = new Set(data?.offerings.map(o => o.courseId) ?? [])
  const availableCourses   = courses.filter(c => !scheduledCourseIds.has(c.id))

  // Find the selected semester label for the header
  const activeSemLabel = semesterId
    ? semesters.find(s => s.id === semesterId)
    : null

  return (
    <div className="space-y-5">
      {/* Edit modal */}
      {editOffering && (
        <EditModal
          offering={editOffering}
          teachers={teachers}
          onSave={onOfferingUpdated}
          onClose={() => setEditOffering(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Course Offerings</h2>
          {data?.semester && (
            <p className="text-sm text-gray-400 mt-0.5">
              {data.semester.name} — {data.semester.academicYear}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Semester switcher */}
          {semesters.length > 0 && (
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                value={semesterId}
                onChange={e => handleSemesterChange(e.target.value)}
              >
                <option value="">Active Semester</option>
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.academicYear.name} — {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          )}
          <button
            onClick={() => { setShowForm(!showForm); setError('') }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Schedule Course
          </button>
        </div>
      </div>

      {/* No active semester warning */}
      {!loading && !data?.semester && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-gray-200 rounded-2xl">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-amber-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">No active semester</p>
            <p className="text-sm text-gray-500 mt-1">Launch a semester from Academic Calendar before scheduling courses.</p>
          </div>
          <a href="/admin/academics/calendar" className="text-sm text-blue-600 hover:underline font-medium">
            Go to Academic Calendar →
          </a>
        </div>
      )}

      {/* Add offering form */}
      {showForm && data?.semester && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Schedule a Course</h2>
          {error && <p className="text-sm text-red-600 mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>}
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Course *</label>
              <select required value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })} className={inp}>
                <option value="">Select course…</option>
                {availableCourses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
              </select>
              {availableCourses.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">All courses are already scheduled this semester.</p>
              )}
            </div>
            <div>
              <label className={lbl}>Assigned Teacher *</label>
              <select required value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })} className={inp}>
                <option value="">Select teacher…</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name ?? t.email}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Max Students</label>
              <input type="number" min={1} value={form.maxStudents} onChange={e => setForm({ ...form, maxStudents: Number(e.target.value) })} className={inp} />
            </div>
            <div>
              <label className={lbl}>Room (optional)</label>
              <input placeholder="e.g. Block A, Room 201" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} className={inp} />
            </div>
            <div className="md:col-span-2">
              <label className={lbl}>Schedule (optional)</label>
              <input placeholder="e.g. Mon/Wed 9:00–10:30am" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} className={inp} />
            </div>
            <div className="md:col-span-2 flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {saving ? 'Scheduling…' : 'Schedule Course'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError('') }} className="px-5 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Offerings table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : data?.semester && data.offerings.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No courses scheduled yet. Click "Schedule Course" to add one.</p>
        </div>
      ) : data?.semester && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Course</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dept</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Teacher</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Schedule</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Room</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Enrolled</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.offerings.map(o => {
                const fillPct = o.maxStudents > 0 ? Math.round((o.enrolled / o.maxStudents) * 100) : 0
                return (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{o.courseCode}</p>
                      <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{o.courseTitle}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <Building2 className="w-3 h-3" />{o.departmentCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">{o.teacherName}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{o.schedule ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{o.room ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-sm font-semibold ${fillPct >= 100 ? 'text-red-600' : 'text-gray-900'}`}>
                          {o.enrolled}/{o.maxStudents}
                        </span>
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${fillPct >= 100 ? 'bg-red-500' : fillPct >= 80 ? 'bg-yellow-400' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(fillPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditOffering(o)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(o.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove offering">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
