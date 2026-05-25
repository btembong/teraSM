import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const role = (session.user as any).role
  const isStudent = role === 'STUDENT'

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        select: {
          id: true, type: true, question: true, options: true, points: true, order: true,
          // Hide correct answer from students
          correctAnswer: !isStudent,
          explanation: !isStudent,
        },
      },
      _count: { select: { questions: true, attempts: true } },
    },
  })
  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(quiz)
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const quiz = await prisma.quiz.update({
    where: { id },
    data: {
      ...body,
      openAt: body.openAt ? new Date(body.openAt) : undefined,
      closeAt: body.closeAt ? new Date(body.closeAt) : undefined,
      publishedAt: body.isPublished ? new Date() : undefined,
    },
  })
  return NextResponse.json(quiz)
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await prisma.quiz.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
