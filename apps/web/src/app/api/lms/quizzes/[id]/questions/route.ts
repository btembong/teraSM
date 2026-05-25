import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// POST — add a question to a quiz
export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: quizId } = await params
  const body = await req.json()

  const count = await prisma.quizQuestion.count({ where: { quizId } })
  const question = await prisma.quizQuestion.create({
    data: {
      quizId,
      type: body.type ?? 'MCQ',
      question: body.question,
      options: body.options ?? null,
      correctAnswer: body.correctAnswer ?? null,
      points: body.points ?? 1,
      order: body.order ?? count,
      explanation: body.explanation ?? null,
    },
  })
  return NextResponse.json(question, { status: 201 })
}

// DELETE a specific question
export async function DELETE(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const questionId = searchParams.get('questionId')
  if (!questionId) return NextResponse.json({ error: 'Missing questionId' }, { status: 400 })
  await prisma.quizQuestion.delete({ where: { id: questionId } })
  return NextResponse.json({ ok: true })
}
