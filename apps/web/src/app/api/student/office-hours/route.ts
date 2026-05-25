import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// GET — list all active teacher office hour slots for this tenant
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const studentId = (session.user as any).id

  const db = prisma as any

  const slots = await db.officeHourSlot.findMany({
    where: { tenantId, isActive: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  }).catch(() => [])

  // Enrich with teacher info and student's own bookings
  const teacherIds = [...new Set((slots as any[]).map((s: any) => s.teacherId))]
  const teachers = await prisma.user.findMany({
    where: { id: { in: teacherIds as string[] } },
    select: { id: true, firstName: true, lastName: true },
  })
  const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t]))

  const myBookings = await db.officeHourBooking.findMany({
    where: { studentId, slotId: { in: (slots as any[]).map((s: any) => s.id) } },
  }).catch(() => [])
  const bookedMap = Object.fromEntries((myBookings as any[]).map((b: any) => [b.slotId + '_' + b.bookingDate, b]))

  const enriched = (slots as any[]).map((s: any) => ({
    ...s,
    dayName: DAYS[s.dayOfWeek] ?? `Day ${s.dayOfWeek}`,
    teacher: teacherMap[s.teacherId] ?? null,
    myBooking: Object.values(bookedMap).filter((b: any) => b.slotId === s.id),
  }))

  return NextResponse.json(enriched)
}

// POST — book a slot
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const studentId = (session.user as any).id
  const { slotId, bookingDate, note } = await req.json()

  const db = prisma as any

  try {
    const booking = await db.officeHourBooking.create({
      data: {
        slotId,
        studentId,
        bookingDate: new Date(bookingDate),
        note: note || null,
        status: 'PENDING',
      },
    })
    return NextResponse.json(booking, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'You already have a booking for this slot on that date.' }, { status: 409 })
    }
    throw err
  }
}
