import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userAId = (session.user as any).id
  const { targetUserId } = await req.json()
  const userBId = targetUserId

  // Check for existing DM
  const existing = await prisma.conversation.findFirst({
    where: {
      tenantId,
      type: 'DIRECT',
      AND: [
        { participants: { some: { userId: userAId } } },
        { participants: { some: { userId: userBId } } },
      ],
    },
    include: { participants: true },
  })
  if (existing && existing.participants.length === 2) return NextResponse.json(existing)

  const conversation = await prisma.conversation.create({
    data: {
      tenantId,
      type: 'DIRECT',
      createdById: userAId,
      participants: {
        create: [
          { tenantId, userId: userAId },
          { tenantId, userId: userBId },
        ],
      },
    },
    include: { participants: true },
  })
  return NextResponse.json(conversation, { status: 201 })
}
