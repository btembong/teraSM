import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string
  const { id } = await params

  const existing = await (prisma as any).campus.findFirst({ where: { id, tenantId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, code, address, city, phone, email, isMain } = body

  // If marking as main, unset all others first
  if (isMain) {
    await (prisma as any).campus.updateMany({
      where: { tenantId, id: { not: id } },
      data: { isMain: false },
    })
  }

  const campus = await (prisma as any).campus.update({
    where: { id },
    data: {
      ...(name    !== undefined ? { name: name.trim() }                  : {}),
      ...(code    !== undefined ? { code: code.trim().toUpperCase() }    : {}),
      ...(address !== undefined ? { address }                            : {}),
      ...(city    !== undefined ? { city }                               : {}),
      ...(phone   !== undefined ? { phone }                              : {}),
      ...(email   !== undefined ? { email }                              : {}),
      ...(isMain  !== undefined ? { isMain }                             : {}),
    },
  })

  return NextResponse.json(campus)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string
  const { id } = await params

  const existing = await (prisma as any).campus.findFirst({ where: { id, tenantId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.isMain) return NextResponse.json({ error: 'Cannot delete the main campus.' }, { status: 400 })

  await (prisma as any).campus.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
