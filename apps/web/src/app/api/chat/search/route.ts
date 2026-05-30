import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/chat/search?q=hello&conversationId=xxx (conversationId optional)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId   = (session.user as any).id

  const q              = req.nextUrl.searchParams.get('q')?.trim()
  const conversationId = req.nextUrl.searchParams.get('conversationId') ?? undefined

  if (!q || q.length < 2) return NextResponse.json([])

  // Only search conversations the user is part of
  const myConvIds = conversationId
    ? [conversationId]
    : (await prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true },
      })).map(p => p.conversationId)

  if (myConvIds.length === 0) return NextResponse.json([])

  const messages = await prisma.message.findMany({
    where: {
      tenantId,
      conversationId: { in: myConvIds },
      isDeleted: false,
      content: { contains: q, mode: 'insensitive' },
    },
    orderBy: { createdAt: 'desc' },
    take: 40,
    include: {
      conversation: { select: { id: true, name: true, type: true } },
    },
  })

  const senderIds = [...new Set(messages.map(m => m.senderId))]
  const users = senderIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: senderIds } },
        select: { id: true, firstName: true, lastName: true },
      })
    : []
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  return NextResponse.json(
    messages.map(m => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      senderId: m.senderId,
      sender: userMap[m.senderId],
      conversationId: m.conversationId,
      conversation: m.conversation,
    }))
  )
}
