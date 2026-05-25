import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const semesterId = req.nextUrl.searchParams.get('semesterId')

  const holidays = await (prisma as any).holiday.findMany({
    where: {
      tenantId,
      ...(semesterId ? { semesterId } : {}),
    },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(holidays)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  if (!body.name?.trim() || !body.date || !body.semesterId) {
    return NextResponse.json({ message: 'Name, date and semesterId are required' }, { status: 400 })
  }

  // Verify semester belongs to tenant
  const semester = await prisma.semester.findFirst({ where: { id: body.semesterId, tenantId } })
  if (!semester) return NextResponse.json({ message: 'Semester not found' }, { status: 404 })

  const holiday = await (prisma as any).holiday.create({
    data: {
      tenantId,
      semesterId:  body.semesterId,
      name:        body.name.trim(),
      date:        new Date(body.date),
      endDate:     body.endDate ? new Date(body.endDate) : null,
      holidayType: body.holidayType ?? 'PUBLIC',
    },
  })

  return NextResponse.json(holiday, { status: 201 })
}
