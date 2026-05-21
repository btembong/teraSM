import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined

  const messages = await prisma.message.findMany({
    where: { conversationId: id, tenantId, isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take: 50,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const senderIds = [...new Set(messages.map((m) => m.senderId))]
  const users = await prisma.user.findMany({
    where: { id: { in: senderIds } },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  return NextResponse.json(messages.map((m) => ({ ...m, sender: userMap[m.senderId] })).reverse())
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const senderId = (session.user as any).id
  const body = await req.json()

  const message = await prisma.message.create({
    data: { tenantId, conversationId: id, senderId, content: body.content, fileUrl: body.fileUrl, fileName: body.fileName, fileType: body.fileType },
  })
  await prisma.conversation.update({ where: { id }, data: { lastMessageAt: new Date() } })

  const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { id: true, firstName: true, lastName: true, avatarUrl: true } })
  return NextResponse.json({ ...message, sender }, { status: 201 })
}
