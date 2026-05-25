import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const teacherId = (session.user as any).id

  const slots = await prisma.officeHourSlot.findMany({
    where: { tenantId, teacherId, isActive: true },
    include: {
      bookings: {
        where: { status: { not: 'CANCELLED' } },
        include: { slot: false },
        orderBy: { bookingDate: 'asc' },
      },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })

  // Enrich bookings with student info
  const studentIds = [...new Set(slots.flatMap(s => s.bookings.map(b => b.studentId)))]
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))

  const enriched = slots.map(s => ({
    ...s,
    bookings: s.bookings.map(b => ({ ...b, student: studentMap[b.studentId] ?? null })),
  }))

  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const teacherId = (session.user as any).id
  const body = await req.json()

  const slot = await prisma.officeHourSlot.create({
    data: {
      tenantId,
      teacherId,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      location: body.location || null,
      isOnline: body.isOnline ?? false,
      meetingLink: body.meetingLink || null,
    },
  })
  return NextResponse.json(slot, { status: 201 })
}
