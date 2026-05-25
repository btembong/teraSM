import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id } = await params

  const dept = await prisma.department.findFirst({ where: { id, tenantId } })
  if (!dept) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const body = await req.json()

  // If code is changing, check it's not taken
  if (body.code && body.code !== dept.code) {
    const conflict = await prisma.department.findUnique({
      where: { tenantId_code: { tenantId, code: body.code } },
    })
    if (conflict) return NextResponse.json({ message: 'Department code already exists' }, { status: 409 })
  }

  const updated = await prisma.department.update({
    where: { id },
    data: {
      ...(body.name        !== undefined ? { name: body.name }               : {}),
      ...(body.code        !== undefined ? { code: body.code }               : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.facultyId   !== undefined ? { facultyId: body.facultyId }     : {}),
    },
    include: { _count: { select: { courses: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id } = await params

  const dept = await prisma.department.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { courses: true } } },
  })
  if (!dept) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  if (dept._count.courses > 0) {
    return NextResponse.json(
      { message: `Cannot delete: this department has ${dept._count.courses} course(s). Reassign or delete them first.` },
      { status: 400 },
    )
  }

  await prisma.department.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
