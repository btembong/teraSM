import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET — list quizzes for a course offering
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { searchParams } = new URL(req.url)
  const courseOfferingId = searchParams.get('courseOfferingId')
  if (!courseOfferingId) return NextResponse.json([])

  const quizzes = await prisma.quiz.findMany({
    where: { tenantId, courseOfferingId },
    include: { _count: { select: { questions: true, attempts: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(quizzes)
}

// POST — create a quiz (staff/admin)
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const body = await req.json()
  const { courseOfferingId, title, description, durationMins, maxAttempts, shuffleQuestions, shuffleOptions, showResultsAfter, passMark, openAt, closeAt } = body

  const quiz = await prisma.quiz.create({
    data: {
      tenantId, courseOfferingId, title,
      description, durationMins, maxAttempts,
      shuffleQuestions: shuffleQuestions ?? false,
      shuffleOptions: shuffleOptions ?? false,
      showResultsAfter: showResultsAfter ?? true,
      passMark: passMark ?? 50,
      openAt: openAt ? new Date(openAt) : null,
      closeAt: closeAt ? new Date(closeAt) : null,
    },
  })
  return NextResponse.json(quiz, { status: 201 })
}
