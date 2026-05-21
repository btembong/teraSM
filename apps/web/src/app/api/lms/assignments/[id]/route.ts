import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const assignment = await prisma.assignment.findUnique({ where: { id } })
  if (!assignment) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const submission = await prisma.submission.findUnique({
    where: { tenantId_assignmentId_studentId: { tenantId, assignmentId: id, studentId: userId } },
  })

  return NextResponse.json({ assignment, submission })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  const assignment = await prisma.assignment.update({
    where: { id },
    data: {
      ...body,
      ...(body.dueDate ? { dueDate: new Date(body.dueDate) } : {}),
      ...(body.isPublished ? { publishedAt: new Date() } : {}),
    },
  })
  return NextResponse.json(assignment)
}
