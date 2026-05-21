import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const departmentId = req.nextUrl.searchParams.get('departmentId') ?? undefined

  const courses = await prisma.course.findMany({
    where: { tenantId, ...(departmentId ? { departmentId } : {}) },
    include: { department: true, _count: { select: { offerings: true } } },
    orderBy: { code: 'asc' },
  })

  return NextResponse.json(courses)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const body = await req.json()

  const course = await prisma.course.create({
    data: {
      tenantId,
      departmentId: body.departmentId,
      code: body.code,
      title: body.title,
      description: body.description,
      creditHours: body.creditHours ?? 3,
      level: body.level ?? 100,
    },
  })

  return NextResponse.json(course, { status: 201 })
}
