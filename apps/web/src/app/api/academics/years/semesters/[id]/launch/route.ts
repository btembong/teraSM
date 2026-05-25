import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const tenantId = (session.user as any).tenantId

  // Confirm semester belongs to this tenant
  const semester = await (prisma as any).semester.findFirst({
    where: { id, tenantId },
    include: { academicYear: true },
  })
  if (!semester) return NextResponse.json({ error: 'Semester not found' }, { status: 404 })
  if (semester.status === 'ACTIVE') {
    return NextResponse.json({ error: 'This semester is already active' }, { status: 400 })
  }

  // Previously ACTIVE semester → COMPLETED (it has ended)
  await (prisma as any).semester.updateMany({
    where: { tenantId, id: { not: id }, status: 'ACTIVE' },
    data: { status: 'COMPLETED', isCurrent: false },
  })

  // Everything else (UPCOMING) stays UPCOMING, just remove isCurrent
  await (prisma as any).semester.updateMany({
    where: { tenantId, id: { not: id }, status: 'UPCOMING' },
    data: { isCurrent: false },
  })

  // Mark the academic year of this semester as current, others not
  await prisma.academicYear.updateMany({
    where: { tenantId },
    data: { isCurrent: false },
  })
  await prisma.academicYear.update({
    where: { id: semester.academicYearId },
    data: { isCurrent: true },
  })

  // Launch this semester
  const launched = await (prisma as any).semester.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      isCurrent: true,
      launchedAt: new Date(),
      launchedBy: session.user.id,
    },
  })

  return NextResponse.json(launched)
}
