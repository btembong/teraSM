import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const events = await (prisma as any).campusEvent.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { rsvps: true } } },
  })

  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId  = session.user.tenantId
  const organizedBy = session.user.id

  const body = await req.json()
  const { title, description, location, startDate, endDate, maxRsvp, isPublished } = body

  if (!title?.trim() || !startDate || !endDate) {
    return NextResponse.json({ error: 'Title, start date and end date are required' }, { status: 400 })
  }

  const event = await (prisma as any).campusEvent.create({
    data: {
      tenantId,
      organizedBy,
      title:       title.trim(),
      description: description?.trim() || null,
      location:    location?.trim()    || null,
      startDate:   new Date(startDate),
      endDate:     new Date(endDate),
      maxRsvp:     maxRsvp ? Number(maxRsvp) : null,
      isPublished: isPublished ?? false,
    },
    include: { _count: { select: { rsvps: true } } },
  })

  return NextResponse.json(event, { status: 201 })
}
