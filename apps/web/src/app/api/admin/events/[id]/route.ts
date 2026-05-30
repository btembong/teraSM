import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await (prisma as any).campusEvent.findFirst({
    where: { id, tenantId: session.user.tenantId },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const updated = await (prisma as any).campusEvent.update({
    where: { id },
    data: {
      ...(body.title       !== undefined && { title:       body.title.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.location    !== undefined && { location:    body.location?.trim()    || null }),
      ...(body.startDate   !== undefined && { startDate:   new Date(body.startDate) }),
      ...(body.endDate     !== undefined && { endDate:     new Date(body.endDate) }),
      ...(body.maxRsvp     !== undefined && { maxRsvp:     body.maxRsvp ? Number(body.maxRsvp) : null }),
      ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
    },
    include: { _count: { select: { rsvps: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await (prisma as any).campusEvent.findFirst({
    where: { id, tenantId: session.user.tenantId },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await (prisma as any).campusEvent.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
