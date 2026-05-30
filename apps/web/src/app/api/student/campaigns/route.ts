import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/student/campaigns — returns active banner/popup campaigns for the student portal
export async function GET() {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = session.user.tenantId
  const now = new Date()

  const campaigns = await prisma.campaign.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [{ audience: 'ALL' }, { audience: 'STUDENTS' }],
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt:   null }, { endsAt:   { gte: now } }] },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })

  // Track view count (fire-and-forget)
  if (campaigns.length > 0) {
    const ids = campaigns.map((c: any) => c.id)
    ;prisma.campaign.updateMany({
      where: { id: { in: ids } },
      data:  { viewCount: { increment: 1 } },
    }).catch(() => {})
  }

  return NextResponse.json(campaigns)
}
