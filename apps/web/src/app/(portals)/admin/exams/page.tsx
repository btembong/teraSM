'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, MapPin, Clock, BookOpen, UserPlus, Trash2, Loader2, Plus, X } from 'lucide-react'

function fmt12(time: string) {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

type Invigilator = { id: string; teacherId: string; isPrimary: boolean; teacher: { id: string; firstName: string; lastName: string } }
type Exam = {
  id: string
  title: string
  examDate: string
  startTime: string
  endTime: string
  venue: string | null
  totalMarks: number
  notes: string | null
  courseOffering: { course: { code: string; title: string } }
  invigilations: Invigilator[]
}
type Offering = { id: string; course: { code: string; title: string } }
type Teacher = { id: string; firstName: string; lastName: string }

const BLANK = { courseOfferingId: '', title: '', examDate: '', startTime: '', endTime: '', venue: '', totalMarks: '100', notes: '' }

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [submitting, setSubmitting] = useState(false)

  // Per-exam invigilator assignment
  const [assignExamId, setAssignExamId] = useState<string | null>(null)
  const [assignTeacherId, setAssignTeacherId] = useState('')
  const [assignPrimary, setAssignPrimary] = useState(false)
  const [assigning, setAssigning] = useState(false)

  async function load() {
    setLoading(true)
    const [exRes, ofRes, tcRes] = await Promise.all([
      fetch('/api/admin/exams'),
      fetch('/api/academics/offerings'),
      fetch('/api/academics/teachers'),
    ])
    if (exRes.ok) setExams(await exRes.json())
    if (ofRes.ok) { const d = await ofRes.json(); setOfferings(Array.isArray(d) ? d : d.offerings ?? []) }
    if (tcRes.ok) setTeachers(await tcRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function createExam(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/admin/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { setForm(BLANK); setShowForm(false); await load() }
    setSubmitting(false)
  }

  async function deleteExam(id: string) {
    if (!confirm('Delete this exam schedule?')) return
    await fetch(`/api/admin/exams/${id}`, { method: 'DELETE' })
    await load()
  }

  async function assignInvigilator(examId: string) {
    if (!assignTeacherId) return
    setAssigning(true)
    await fetch(`/api/admin/exams/${examId}/invigilators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: assignTeacherId, isPrimary: assignPrimary }),
    })
    setAssignTeacherId('')
    setAssignPrimary(false)
    setAssignExamId(null)
    await load()
    setAssigning(false)
  }

  async function removeInvigilator(examId: string, teacherId: string) {
    await fetch(`/api/admin/exams/${examId}/invigilators`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId }),
    })
    await load()
  }

  const upcoming = exams.filter(e => new Date(e.examDate) >= new Date())
  const past = exams.filter(e => new Date(e.examDate) < new Date())

  function ExamCard({ exam }: { exam: Exam }) {
    const date = new Date(exam.examDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    const isAssigning = assignExamId === exam.id

    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="font-semibold text-gray-900">{exam.title}</p>
                <p className="text-sm text-gray-500">{exam.courseOffering.course.code} — {exam.courseOffering.course.title}</p>
              </div>
              <button onClick={() => deleteExam(exam.id)} className="text-gray-300 hover:text-red-400 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fmt12(exam.startTime)} – {fmt12(exam.endTime)}</span>
              {exam.venue && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{exam.venue}</span>}
              <span className="font-medium text-gray-700">{exam.totalMarks} marks</span>
            </div>
            {exam.notes && <p className="text-xs text-gray-400 italic mt-1">{exam.notes}</p>}
          </div>
        </div>

        {/* Invigilators */}
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invigilators</p>
            <button
              onClick={() => setAssignExamId(isAssigning ? null : exam.id)}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Assign
            </button>
          </div>

          {exam.invigilations.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No invigilators assigned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {exam.invigilations.map(inv => (
                <span key={inv.id} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${inv.isPrimary ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                  {inv.teacher.firstName} {inv.teacher.lastName}
                  {inv.isPrimary && <span className="text-[10px]">(Primary)</span>}
                  <button onClick={() => removeInvigilator(exam.id, inv.teacherId)} className="ml-1 opacity-50 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {isAssigning && (
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <select
                value={assignTeacherId}
                onChange={e => setAssignTeacherId(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Select teacher…</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignPrimary}
                  onChange={e => setAssignPrimary(e.target.checked)}
                  className="rounded"
                />
                Primary
              </label>
              <button
                onClick={() => assignInvigilator(exam.id)}
                disabled={!assignTeacherId || assigning}
                className="flex items-center gap-1 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {assigning && <Loader2 className="w-3 h-3 animate-spin" />}
                Assign
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Exam Schedule</h2>
          <p className="text-sm text-slate-400 mt-0.5">Create exams and assign invigilators</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          Schedule Exam
        </button>
      </div>

      {showForm && (
        <form onSubmit={createExam} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">New Exam</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Course Offering</label>
              <select
                required
                value={form.courseOfferingId}
                onChange={e => setForm(f => ({ ...f, courseOfferingId: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Select course…</option>
                {offerings.map(o => (
                  <option key={o.id} value={o.id}>{o.course.code} — {o.course.title}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Exam Title</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Final Examination"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                required
                type="date"
                value={form.examDate}
                onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Total Marks</label>
              <input
                required
                type="number"
                value={form.totalMarks}
                onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
              <input
                required
                type="time"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
              <input
                required
                type="time"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Venue (optional)</label>
              <input
                value={form.venue}
                onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                placeholder="e.g. Hall A, Room 201"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any special instructions…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Exam
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
      ) : exams.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No exams scheduled yet.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Upcoming ({upcoming.length})
              </h2>
              {upcoming.map(e => <ExamCard key={e.id} exam={e} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                Past ({past.length})
              </h2>
              <div className="opacity-60 space-y-3">
                {past.map(e => <ExamCard key={e.id} exam={e} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
