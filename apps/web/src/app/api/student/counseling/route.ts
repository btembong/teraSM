import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appointments = await (prisma as any).counselingAppointment.findMany({
    where: {
      tenantId: session.user.tenantId,
      studentId: session.user.id,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(appointments)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { preferredDate, slot, reason, isAnonymous } = await req.json()

  if (!preferredDate || !slot || !reason?.trim()) {
    return NextResponse.json({ error: 'preferredDate, slot and reason are required' }, { status: 400 })
  }

  const appointment = await (prisma as any).counselingAppointment.create({
    data: {
      tenantId: session.user.tenantId,
      studentId: isAnonymous ? null : session.user.id,
      isAnonymous: !!isAnonymous,
      preferredDate: new Date(preferredDate),
      slot,
      reason: reason.trim(),
    },
  })

  return NextResponse.json(appointment, { status: 201 })
}
