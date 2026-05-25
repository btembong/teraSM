import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id } = await params

  const holiday = await (prisma as any).holiday.findFirst({ where: { id, tenantId } })
  if (!holiday) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const body = await req.json()

  const updated = await (prisma as any).holiday.update({
    where: { id },
    data: {
      ...(body.name        !== undefined ? { name: body.name.trim() }              : {}),
      ...(body.date        !== undefined ? { date: new Date(body.date) }           : {}),
      ...(body.endDate     !== undefined ? { endDate: body.endDate ? new Date(body.endDate) : null } : {}),
      ...(body.holidayType !== undefined ? { holidayType: body.holidayType }       : {}),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id } = await params

  const holiday = await (prisma as any).holiday.findFirst({ where: { id, tenantId } })
  if (!holiday) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  await (prisma as any).holiday.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
