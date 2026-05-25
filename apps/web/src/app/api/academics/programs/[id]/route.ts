import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id } = await params

  const program = await (prisma as any).program.findFirst({ where: { id, tenantId } })
  if (!program) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const body = await req.json()

  if (body.code && body.code.trim().toUpperCase() !== program.code) {
    const conflict = await (prisma as any).program.findFirst({
      where: { tenantId, code: body.code.trim().toUpperCase(), NOT: { id } },
    })
    if (conflict) return NextResponse.json({ message: 'Program code already exists' }, { status: 409 })
  }

  const updated = await (prisma as any).program.update({
    where: { id },
    data: {
      ...(body.name            !== undefined ? { name: body.name.trim() }                     : {}),
      ...(body.code            !== undefined ? { code: body.code.trim().toUpperCase() }       : {}),
      ...(body.departmentId    !== undefined ? { departmentId: body.departmentId }            : {}),
      ...(body.degreeType      !== undefined ? { degreeType: body.degreeType }                : {}),
      ...(body.durationYears   !== undefined ? { durationYears: body.durationYears }          : {}),
      ...(body.requiredCredits !== undefined ? { requiredCredits: body.requiredCredits }      : {}),
      ...(body.description     !== undefined ? { description: body.description?.trim() || null } : {}),
      ...(body.isActive        !== undefined ? { isActive: body.isActive }                    : {}),
    },
    include: { department: { select: { id: true, name: true, code: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id } = await params

  const program = await (prisma as any).program.findFirst({ where: { id, tenantId } })
  if (!program) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  await (prisma as any).program.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
