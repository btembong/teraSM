import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const clubs = await prisma.club.findMany({
    where: { tenantId },
    include: {
      _count: { select: { memberships: { where: { status: 'ACTIVE' } } } },
      memberships: { where: { studentId, status: 'ACTIVE' }, select: { id: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(
    clubs.map((c) => ({ ...c, isMember: c.memberships.length > 0, memberships: undefined }))
  )
}
