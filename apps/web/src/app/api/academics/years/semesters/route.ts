import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const semesters = await prisma.semester.findMany({
    where: { tenantId },
    include: { academicYear: { select: { name: true } } },
    orderBy: [{ academicYear: { startDate: 'desc' } }, { startDate: 'desc' }],
  })

  return NextResponse.json(semesters)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  if (body.isCurrent) {
    await prisma.semester.updateMany({ where: { tenantId }, data: { isCurrent: false } })
  }

  const semester = await prisma.semester.create({
    data: {
      tenantId,
      academicYearId: body.academicYearId,
      name: body.name,
      termType: body.termType ?? 'SEMESTER',
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      isCurrent: body.isCurrent ?? false,
    } as any,
  })

  return NextResponse.json(semester, { status: 201 })
}
