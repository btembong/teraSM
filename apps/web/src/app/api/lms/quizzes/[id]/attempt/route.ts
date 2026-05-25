import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// POST — submit a quiz attempt with answers, returns scored result
export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: quizId } = await params
  const tenantId = (session.user as any).tenantId
  const studentId = (session.user as any).id

  const body = await req.json()
  // body.answers: [{ questionId, answer }]
  // body.startedAt: ISO string
  // body.timeSpentSecs: number

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  })
  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

  // Check attempt limit
  const existingAttempts = await prisma.quizAttempt.count({
    where: { quizId, studentId, submittedAt: { not: null } },
  })
  if (existingAttempts >= quiz.maxAttempts) {
    return NextResponse.json({ error: 'Maximum attempts reached' }, { status: 400 })
  }

  // Score each answer
  const answers = body.answers as Array<{ questionId: string; answer: string }>
  const answerMap = Object.fromEntries(answers.map(a => [a.questionId, a.answer]))

  let totalScore = 0
  let maxScore = 0
  const scoredAnswers: Array<{ questionId: string; answer: string | null; isCorrect: boolean; points: number }> = []

  for (const q of quiz.questions) {
    maxScore += q.points
    const studentAnswer = answerMap[q.id] ?? null
    let isCorrect = false
    let points = 0

    if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
      isCorrect = studentAnswer !== null && studentAnswer === q.correctAnswer
      points = isCorrect ? q.points : 0
    } else if (q.type === 'SHORT_ANSWER') {
      // Simple case-insensitive exact match — teacher can override later
      isCorrect = studentAnswer !== null &&
        studentAnswer.trim().toLowerCase() === (q.correctAnswer ?? '').trim().toLowerCase()
      points = isCorrect ? q.points : 0
    }

    totalScore += points
    scoredAnswers.push({ questionId: q.id, answer: studentAnswer, isCorrect, points })
  }

  const isPassed = maxScore > 0 ? (totalScore / maxScore) * 100 >= quiz.passMark : false
  const startedAt = body.startedAt ? new Date(body.startedAt) : new Date()

  const attempt = await prisma.quizAttempt.create({
    data: {
      tenantId,
      quizId,
      studentId,
      startedAt,
      submittedAt: new Date(),
      score: totalScore,
      maxScore,
      isPassed,
      timeSpentSecs: body.timeSpentSecs ?? null,
      answers: {
        create: scoredAnswers.map(a => ({
          questionId: a.questionId,
          answer: a.answer,
          isCorrect: a.isCorrect,
          points: a.points,
        })),
      },
    },
    include: { answers: true },
  })

  // If showResultsAfter, include question explanations
  const result: Record<string, unknown> = {
    attempt,
    score: totalScore,
    maxScore,
    percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    isPassed,
  }

  if (quiz.showResultsAfter) {
    result.questions = quiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      studentAnswer: answerMap[q.id] ?? null,
      isCorrect: scoredAnswers.find(a => a.questionId === q.id)?.isCorrect ?? false,
    }))
  }

  return NextResponse.json(result, { status: 201 })
}

// GET — student's own attempts for this quiz
export async function GET(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: quizId } = await params
  const studentId = (session.user as any).id

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, studentId },
    include: { answers: true },
    orderBy: { startedAt: 'desc' },
  })
  return NextResponse.json(attempts)
}
