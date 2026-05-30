import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/chat/conversations/[id]/poll?after=<ISO timestamp>
// Returns messages created after the given timestamp. Used for short-polling.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId   = (session.user as any).id

  // Verify participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId } },
  })
  if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 })

  const afterStr = req.nextUrl.searchParams.get('after')
  const after    = afterStr ? new Date(afterStr) : new Date(0)

  const messages = await prisma.message.findMany({
    where: { conversationId: id, tenantId, isDeleted: false, createdAt: { gt: after } },
    orderBy: { createdAt: 'asc' },
  })

  const senderIds = [...new Set(messages.map(m => m.senderId))]
  const users = senderIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: senderIds } },
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      })
    : []
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  return NextResponse.json(messages.map(m => ({ ...m, sender: userMap[m.senderId] })))
}
