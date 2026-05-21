import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  const liveClass = await prisma.liveClass.update({
    where: { id },
    data: {
      ...(body.status === 'LIVE' ? { status: 'LIVE', startedAt: new Date() } : {}),
      ...(body.status === 'ENDED' ? { status: 'ENDED', endedAt: new Date() } : {}),
      ...(body.status === 'CANCELLED' ? { status: 'CANCELLED' } : {}),
    },
  })
  return NextResponse.json(liveClass)
}
