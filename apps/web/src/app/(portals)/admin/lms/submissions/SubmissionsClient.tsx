'use client'

import { useState } from 'react'
import {
  CheckCircle2, Clock, AlertTriangle, RotateCcw, Brain,
  ChevronDown, ChevronUp, Loader2, Star, Shield, X,
} from 'lucide-react'

interface Student { id: string; firstName: string; lastName: string; email: string }
interface AssignmentRef { id: string; title: string; courseCode: string; courseTitle: string }

interface Submission {
  id: string
  studentId: string
  status: string
  content: string | null
  fileUrl: string | null
  fileName: string | null
  score: number | null
  feedback: string | null
  aiFeedback: string | null
  plagiarismScore: number | null
  submittedAt: string | null
  gradedAt: string | null
  assignment: {
    id: string
    title: string
    maxScore: number
    dueDate: string
    courseOffering: { course: { code: string; title: string } }
  }
}

interface Props {
  submissions: Submission[]
  studentMap: Record<string, Student>
  assignments: AssignmentRef[]
  stats: { submitted: number; graded: number; late: number; returned: number }
  activeAssignment: string | null
  activeStatus: string | null
  basePath?: string
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  SUBMITTED: { label: 'Pending',  cls: 'bg-blue-50 text-blue-700' },
  GRADED:    { label: 'Graded',   cls: 'bg-blue-100 text-blue-800' },
  LATE:      { label: 'Late',     cls: 'bg-gray-100 text-gray-600' },
  RETURNED:  { label: 'Returned', cls: 'bg-gray-100 text-gray-500' },
}

function plagiarismColor(score: number | null) {
  if (score === null) return 'text-gray-400'
  if (score >= 70) return 'text-red-600 font-semibold'
  if (score >= 40) return 'text-amber-600 font-semibold'
  return 'text-blue-600'
}

