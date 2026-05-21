import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id
  const body = await req.json()

  const assignment = await prisma.assignment.findUnique({ where: { id: body.assignmentId } })
  if (!assignment) return NextResponse.json({ message: 'Assignment not found' }, { status: 404 })

  const now = new Date()
  const isLate = now > assignment.dueDate
  const status = body.isDraft ? 'DRAFT' : isLate ? 'LATE' : 'SUBMITTED'

  const submission = await prisma.submission.upsert({
    where: {
      tenantId_assignmentId_studentId: {
        tenantId,
        assignmentId: body.assignmentId,
        studentId: userId,
      },
    },
    create: {
      tenantId,
      assignmentId: body.assignmentId,
      studentId: userId,
      content: body.content,
      status: status as any,
      submittedAt: body.isDraft ? undefined : now,
    },
    update: {
      content: body.content,
      status: status as any,
      submittedAt: body.isDraft ? undefined : now,
    },
  })

  return NextResponse.json(submission, { status: 200 })
}
