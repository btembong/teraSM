import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/student/campaigns/[id]/dismiss — increment dismissCount
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await prisma.campaign.updateMany({
    where: { id, tenantId: session.user.tenantId },
    data:  { dismissCount: { increment: 1 } },
  })

  return NextResponse.json({ success: true })
}
