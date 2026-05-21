import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const years = await prisma.academicYear.findMany({
    where: { tenantId },
    include: { semesters: true },
    orderBy: { startDate: 'desc' },
  })

  return NextResponse.json(years)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  // Set all others to not current when marking new one as current
  await prisma.academicYear.updateMany({ where: { tenantId }, data: { isCurrent: false } })

  const year = await prisma.academicYear.create({
    data: {
      tenantId,
      name: body.name,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      gradingScale: body.gradingScale ?? 'PERCENTAGE',
      passMark: body.passMark ?? 50,
      isCurrent: true,
    },
  })

  return NextResponse.json(year, { status: 201 })
}
