import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const types = await prisma.leaveType.findMany({ where: { tenantId, isActive: true }, orderBy: { name: 'asc' } })
  return NextResponse.json(types)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  const type = await prisma.leaveType.create({
    data: { tenantId, name: body.name, code: body.code, daysPerYear: body.daysPerYear ?? 21, isPaid: body.isPaid ?? true, requiresProof: body.requiresProof ?? false },
  })
  return NextResponse.json(type, { status: 201 })
}
