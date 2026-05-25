import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string; courseId: string }> }

// PATCH — update level or isRequired
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id: programId, courseId } = await params
  const body = await req.json()

  const pc = await (prisma as any).programCourse.findUnique({
    where: { programId_courseId: { programId, courseId } },
  })
  if (!pc || pc.tenantId !== tenantId) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const updated = await (prisma as any).programCourse.update({
    where: { programId_courseId: { programId, courseId } },
    data: {
      ...(body.level      !== undefined ? { level: body.level }           : {}),
      ...(body.isRequired !== undefined ? { isRequired: body.isRequired } : {}),
    },
    include: {
      course: { select: { id: true, code: true, title: true, creditHours: true, level: true } },
    },
  })

  return NextResponse.json(updated)
}

// DELETE — remove course from program
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const { id: programId, courseId } = await params

  const pc = await (prisma as any).programCourse.findUnique({
    where: { programId_courseId: { programId, courseId } },
  })
  if (!pc || pc.tenantId !== tenantId) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  await (prisma as any).programCourse.delete({
    where: { programId_courseId: { programId, courseId } },
  })

  return NextResponse.json({ ok: true })
}
