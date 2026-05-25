'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react'

type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER'

interface Question {
  id?: string
  type: QuestionType
  question: string
  options: string[]
  correctAnswer: string
  points: number
  explanation: string
}

interface Quiz {
  id: string
  title: string
  description: string | null
  durationMins: number | null
  maxAttempts: number
  passMark: number
  isPublished: boolean
  _count: { questions: number; attempts: number }
}

const EMPTY_QUESTION: Question = {
  type: 'MCQ',
  question: '',
  options: ['', '', '', ''],
  correctAnswer: '0',
  points: 1,
  explanation: '',
}

export default function StaffQuizzesPage() {
  const { offeringId } = useParams<{ offeringId: string }>()
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState('')
  const [passMark, setPassMark] = useState('50')
  const [maxAttempts, setMaxAttempts] = useState('1')
  const [saving, setSaving] = useState(false)
  const [newQuizId, setNewQuizId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([{ ...EMPTY_QUESTION }])
  const [expanded, setExpanded] = useState<number>(0)

  useEffect(() => {
    fetch(`/api/lms/quizzes?courseOfferingId=${offeringId}`)
      .then(r => r.json()).then(setQuizzes)
  }, [offeringId])

  async function createQuiz(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/lms/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseOfferingId: offeringId,
        title,
        durationMins: duration ? parseInt(duration) : null,
        passMark: parseFloat(passMark),
        maxAttempts: parseInt(maxAttempts),
      }),
    })
    const quiz = await res.json()
    setNewQuizId(quiz.id)
    setSaving(false)
  }

  async function addQuestion(idx: number) {
    const q = questions[idx]
    if (!q.question.trim()) return
    await fetch(`/api/lms/quizzes/${newQuizId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: q.type,
        question: q.question,
        options: q.type === 'SHORT_ANSWER' ? null : q.options.filter(Boolean),
        correctAnswer: q.correctAnswer,
        points: q.points,
        explanation: q.explanation || null,
        order: idx,
      }),
    })
  }

  async function saveAllAndPublish() {
    setSaving(true)
    for (let i = 0; i < questions.length; i++) {
      await addQuestion(i)
    }
    await fetch(`/api/lms/quizzes/${newQuizId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: true }),
    })
    setSaving(false)
    router.refresh()
    setCreating(false)
    setNewQuizId(null)
    setQuestions([{ ...EMPTY_QUESTION }])
    setTitle('')
    const updated = await fetch(`/api/lms/quizzes?courseOfferingId=${offeringId}`).then(r => r.json())
    setQuizzes(updated)
  }

  async function togglePublish(quiz: Quiz) {
    await fetch(`/api/lms/quizzes/${quiz.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !quiz.isPublished }),
    })
    setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, isPublished: !q.isPublished } : q))
  }

  async function deleteQuiz(id: string) {
    if (!confirm('Delete this quiz?')) return
    await fetch(`/api/lms/quizzes/${id}`, { method: 'DELETE' })
    setQuizzes(prev => prev.filter(q => q.id !== id))
  }

  function updateQuestion(idx: number, patch: Partial<Question>) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...patch } : q))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Quizzes</h2>
        {!creating && (
          <button onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> New Quiz
          </button>
        )}
      </div>

      {/* Existing quizzes */}
      <div className="space-y-3">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{quiz.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${quiz.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {quiz.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {quiz._count.questions} questions · {quiz._count.attempts} attempts
                {quiz.durationMins ? ` · ${quiz.durationMins} min` : ' · Untimed'}
                {` · Pass mark: ${quiz.passMark}%`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => togglePublish(quiz)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={quiz.isPublished ? 'Unpublish' : 'Publish'}>
                {quiz.isPublished ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
              </button>
              <button onClick={() => deleteQuiz(quiz.id)}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create quiz form */}
      {creating && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          {!newQuizId ? (
            <form onSubmit={createQuiz} className="space-y-4">
              <h3 className="font-semibold text-gray-900">Quiz Details</h3>
              <div>
                <label className="text-sm font-medium text-gray-700">Quiz Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Week 3 Quiz — Control Structures" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Duration (mins)</label>
                  <input value={duration} onChange={e => setDuration(e.target.value)} type="number" min="1"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Leave blank for untimed" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Pass Mark (%)</label>
                  <input value={passMark} onChange={e => setPassMark(e.target.value)} type="number" min="0" max="100"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Max Attempts</label>
                  <input value={maxAttempts} onChange={e => setMaxAttempts(e.target.value)} type="number" min="1"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving || !title.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Creating…' : 'Next: Add Questions →'}
                </button>
                <button type="button" onClick={() => setCreating(false)}
                  className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Add Questions</h3>
                <button onClick={() => setQuestions(prev => [...prev, { ...EMPTY_QUESTION }])}
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>

              {questions.map((q, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setExpanded(expanded === idx ? -1 : idx)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700">
                    <span>Q{idx + 1}: {q.question.slice(0, 60) || 'Untitled question'}</span>
                    {expanded === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {expanded === idx && (
                    <div className="p-4 space-y-4">
                      {/* Type */}
                      <div className="flex gap-3">
                        {(['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER'] as QuestionType[]).map(t => (
                          <button key={t} onClick={() => updateQuestion(idx, { type: t, correctAnswer: t === 'TRUE_FALSE' ? 'true' : t === 'MCQ' ? '0' : '' })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${q.type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            {t === 'MCQ' ? 'Multiple Choice' : t === 'TRUE_FALSE' ? 'True / False' : 'Short Answer'}
                          </button>
                        ))}
                      </div>

                      {/* Question text */}
                      <textarea value={q.question} onChange={e => updateQuestion(idx, { question: e.target.value })}
                        placeholder="Enter question…" rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />

                      {/* MCQ options */}
                      {q.type === 'MCQ' && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500">Options (select the correct one)</p>
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <input type="radio" name={`correct-${idx}`} checked={q.correctAnswer === String(oi)}
                                onChange={() => updateQuestion(idx, { correctAnswer: String(oi) })}
                                className="text-indigo-600" />
                              <input value={opt} onChange={e => {
                                const opts = [...q.options]; opts[oi] = e.target.value
                                updateQuestion(idx, { options: opts })
                              }}
                                placeholder={`Option ${oi + 1}`}
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* True/False */}
                      {q.type === 'TRUE_FALSE' && (
                        <div className="flex gap-4">
                          {['true', 'false'].map(v => (
                            <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="radio" name={`tf-${idx}`} value={v} checked={q.correctAnswer === v}
                                onChange={() => updateQuestion(idx, { correctAnswer: v })} className="text-indigo-600" />
                              {v === 'true' ? 'True' : 'False'}
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Short answer */}
                      {q.type === 'SHORT_ANSWER' && (
                        <input value={q.correctAnswer} onChange={e => updateQuestion(idx, { correctAnswer: e.target.value })}
                          placeholder="Correct answer (exact match)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      )}

                      {/* Points + Explanation */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Points</label>
                          <input type="number" min="0.5" step="0.5" value={q.points}
                            onChange={e => updateQuestion(idx, { points: parseFloat(e.target.value) })}
                            className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Explanation (optional)</label>
                          <input value={q.explanation} onChange={e => updateQuestion(idx, { explanation: e.target.value })}
                            placeholder="Shown after submission"
                            className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                      </div>

                      {questions.length > 1 && (
                        <button onClick={() => setQuestions(prev => prev.filter((_, i) => i !== idx))}
                          className="text-xs text-red-500 hover:underline flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Remove question
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex items-center gap-3 pt-2">
                <button onClick={saveAllAndPublish} disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
                  <CheckCircle className="w-4 h-4" />
                  {saving ? 'Saving…' : 'Save & Publish Quiz'}
                </button>
                <button onClick={() => { setCreating(false); setNewQuizId(null) }}
                  className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {questions.length} question{questions.length !== 1 ? 's' : ''} added
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
