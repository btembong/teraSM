import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const courseOfferingId = searchParams.get('courseOfferingId')
  if (!courseOfferingId) return NextResponse.json([])

  // Get all enrollments for this offering
  const enrollments = await prisma.enrollment.findMany({
    where: { courseOfferingId, status: 'ENROLLED' },
    select: { studentId: true },
  })

  const studentIds = enrollments.map(e => e.studentId)

  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  })
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))

  // Quiz scores: sum of best attempts per quiz
  const quizAttempts: Array<{ studentId: string; score: number | null }> = await db.quizAttempt
    .findMany({
      where: { studentId: { in: studentIds }, submittedAt: { not: null } },
      select: { studentId: true, score: true },
    })
    .catch(() => [])

  // Assignment grades: sum of graded submissions
  const submissions = await prisma.submission.findMany({
    where: {
      studentId: { in: studentIds },
      assignment: { courseOfferingId },
      status: 'GRADED',
    },
    select: { studentId: true, score: true },
  })

  // Aggregate
  const scoreMap: Record<string, { quizPts: number; assignmentPts: number }> = {}
  studentIds.forEach(id => { scoreMap[id] = { quizPts: 0, assignmentPts: 0 } })

  quizAttempts.forEach((a: { studentId: string; score: number | null }) => {
    if (scoreMap[a.studentId]) scoreMap[a.studentId].quizPts += a.score ?? 0
  })
  submissions.forEach(s => {
    if (scoreMap[s.studentId]) scoreMap[s.studentId].assignmentPts += s.score ?? 0
  })

  const board = enrollments
    .map(e => ({
      studentId: e.studentId,
      name: `${studentMap[e.studentId]?.firstName ?? ''} ${studentMap[e.studentId]?.lastName ?? ''}`.trim(),
      avatarUrl: studentMap[e.studentId]?.avatarUrl,
      quizPts: Math.round(scoreMap[e.studentId]?.quizPts ?? 0),
      assignmentPts: Math.round(scoreMap[e.studentId]?.assignmentPts ?? 0),
      total: Math.round((scoreMap[e.studentId]?.quizPts ?? 0) + (scoreMap[e.studentId]?.assignmentPts ?? 0)),
    }))
    .sort((a, b) => b.total - a.total)
    .map((s, i) => ({ ...s, rank: i + 1 }))

  return NextResponse.json(board)
}
