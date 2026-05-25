import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// GET — list courses assigned to this program
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id: programId } = await params

  const programCourses = await (prisma as any).programCourse.findMany({
    where: { programId, tenantId },
    include: {
      course: {
        select: { id: true, code: true, title: true, creditHours: true, level: true, departmentId: true },
      },
    },
    orderBy: [{ level: 'asc' }, { course: { code: 'asc' } }],
  })

  return NextResponse.json(programCourses)
}

// POST — assign a course to this program
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id: programId } = await params
  const body = await req.json()

  if (!body.courseId) return NextResponse.json({ message: 'courseId is required' }, { status: 400 })

  // Check program belongs to tenant
  const program = await (prisma as any).program.findFirst({ where: { id: programId, tenantId } })
  if (!program) return NextResponse.json({ message: 'Program not found' }, { status: 404 })

  // Check course belongs to tenant
  const course = await prisma.course.findFirst({ where: { id: body.courseId, tenantId } })
  if (!course) return NextResponse.json({ message: 'Course not found' }, { status: 404 })

  // Check for duplicate
  const existing = await (prisma as any).programCourse.findUnique({
    where: { programId_courseId: { programId, courseId: body.courseId } },
  })
  if (existing) return NextResponse.json({ message: 'Course already assigned to this program' }, { status: 409 })

  const pc = await (prisma as any).programCourse.create({
    data: {
      tenantId,
      programId,
      courseId:   body.courseId,
      level:      body.level      ?? course.level,
      isRequired: body.isRequired ?? true,
    },
    include: {
      course: { select: { id: true, code: true, title: true, creditHours: true, level: true } },
    },
  })

  return NextResponse.json(pc, { status: 201 })
}
