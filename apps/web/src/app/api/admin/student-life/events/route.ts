import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const createdById = (session.user as any).id

  const { title, description, location, startDate, endDate, maxRsvp } = await req.json()

  const event = await prisma.campusEvent.create({
    data: {
      tenantId,
      organizedBy: createdById,
      title,
      description: description || null,
      location: location || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxRsvp: maxRsvp || null,
    },
  })
  return NextResponse.json(event)
}
