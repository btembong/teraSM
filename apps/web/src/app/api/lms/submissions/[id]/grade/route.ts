import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendGradeNotificationEmail } from '@/lib/email'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { score, feedback } = await req.json()

  if (typeof score !== 'number') {
    return NextResponse.json({ error: 'Score required' }, { status: 400 })
  }

  const submission = await prisma.submission.update({
    where: { id },
    data: {
      score,
      feedback: feedback || null,
      status: 'GRADED',
      gradedAt: new Date(),
      gradedById: (session.user as any).id,
    },
    include: {
      assignment: { select: { title: true, maxScore: true } },
    },
  })

  // Notify student by email (non-blocking)
  const tenantId = (session.user as any).tenantId
  const [student, tenant] = await Promise.all([
    prisma.user.findUnique({ where: { id: submission.studentId }, select: { email: true, firstName: true } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
  ])
  if (student) {
    sendGradeNotificationEmail({
      to: student.email,
      firstName: student.firstName,
      schoolName: tenant?.name ?? 'Your School',
      assignmentTitle: submission.assignment.title,
      score,
      maxScore: submission.assignment.maxScore,
      feedback: feedback || null,
    }).catch(err => console.error('[grade email]', err))
  }

  return NextResponse.json(submission)
}
