import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/student/thesis — list student's own theses
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id: studentId, tenantId } = session.user as any

  const theses = await prisma.thesis.findMany({
    where: { tenantId, studentId },
    include: {
      supervisor: { select: { id: true, firstName: true, lastName: true } },
      versions: { orderBy: { version: 'desc' }, take: 1 },
      feedbacks: {
        where: { isPrivate: false },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(theses)
}

// POST /api/student/thesis — create a new thesis draft
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id: studentId, tenantId } = session.user as any

  const body = await req.json()
  const { title, abstract, department, program, academicYear, tags } = body

  if (!title?.trim()) return NextResponse.json({ message: 'Title is required.' }, { status: 400 })

  const thesis = await prisma.thesis.create({
    data: {
      tenantId,
      studentId,
      title: title.trim(),
      abstract: abstract?.trim() || null,
      department: department?.trim() || null,
      program: program?.trim() || null,
      academicYear: academicYear?.trim() || null,
      tags: Array.isArray(tags) ? tags : [],
      status: 'DRAFT',
    },
    include: {
      supervisor: { select: { id: true, firstName: true, lastName: true } },
      versions: true,
      feedbacks: true,
    },
  })

  return NextResponse.json(thesis, { status: 201 })
}
