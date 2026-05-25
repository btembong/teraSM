import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const studentId = (session.user as any).id

  const { eventId, status } = await req.json()

  const existing = await prisma.eventRsvp.findFirst({ where: { eventId, userId: studentId } })
  if (existing) {
    const updated = await prisma.eventRsvp.update({ where: { id: existing.id }, data: { status } })
    return NextResponse.json(updated)
  }

  const rsvp = await prisma.eventRsvp.create({ data: { eventId, userId: studentId, status } })
  return NextResponse.json(rsvp)
}
