import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const departments = await prisma.department.findMany({
    where: { tenantId },
    include: { _count: { select: { courses: true } } },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(departments)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  const existing = await prisma.department.findUnique({
    where: { tenantId_code: { tenantId, code: body.code } },
  })
  if (existing) return NextResponse.json({ message: 'Department code already exists' }, { status: 409 })

  const dept = await prisma.department.create({
    data: { tenantId, name: body.name, code: body.code, description: body.description },
  })

  return NextResponse.json(dept, { status: 201 })
}
