'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Clock, Send, ChevronRight, Scale } from 'lucide-react'
import Link from 'next/link'

type Appeal = {
  id: string
  courseCode: string
  courseTitle: string
  totalScore: number | null
  letterGrade: string | null
  reason: string
  status: string
  adminResponse: string | null
  createdAt: string
}

type GradeOption = {
  gradeId: string
  courseCode: string
  courseTitle: string
  totalScore: number | null
  letterGrade: string | null
  hasAppeal: boolean
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:      'bg-yellow-50 text-yellow-700 border-yellow-100',
  UNDER_REVIEW: 'bg-blue-50 text-blue-700 border-blue-100',
  RESOLVED:     'bg-green-50 text-green-700 border-green-100',
  REJECTED:     'bg-gray-100 text-gray-500 border-gray-200',
}
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending', UNDER_REVIEW: 'Under Review', RESOLVED: 'Resolved', REJECTED: 'Rejected',
}

export default function GradeAppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [grades, setGrades] = useState<GradeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState('')
  const [reason, setReason] = useState('')
  const [supporting, setSupporting] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function load() {
    const [a, g] = await Promise.all([
      fetch('/api/student/grade-appeals').then(r => r.json()),
      fetch('/api/student/grade-appeals/grades').then(r => r.json()),
    ])
    setAppeals(Array.isArray(a) ? a : [])
    setGrades(Array.isArray(g) ? g : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedGrade || !reason.trim()) {
      setError('Please select a course and provide a reason.')
      return
    }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/student/grade-appeals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gradeId: selectedGrade, reason: reason.trim(), supportingInfo: supporting.trim() }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to submit appeal.')
      setSubmitting(false)
      return
    }
    setSuccess(true)
    setShowForm(false)
    setReason('')
    setSupporting('')
    setSelectedGrade('')
    load()
    setSubmitting(false)
  }

  const appealableGrades = grades.filter(g => !g.hasAppeal && g.letterGrade)

  if (loading) {
    return <div className="flex items-center justify-center min-h-[300px]"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grade Appeals</h1>
          <p className="text-sm text-gray-500 mt-1">Dispute a grade if you believe it was recorded incorrectly</p>
        </div>
        <Link href="/student/grades" className="text-sm text-blue-600 hover:underline">Back to grades</Link>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Appeal submitted. Your admin will review it shortly.
        </div>
      )}

      {/* Submit new appeal */}
      {!showForm ? (
        <button
          onClick={() => { setShowForm(true); setSuccess(false) }}
          disabled={appealableGrades.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Scale className="w-4 h-4" />
          Submit a Grade Appeal
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">New Grade Appeal</h2>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Select course</label>
            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a course...</option>
              {appealableGrades.map(g => (
                <option key={g.gradeId} value={g.gradeId}>
                  {g.courseCode} — {g.courseTitle} (Grade: {g.letterGrade}, Score: {g.totalScore ?? 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Reason for appeal <span className="text-red-400">*</span></label>
            <textarea
              rows={4}
              placeholder="Explain clearly why you believe your grade is incorrect..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Supporting information <span className="text-gray-400">(optional)</span></label>
            <textarea
              rows={2}
              placeholder="e.g. reference to exam answer sheet, assignment submission proof..."
              value={supporting}
              onChange={e => setSupporting(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit appeal'}
            </button>
          </div>
        </form>
      )}

      {/* Existing appeals */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900 text-sm">Your Appeals ({appeals.length})</h2>
        {appeals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Scale className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No appeals submitted yet.</p>
          </div>
        ) : (
          appeals.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{a.courseCode} — {a.courseTitle}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Score: {a.totalScore ?? 'N/A'} · Grade: {a.letterGrade ?? '—'} ·
                    Submitted {new Date(a.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[a.status] ?? ''}`}>
                  {STATUS_LABELS[a.status] ?? a.status}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Your reason</p>
                <p className="text-sm text-gray-700 leading-relaxed">{a.reason}</p>
              </div>
              {a.adminResponse && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-blue-600 mb-1">Admin response</p>
                  <p className="text-sm text-blue-900 leading-relaxed">{a.adminResponse}</p>
                </div>
              )}
              {a.status === 'PENDING' && (
                <div className="flex items-center gap-1.5 text-xs text-yellow-600">
                  <Clock className="w-3.5 h-3.5" />
                  Awaiting review by your academic office
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
