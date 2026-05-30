import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/staff/thesis/[id]/feedback — add feedback to a thesis
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id: authorId, tenantId } = session.user as any
  const { id: thesisId } = await params

  const thesis = await prisma.thesis.findFirst({
    where: { id: thesisId, tenantId, supervisorId: authorId },
  })
  if (!thesis) return NextResponse.json({ message: 'Not found or not your thesis.' }, { status: 404 })

  const body = await req.json()
  const { content, isPrivate } = body
  if (!content?.trim()) return NextResponse.json({ message: 'Feedback content is required.' }, { status: 400 })

  const feedback = await prisma.thesisFeedback.create({
    data: {
      thesisId,
      authorId,
      content: content.trim(),
      isPrivate: isPrivate === true,
    },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  })

  return NextResponse.json(feedback, { status: 201 })
}
