import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const rooms = await (prisma as any).room.findMany({
    where: { tenantId },
    include: { _count: { select: { offerings: true } } },
    orderBy: [{ building: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(rooms)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  if (!body.name?.trim()) {
    return NextResponse.json({ message: 'Room name is required' }, { status: 400 })
  }

  // Check uniqueness
  const conflict = await (prisma as any).room.findFirst({
    where: { tenantId, name: body.name.trim() },
  })
  if (conflict) return NextResponse.json({ message: 'A room with this name already exists' }, { status: 409 })

  const room = await (prisma as any).room.create({
    data: {
      tenantId,
      name:         body.name.trim(),
      code:         body.code?.trim().toUpperCase() || null,
      building:     body.building?.trim() || null,
      floor:        body.floor?.trim() || null,
      capacity:     body.capacity ?? 50,
      roomType:     body.roomType ?? 'LECTURE',
      hasProjector: body.hasProjector ?? false,
      hasAC:        body.hasAC ?? false,
      isActive:     body.isActive ?? true,
    },
    include: { _count: { select: { offerings: true } } },
  })

  return NextResponse.json(room, { status: 201 })
}
