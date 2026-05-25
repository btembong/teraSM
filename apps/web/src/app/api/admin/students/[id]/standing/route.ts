import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const adminId = (session.user as any).id
  const { id: studentId } = await params
  const { standing, note } = await req.json()

  const db = prisma as any

  // Update user standing
  await prisma.user.update({
    where: { id: studentId },
    data: { academicStanding: standing, standingNote: note || null },
  })

  // Log the change
  await db.academicStandingLog.create({
    data: { tenantId, studentId, standing, note: note || null, changedBy: adminId },
  })

  // Notify the student
  const labels: Record<string, string> = {
    GOOD_STANDING: 'Good Standing',
    PROBATION: 'Academic Probation',
    SUSPENDED: 'Suspended',
    DISMISSED: 'Dismissed',
  }
  await prisma.notification.create({
    data: {
      tenantId,
      userId: studentId,
      title: `Academic Standing Updated`,
      body: `Your academic standing has been updated to: ${labels[standing] ?? standing}.${note ? ` Note: ${note}` : ''}`,
      type: 'GENERAL' as any,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: studentId } = await params

  const db = prisma as any
  const logs = await db.academicStandingLog.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  // Enrich with admin names
  const adminIds = [...new Set(logs.map((l: any) => l.changedBy))]
  const admins = await prisma.user.findMany({
    where: { id: { in: adminIds as string[] } },
    select: { id: true, firstName: true, lastName: true },
  })
  const adminMap = Object.fromEntries(admins.map(a => [a.id, a]))
  return NextResponse.json(logs.map((l: any) => ({ ...l, changedByUser: adminMap[l.changedBy] ?? null })))
}
