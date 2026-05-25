import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id } = await params
  const body = await req.json()

  const course = await prisma.course.findFirst({ where: { id, tenantId } })
  if (!course) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  // If code is changing, check uniqueness within tenant
  if (body.code && body.code !== course.code) {
    const conflict = await prisma.course.findFirst({ where: { tenantId, code: body.code, NOT: { id } } })
    if (conflict) return NextResponse.json({ message: 'Course code already exists' }, { status: 409 })
  }

  const updated = await prisma.course.update({
    where: { id },
    data: {
      ...(body.prerequisites !== undefined ? { prerequisites: body.prerequisites }   : {}),
      ...(body.code          !== undefined ? { code: body.code }                     : {}),
      ...(body.title         !== undefined ? { title: body.title }                   : {}),
      ...(body.description   !== undefined ? { description: body.description }       : {}),
      ...(body.status        !== undefined ? { status: body.status }                 : {}),
      ...(body.creditHours   !== undefined ? { creditHours: body.creditHours }       : {}),
      ...(body.level         !== undefined ? { level: body.level }                   : {}),
      ...(body.departmentId  !== undefined ? { departmentId: body.departmentId }     : {}),
    },
    include: { department: true, _count: { select: { offerings: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id } = await params

  const course = await prisma.course.findFirst({ where: { id, tenantId } })
  if (!course) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  await prisma.course.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
