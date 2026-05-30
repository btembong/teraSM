import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/thesis — list all theses for the tenant
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { tenantId, role } = session.user as any
  if (!['TENANT_ADMIN', 'REGISTRAR'].includes(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const supervisorId = searchParams.get('supervisorId') || undefined

  const theses = await prisma.thesis.findMany({
    where: {
      tenantId,
      ...(status ? { status: status as any } : {}),
      ...(supervisorId ? { supervisorId } : {}),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true } },
      supervisor: { select: { id: true, firstName: true, lastName: true } },
      versions: { orderBy: { version: 'desc' }, take: 1 },
      feedbacks: { orderBy: { createdAt: 'desc' }, take: 3, include: { author: { select: { id: true, firstName: true, lastName: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(theses)
}
