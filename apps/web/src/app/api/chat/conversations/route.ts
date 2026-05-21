import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const conversations = await prisma.conversation.findMany({
    where: { tenantId, participants: { some: { userId } }, isArchived: false },
    include: {
      participants: { select: { userId: true, lastReadAt: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true, createdAt: true, senderId: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
  })

  // Attach user info to participants
  const allUserIds = [...new Set(conversations.flatMap((c) => c.participants.map((p) => p.userId)))]
  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  return NextResponse.json(
    conversations.map((c) => ({
      ...c,
      participants: c.participants.map((p) => ({ ...p, user: userMap[p.userId] })),
    }))
  )
}
