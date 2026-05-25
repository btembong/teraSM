import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({}, { status: 401 })

  const tenantId = (session.user as any).tenantId
  const url = new URL(req.url)
  const ids = url.searchParams.getAll('ids')

  if (ids.length === 0) return NextResponse.json({})

  const users = await prisma.user.findMany({
    where: { tenantId, id: { in: ids } },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  })

  const map = Object.fromEntries(users.map(u => [u.id, u]))
  return NextResponse.json(map)
}
