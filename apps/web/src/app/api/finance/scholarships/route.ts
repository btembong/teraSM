import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const scholarships = await prisma.scholarship.findMany({
    where: { tenantId, isActive: true },
    include: { _count: { select: { awards: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(scholarships)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  const scholarship = await prisma.scholarship.create({
    data: {
      tenantId,
      name: body.name,
      description: body.description,
      type: body.type ?? 'SCHOLARSHIP',
      amount: body.amount,
      percentage: body.percentage,
      maxAmount: body.maxAmount,
    },
  })
  return NextResponse.json(scholarship, { status: 201 })
}
