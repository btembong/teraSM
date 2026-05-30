import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/chat/conversations/[id]/read
// Marks all messages in the conversation as read for the current user.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId   = (session.user as any).id

  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId } },
  })
  if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 })

  // Update lastReadAt on participant
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: id, userId } },
    data: { lastReadAt: new Date() },
  })

  // Upsert MessageReadReceipt for each unread message (fire-and-forget)
  const unread = await prisma.message.findMany({
    where: {
      conversationId: id,
      tenantId,
      isDeleted: false,
      senderId: { not: userId },
      readReceipts: { none: { userId } },
    },
    select: { id: true },
  })

  if (unread.length > 0) {
    await (prisma as any).messageReadReceipt.createMany({
      data: unread.map(m => ({ messageId: m.id, userId })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({ ok: true, marked: unread.length })
}
