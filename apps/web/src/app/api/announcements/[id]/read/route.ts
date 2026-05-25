import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  await (prisma as any).announcementRead.upsert({
    where: { announcementId_userId: { announcementId: id, userId } },
    update: {},
    create: { tenantId, announcementId: id, userId },
  })

  return NextResponse.json({ ok: true })
}
