'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react'

type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER'

interface Question {
  id: string
  type: QuestionType
  question: string
  options: string[] | null
  points: number
  order: number
}

interface Quiz {
  id: string
  title: string
  description: string | null
  durationMins: number | null
  maxAttempts: number
  passMark: number
  showResultsAfter: boolean
  questions: Question[]
  _count: { attempts: number }
}

interface ScoredQuestion {
  id: string
  question: string
  correctAnswer: string
  explanation: string | null
  studentAnswer: string | null
  isCorrect: boolean
}

interface Result {
  score: number
  maxScore: number
  percentage: number
  isPassed: boolean
  questions?: ScoredQuestion[]
}

export default function StudentQuizPage() {
  const { id: quizId } = useParams<{ id: string }>()
  const router = useRouter()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [pastAttempts, setPastAttempts] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [secsLeft, setSecsLeft] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const startedAt = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/lms/quizzes/${quizId}`).then(r => r.json()),
      fetch(`/api/lms/quizzes/${quizId}/attempt`).then(r => r.json()),
    ]).then(([q, attempts]) => {
      setQuiz(q)
      setPastAttempts(Array.isArray(attempts) ? attempts.filter((a: any) => a.submittedAt).length : 0)
      setLoading(false)
    })
  }, [quizId])

  const submit = useCallback(async (currentAnswers: Record<string, string>) => {
    if (!quiz || submitting) return
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)

    const answerArray = quiz.questions.map(q => ({
      questionId: q.id,
      answer: currentAnswers[q.id] ?? '',
    }))

    const elapsed = startedAt.current
      ? Math.round((Date.now() - new Date(startedAt.current).getTime()) / 1000)
      : null

    const res = await fetch(`/api/lms/quizzes/${quizId}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: answerArray,
        startedAt: startedAt.current,
        timeSpentSecs: elapsed,
      }),
    })
    const data = await res.json()
    setResult(data)
    setSubmitting(false)
  }, [quiz, quizId, submitting])

  function startQuiz() {
    if (!quiz) return
    startedAt.current = new Date().toISOString()
    if (quiz.durationMins) {
      setSecsLeft(quiz.durationMins * 60)
    }
    setStarted(true)
  }

  useEffect(() => {
    if (!started || secsLeft === null) return
    timerRef.current = setInterval(() => {
      setSecsLeft(s => {
        if (s === null || s <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [started]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (secsLeft === 0 && started && !result && !submitting) {
      submit(answers)
    }
  }, [secsLeft]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!quiz || (quiz as any).error) {
    return <div className="text-center py-16 text-gray-500">Quiz not found.</div>
  }

  // Results screen
  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className={`rounded-2xl p-8 text-center ${result.isPassed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.isPassed
            ? <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            : <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {result.isPassed ? 'Congratulations!' : 'Not Passed'}
          </h1>
          <p className="text-gray-600 mb-4">
            You scored <span className="font-semibold">{result.score}</span> / {result.maxScore} points
          </p>
          <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-2 border">
            <span className="text-3xl font-bold text-gray-900">{result.percentage}%</span>
            <span className="text-sm text-gray-500">Pass mark: {quiz.passMark}%</span>
          </div>
        </div>

        {result.questions && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Question Review</h2>
            {result.questions.map((q, idx) => (
              <div key={q.id} className={`bg-white rounded-2xl border p-5 ${q.isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-2">{q.question}</p>
                    <div className="space-y-1 text-xs">
                      {q.studentAnswer && (
                        <p className={q.isCorrect ? 'text-green-700' : 'text-red-600'}>
                          Your answer: <span className="font-medium">{q.studentAnswer}</span>
                        </p>
                      )}
                      {!q.isCorrect && (
                        <p className="text-green-700">
                          Correct answer: <span className="font-medium">{q.correctAnswer}</span>
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-gray-500 mt-2 italic">{q.explanation}</p>
                      )}
                    </div>
                  </div>
                  {q.isCorrect
                    ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => router.back()}
          className="w-full py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back to Course
        </button>
      </div>
    )
  }

  const attemptsLeft = quiz.maxAttempts - pastAttempts
  const canAttempt = attemptsLeft > 0

  // Pre-start screen
  if (!started) {
    return (
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
            {quiz.description && <p className="text-gray-500 text-sm">{quiz.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoBox label="Questions" value={String(quiz.questions.length)} />
            <InfoBox label="Duration" value={quiz.durationMins ? `${quiz.durationMins} min` : 'Untimed'} />
            <InfoBox label="Pass Mark" value={`${quiz.passMark}%`} />
            <InfoBox label="Attempts Left" value={`${attemptsLeft} of ${quiz.maxAttempts}`} />
          </div>

          {!canAttempt && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              You have used all your attempts for this quiz.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={startQuiz}
              disabled={!canAttempt}
              className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {pastAttempts > 0 ? 'Retake Quiz' : 'Start Quiz'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Quiz taking screen
  const q = quiz.questions[current]
  const totalQuestions = quiz.questions.length
  const answered = Object.keys(answers).length

  const mins = secsLeft !== null ? Math.floor(secsLeft / 60) : null
  const secs = secsLeft !== null ? secsLeft % 60 : null
  const timerUrgent = secsLeft !== null && secsLeft <= 60

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-5 py-3">
        <div className="text-sm font-medium text-gray-700">
          Question {current + 1} <span className="text-gray-400">/ {totalQuestions}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">{answered} answered</span>
          {secsLeft !== null && (
            <div className={`flex items-center gap-1.5 font-mono text-sm font-semibold ${timerUrgent ? 'text-red-600' : 'text-gray-700'}`}>
              <Clock className={`w-4 h-4 ${timerUrgent ? 'text-red-500' : 'text-gray-400'}`} />
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${((current + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
            {current + 1}
          </span>
          <p className="text-gray-900 font-medium leading-relaxed">{q.question}</p>
        </div>

        {/* MCQ options */}
        {q.type === 'MCQ' && q.options && (
          <div className="space-y-2 pl-10">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => setAnswers(a => ({ ...a, [q.id]: String(oi) }))}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                  answers[q.id] === String(oi)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* True/False */}
        {q.type === 'TRUE_FALSE' && (
          <div className="flex gap-4 pl-10">
            {['true', 'false'].map(v => (
              <button
                key={v}
                onClick={() => setAnswers(a => ({ ...a, [q.id]: v }))}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  answers[q.id] === v
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {v === 'true' ? 'True' : 'False'}
              </button>
            ))}
          </div>
        )}

        {/* Short Answer */}
        {q.type === 'SHORT_ANSWER' && (
          <div className="pl-10">
            <input
              type="text"
              value={answers[q.id] ?? ''}
              onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
              placeholder="Type your answer…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>

        {/* Question dots */}
        <div className="flex gap-1.5">
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === current ? 'bg-indigo-600' : answers[quiz.questions[i].id] ? 'bg-indigo-200' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {current < totalQuestions - 1 ? (
          <button
            onClick={() => setCurrent(c => Math.min(totalQuestions - 1, c + 1))}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => submit(answers)}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            {submitting ? 'Submitting…' : 'Submit Quiz'}
          </button>
        )}
      </div>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}
