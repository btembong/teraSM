import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const notifications = await prisma.notification.findMany({
    where: { tenantId, userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(notifications)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  // Mark all as read or specific ids
  await prisma.notification.updateMany({
    where: { tenantId, userId: (session.user as any).id, ...(body.ids?.length ? { id: { in: body.ids } } : {}) },
    data: { isRead: true, readAt: new Date() },
  })
  return NextResponse.json({ success: true })
}
