import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/staff/thesis — list theses supervised by this staff member
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id: supervisorId, tenantId } = session.user as any

  const theses = await prisma.thesis.findMany({
    where: { tenantId, supervisorId },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true } },
      versions: { orderBy: { version: 'desc' }, take: 1 },
      feedbacks: {
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(theses)
}
