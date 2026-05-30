import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/student/thesis/[id] — update thesis metadata
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id: studentId, tenantId } = session.user as any
  const { id } = await params

  const thesis = await prisma.thesis.findFirst({ where: { id, tenantId, studentId } })
  if (!thesis) return NextResponse.json({ message: 'Not found.' }, { status: 404 })
  if (thesis.status === 'APPROVED' || thesis.status === 'PUBLISHED') {
    return NextResponse.json({ message: 'Cannot edit an approved or published thesis.' }, { status: 400 })
  }

  const body = await req.json()
  const { title, abstract, department, program, academicYear, tags } = body

  const updated = await prisma.thesis.update({
    where: { id },
    data: {
      title:        title?.trim()        || thesis.title,
      abstract:     abstract?.trim()     ?? thesis.abstract,
      department:   department?.trim()   ?? thesis.department,
      program:      program?.trim()      ?? thesis.program,
      academicYear: academicYear?.trim() ?? thesis.academicYear,
      tags:         Array.isArray(tags)  ? tags : thesis.tags,
    },
    include: {
      supervisor: { select: { id: true, firstName: true, lastName: true } },
      versions: { orderBy: { version: 'desc' } },
      feedbacks: {
        where: { isPrivate: false },
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return NextResponse.json(updated)
}
