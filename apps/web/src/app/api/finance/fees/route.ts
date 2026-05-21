import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const semesterId = req.nextUrl.searchParams.get('semesterId') ?? undefined

  const fees = await prisma.feeStructure.findMany({
    where: { tenantId, isActive: true, ...(semesterId ? { semesterId } : {}) },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(fees)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  const fee = await prisma.feeStructure.create({
    data: {
      tenantId,
      name: body.name,
      description: body.description,
      amount: body.amount,
      semesterId: body.semesterId,
      level: body.level,
      programId: body.programId,
      isRecurring: body.isRecurring ?? true,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      lateFee: body.lateFee,
      lateFeeGraceDays: body.lateFeeGraceDays ?? 0,
    },
  })
  return NextResponse.json(fee, { status: 201 })
}
