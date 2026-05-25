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

  const year = await prisma.academicYear.findFirst({ where: { id, tenantId } })
  if (!year) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const updated = await prisma.academicYear.update({
    where: { id },
    data: {
      ...(body.gradingScale    !== undefined ? { gradingScale: body.gradingScale }       : {}),
      ...(body.passMark        !== undefined ? { passMark: body.passMark }               : {}),
      ...(body.gradeBoundaries !== undefined ? { gradeBoundaries: body.gradeBoundaries } : {}),
    },
    include: { semesters: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id } = await params

  const year = await prisma.academicYear.findFirst({ where: { id, tenantId } })
  if (!year) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  await prisma.academicYear.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
