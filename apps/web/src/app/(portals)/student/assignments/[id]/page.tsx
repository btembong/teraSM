'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Save, Clock, CheckCircle } from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description?: string
  instructions?: string
  maxScore: number
  dueDate: string
  allowLate: boolean
}

interface Submission {
  id: string
  status: string
  content?: string
  score?: number
  feedback?: string
  aiFeedback?: string
  submittedAt?: string
}

export default function AssignmentSubmissionPage() {
  const params = useParams()
  const id = params.id as string

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch(`/api/lms/assignments/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAssignment(data.assignment)
        setSubmission(data.submission)
        if (data.submission?.content) setContent(data.submission.content)
      })
  }, [id])

  const save = async (submit = false) => {
    if (submit) setSubmitting(true)
    else setSaving(true)
    setMessage('')

    const res = await fetch('/api/lms/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignmentId: id, content, isDraft: !submit }),
    })

    if (res.ok) {
      const data = await res.json()
      setSubmission(data)
      setMessage(submit ? 'Submitted successfully!' : 'Draft saved.')
    } else {
      setMessage('Something went wrong. Please try again.')
    }

    setSaving(false)
    setSubmitting(false)
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">Loading...</div>
    )
  }

  const isOverdue = new Date(assignment.dueDate) < new Date()
  const isGraded = submission?.status === 'GRADED' || submission?.status === 'RETURNED'
  const isSubmitted = submission?.status === 'SUBMITTED' || submission?.status === 'LATE'
  const canSubmit = !isSubmitted && !isGraded && (assignment.allowLate || !isOverdue)

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/student/assignments" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          <p className={`text-sm flex items-center gap-1 ${isOverdue ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
            <Clock className="w-3 h-3" />
            Due {new Date(assignment.dueDate).toLocaleDateString()} · {assignment.maxScore} points
          </p>
        </div>
      </div>

      {/* Instructions */}
      {(assignment.description || assignment.instructions) && (
        <div className="bg-blue-50 rounded-2xl p-5">
          {assignment.description && <p className="text-blue-900 font-medium mb-2">{assignment.description}</p>}
          {assignment.instructions && (
            <p className="text-blue-800 text-sm whitespace-pre-wrap">{assignment.instructions}</p>
          )}
        </div>
      )}

      {/* Grade result */}
      {isGraded && submission && (
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <p className="font-semibold text-blue-900">Graded</p>
            {submission.score != null && (
              <span className="ml-auto text-lg font-bold text-blue-700">
                {submission.score} / {assignment.maxScore}
              </span>
            )}
          </div>
          {submission.feedback && (
            <div className="mt-3">
              <p className="text-sm font-medium text-blue-800 mb-1">Teacher Feedback</p>
              <p className="text-sm text-blue-700 whitespace-pre-wrap">{submission.feedback}</p>
            </div>
          )}
          {submission.aiFeedback && (
            <div className="mt-3 bg-white/60 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">AI Feedback</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.aiFeedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Submission form */}
      {!isGraded && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Your Answer</h2>

          {isSubmitted ? (
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-800 mb-1">Submitted</p>
                <p className="text-sm text-blue-700 whitespace-pre-wrap">{submission?.content}</p>
              </div>
              <p className="text-xs text-gray-400">
                Submitted {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleString() : ''}
              </p>
            </div>
          ) : (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your answer here..."
                rows={10}
                disabled={!canSubmit}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
              />

              {!canSubmit && isOverdue && !assignment.allowLate && (
                <p className="text-sm text-gray-500 mt-2">This assignment is past due and late submissions are not allowed.</p>
              )}

              {canSubmit && (
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => save(false)}
                    disabled={saving || !content.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : 'Save Draft'}
                  </button>
                  <button
                    onClick={() => save(true)}
                    disabled={submitting || !content.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Submitting…' : 'Submit Assignment'}
                  </button>
                </div>
              )}
            </>
          )}

          {message && (
            <p className={`text-sm mt-3 ${message.includes('wrong') ? 'text-gray-900 font-medium' : 'text-blue-600'}`}>
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
