import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const events = await prisma.campusEvent.findMany({
    where: { tenantId, endDate: { gte: new Date() } },
    include: {
      _count: { select: { rsvps: { where: { status: 'GOING' } } } },
      rsvps: { where: { studentId }, select: { status: true } },
    },
    orderBy: { startDate: 'asc' },
  })

  return NextResponse.json(
    events.map((e) => ({ ...e, myRsvp: e.rsvps[0]?.status ?? null, rsvps: undefined }))
  )
}
