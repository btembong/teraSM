import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const courseOfferingId = req.nextUrl.searchParams.get('courseOfferingId') ?? undefined

  const assignments = await prisma.assignment.findMany({
    where: { tenantId, ...(courseOfferingId ? { courseOfferingId } : {}) },
    include: { _count: { select: { submissions: true } } },
    orderBy: { dueDate: 'asc' },
  })
  return NextResponse.json(assignments)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  const assignment = await prisma.assignment.create({
    data: {
      tenantId,
      courseOfferingId: body.courseOfferingId,
      title: body.title,
      description: body.description,
      instructions: body.instructions,
      maxScore: body.maxScore ?? 100,
      dueDate: new Date(body.dueDate),
      allowLate: body.allowLate ?? false,
      latePenaltyPct: body.latePenaltyPct ?? 0,
    },
  })
  return NextResponse.json(assignment, { status: 201 })
}