export function SubmissionsClient({ submissions, studentMap, assignments, stats, activeAssignment, activeStatus, basePath = '/admin/lms/submissions' }: Props) {
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [scores, setScores]       = useState<Record<string, string>>({})
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({})
  const [loading, setLoading]     = useState<Record<string, boolean>>({})
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({})
  const [plagLoading, setPlagLoading] = useState<Record<string, boolean>>({})
  const [localSubs, setLocalSubs] = useState<Submission[]>(submissions)

  async function handleGrade(subId: string, maxScore: number) {
    const score = parseFloat(scores[subId] ?? '')
    if (isNaN(score) || score < 0 || score > maxScore) return
    setLoading(l => ({ ...l, [subId]: true }))
    const res = await fetch(`/api/lms/submissions/${subId}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, feedback: feedbacks[subId] ?? '' }),
    })
    setLoading(l => ({ ...l, [subId]: false }))
    if (res.ok) {
      setLocalSubs(prev => prev.map(s => s.id === subId
        ? { ...s, status: 'GRADED', score, feedback: feedbacks[subId] ?? null, gradedAt: new Date().toISOString() }
        : s
      ))
    }
  }

  async function handleAiFeedback(subId: string) {
    const sub = localSubs.find(s => s.id === subId)
    if (!sub?.content) return
    setAiLoading(l => ({ ...l, [subId]: true }))
    const res = await fetch(`/api/lms/submissions/${subId}/ai-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: sub.content, assignmentTitle: sub.assignment.title }),
    })
    setAiLoading(l => ({ ...l, [subId]: false }))
    if (res.ok) {
      const { feedback } = await res.json()
      setLocalSubs(prev => prev.map(s => s.id === subId ? { ...s, aiFeedback: feedback } : s))
      setFeedbacks(f => ({ ...f, [subId]: f[subId] || feedback }))
    }
  }

  async function handlePlagiarism(subId: string) {
    setPlagLoading(l => ({ ...l, [subId]: true }))
    const res = await fetch(`/api/lms/submissions/${subId}/plagiarism`, { method: 'POST' })
    setPlagLoading(l => ({ ...l, [subId]: false }))
    if (res.ok) {
      const { score } = await res.json()
      setLocalSubs(prev => prev.map(s => s.id === subId ? { ...s, plagiarismScore: score } : s))
    }
  }

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending Review', value: stats.submitted, icon: Clock,         cls: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Graded',         value: stats.graded,    icon: CheckCircle2,  cls: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Late',           value: stats.late,      icon: AlertTriangle, cls: 'text-gray-600', bg: 'bg-gray-100' },
          { label: 'Returned',       value: stats.returned,  icon: RotateCcw,     cls: 'text-gray-500', bg: 'bg-gray-100' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.cls}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Filter by status:</span>
        {['All', 'SUBMITTED', 'GRADED', 'LATE', 'RETURNED'].map(st => (
          <a
            key={st}
            href={st === 'All' ? basePath : `${basePath}?status=${st}`}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              (st === 'All' && !activeStatus) || st === activeStatus
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {st === 'All' ? 'All' : STATUS_META[st]?.label ?? st}
          </a>
        ))}
      </div>

      {/* Submission list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">Submissions</h2>
          <span className="text-xs text-gray-400">{localSubs.length} total</span>
        </div>

        {localSubs.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-500">No submissions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {localSubs.map(sub => {
              const student   = studentMap[sub.studentId]
              const isOpen    = expanded === sub.id
              const meta      = STATUS_META[sub.status]
              const initials  = `${student?.firstName?.[0] ?? '?'}${student?.lastName?.[0] ?? ''}`

              return (
                <div key={sub.id} className="transition-colors">
                  {/* Row */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : sub.id)}
                    className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/50 text-left transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>

                    {/* Student + assignment */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {student ? `${student.firstName} ${student.lastName}` : sub.studentId}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{sub.assignment.title} · {sub.assignment.courseOffering.course.code}</p>
                    </div>

                    {/* Plagiarism */}
                    {sub.plagiarismScore !== null && (
                      <span className={`text-xs flex-shrink-0 flex items-center gap-1 ${plagiarismColor(sub.plagiarismScore)}`}>
                        <Shield className="w-3 h-3" />
                        {sub.plagiarismScore.toFixed(0)}%
                      </span>
                    )}

                    {/* Score */}
                    {sub.score !== null && (
                      <span className="text-xs font-bold text-blue-700 flex-shrink-0">
                        {sub.score}/{sub.assignment.maxScore}
                      </span>
                    )}

                    {/* Status */}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${meta?.cls ?? 'bg-gray-100 text-gray-500'}`}>
                      {meta?.label ?? sub.status}
                    </span>

                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </button>

                  {/* Expanded grading panel */}
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 bg-gray-50/40 border-t border-gray-100">
                      <div className="grid lg:grid-cols-2 gap-6 mt-4">

                        {/* Left: submission content */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Submission</p>
                          {sub.content ? (
                            <div className="bg-white border border-gray-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed max-h-52 overflow-y-auto whitespace-pre-wrap">
                              {sub.content}
                            </div>
                          ) : sub.fileUrl ? (
                            <a href={sub.fileUrl} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline bg-white border border-gray-100 rounded-xl px-4 py-3">
                              📎 {sub.fileName ?? 'View submitted file'}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No content submitted</p>
                          )}

                          {/* AI feedback box */}
                          {sub.aiFeedback && (
                            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Brain className="w-3.5 h-3.5 text-blue-500" />
                                <p className="text-xs font-semibold text-blue-700">AI Feedback</p>
                              </div>
                              <p className="text-xs text-blue-800 leading-relaxed whitespace-pre-wrap">{sub.aiFeedback}</p>
                            </div>
                          )}

                          {/* Plagiarism result */}
                          {sub.plagiarismScore !== null && (
                            <div className={`mt-3 rounded-xl p-3 border flex items-center gap-2 ${
                              sub.plagiarismScore >= 70 ? 'bg-red-50 border-red-100' :
                              sub.plagiarismScore >= 40 ? 'bg-amber-50 border-amber-100' :
                              'bg-blue-50 border-blue-100'
                            }`}>
                              <Shield className={`w-4 h-4 flex-shrink-0 ${plagiarismColor(sub.plagiarismScore)}`} />
                              <div>
                                <p className={`text-xs font-semibold ${plagiarismColor(sub.plagiarismScore)}`}>
                                  {sub.plagiarismScore >= 70 ? 'High similarity detected' :
                                   sub.plagiarismScore >= 40 ? 'Moderate similarity' : 'Low similarity'} — {sub.plagiarismScore.toFixed(1)}%
                                </p>
                                <p className="text-xs text-gray-500">Compared against all submissions for this assignment</p>
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 mt-4">
                            {sub.content && (
                              <button
                                onClick={() => handleAiFeedback(sub.id)}
                                disabled={aiLoading[sub.id]}
                                className="flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
                              >
                                {aiLoading[sub.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                                {sub.aiFeedback ? 'Regenerate AI feedback' : 'Get AI feedback'}
                              </button>
                            )}
                            {sub.content && (
                              <button
                                onClick={() => handlePlagiarism(sub.id)}
                                disabled={plagLoading[sub.id]}
                                className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
                              >
                                {plagLoading[sub.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                                {sub.plagiarismScore !== null ? 'Re-check' : 'Check plagiarism'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Right: grading form */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Grade</p>

                          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
                            {/* Score */}
                            <div>
                              <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                Score <span className="text-gray-400 font-normal">(out of {sub.assignment.maxScore})</span>
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={sub.assignment.maxScore}
                                  step={0.5}
                                  defaultValue={sub.score ?? ''}
                                  onChange={e => setScores(s => ({ ...s, [sub.id]: e.target.value }))}
                                  placeholder={`0 – ${sub.assignment.maxScore}`}
                                  className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <div className="flex gap-1">
                                  {[25, 50, 75, 100].map(pct => (
                                    <button
                                      key={pct}
                                      onClick={() => {
                                        const val = ((sub.assignment.maxScore * pct) / 100).toString()
                                        setScores(s => ({ ...s, [sub.id]: val }))
                                      }}
                                      className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-500 px-2 py-1.5 rounded-lg transition-colors font-medium"
                                    >
                                      {pct}%
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Feedback */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-medium text-gray-600">Feedback</label>
                                {sub.aiFeedback && !feedbacks[sub.id] && (
                                  <button
                                    onClick={() => setFeedbacks(f => ({ ...f, [sub.id]: sub.aiFeedback! }))}
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <Brain className="w-3 h-3" /> Use AI feedback
                                  </button>
                                )}
                              </div>
                              <textarea
                                rows={4}
                                defaultValue={sub.feedback ?? ''}
                                value={feedbacks[sub.id] ?? sub.feedback ?? ''}
                                onChange={e => setFeedbacks(f => ({ ...f, [sub.id]: e.target.value }))}
                                placeholder="Write your feedback to the student…"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              />
                            </div>

                            {/* Submit */}
                            <button
                              onClick={() => handleGrade(sub.id, sub.assignment.maxScore)}
                              disabled={loading[sub.id]}
                              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                            >
                              {loading[sub.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                              {sub.status === 'GRADED' ? 'Update Grade' : 'Submit Grade'}
                            </button>

                            {sub.gradedAt && (
                              <p className="text-xs text-center text-gray-400">
                                Graded {new Date(sub.gradedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
