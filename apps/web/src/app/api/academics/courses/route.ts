import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const departmentId = req.nextUrl.searchParams.get('departmentId') ?? undefined

  const programId = req.nextUrl.searchParams.get('programId') ?? undefined

  const programFilter = programId
    ? { programCourses: { some: { programId } } }
    : {}

  const courses = await prisma.course.findMany({
    where: { tenantId, ...(departmentId ? { departmentId } : {}), ...programFilter },
    include: {
      department: { include: { faculty: { select: { id: true, name: true, code: true } } } },
      _count: { select: { offerings: true } },
      programCourses: {
        include: { program: { select: { id: true, name: true, code: true } } },
      },
    },
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
